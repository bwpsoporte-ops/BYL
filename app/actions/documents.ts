'use server';

import { getSession } from '@/lib/session';
import { revalidatePath } from 'next/cache';
import { query } from '@/lib/db';
import crypto from 'node:crypto';

const RECEIPT_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
const STATEMENT_TYPES = ['application/pdf', 'text/csv', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'image/jpeg', 'image/png', 'image/webp'];

function extensionType(file: File) {
  return file.type || file.name.split('.').pop()?.toUpperCase() || 'UNKNOWN';
}

function fingerprint(userId: string, values: string[]) {
  return crypto.createHash('sha256').update([userId, ...values].join('|')).digest('hex');
}

export async function registerReceipt(formData: FormData) {
  const session = await getSession();
  if (!session) throw new Error('No session');

  const file = formData.get('receiptFile') as File | null;
  const merchant = formData.get('merchant') as string;
  const total = formData.get('total') as string;
  const receiptDate = formData.get('receiptDate') as string;

  if (!file || file.size === 0) {
    return { error: 'Sube un comprobante en JPG, PNG, WEBP o PDF' };
  }

  if (!RECEIPT_TYPES.includes(file.type)) {
    return { error: 'El comprobante debe ser JPG, PNG, WEBP o PDF' };
  }

  await query(
    `insert into receipts
      (user_id, file_name, file_type, merchant, total, receipt_date, ocr_status, extracted_data)
     values ($1, $2, $3, $4, $5, $6, 'MANUAL_REVIEW', $7::jsonb)`,
    [
      session.id,
      file.name,
      extensionType(file),
      merchant || null,
      total || null,
      receiptDate || null,
      JSON.stringify({
        fileSize: file.size,
        mimeType: file.type,
        note: 'Archivo recibido. El gasto se crea solo tras confirmacion del usuario.',
      }),
    ],
  );

  revalidatePath('/documents');
  return { success: true };
}

export async function registerBankStatement(formData: FormData) {
  const session = await getSession();
  if (!session) throw new Error('No session');

  const file = formData.get('statementFile') as File | null;
  const bank = formData.get('bank') as string;
  const periodStart = formData.get('periodStart') as string;
  const periodEnd = formData.get('periodEnd') as string;

  if (!file || file.size === 0) {
    return { error: 'Sube un estado de cuenta en PDF, CSV, XLSX o imagen' };
  }

  if (!STATEMENT_TYPES.includes(file.type)) {
    return { error: 'El estado debe ser PDF, CSV, XLSX o imagen' };
  }

  const statement = await query<{ id: string }>(
    `insert into bank_statements
      (user_id, file_name, file_type, bank, period_start, period_end, status)
     values ($1, $2, $3, $4, $5, $6, 'PENDING_CONFIRMATION')
     returning id`,
    [session.id, file.name, extensionType(file), bank || null, periodStart || null, periodEnd || null],
  );

  const statementId = statement.rows[0]?.id;
  if (statementId && (file.type === 'text/csv' || file.name.toLowerCase().endsWith('.csv'))) {
    const text = await file.text();
    const rows = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean).slice(0, 250);
    const dataRows = rows.slice(1);

    for (const row of dataRows) {
      const columns = row.split(',').map((value) => value.trim().replace(/^"|"$/g, ''));
      const [movementDate, description, rawAmount] = columns;
      const amount = Number(String(rawAmount || '').replace(/[^\d.-]/g, ''));
      if (!movementDate || !description || !Number.isFinite(amount)) continue;

      const movementType = amount >= 0 ? 'INCOME' : 'EXPENSE';
      const fp = fingerprint(session.id, [movementDate, description, String(amount)]);

      await query(
        `insert into bank_movements
          (statement_id, user_id, movement_date, description, amount, suggested_category, movement_type, status, fingerprint)
         values ($1, $2, $3, $4, $5, 'Otro', $6, 'PENDING_CONFIRMATION', $7)
         on conflict (user_id, fingerprint) do nothing`,
        [statementId, session.id, movementDate, description, Math.abs(amount).toFixed(2), movementType, fp],
      );
    }
  }

  revalidatePath('/documents');
  return { success: true };
}
