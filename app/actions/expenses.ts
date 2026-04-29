'use server';

import { getSession } from '@/lib/session';
import { revalidatePath } from 'next/cache';
import { coupleScopeId, splitShares } from '@/lib/finance';
import { query, queryOne } from '@/lib/db';

export async function createExpense(formData: FormData) {
  const session = await getSession();
  if (!session) throw new Error('No session');

  const type = formData.get('type') as string;
  const category = formData.get('category') as string;
  const amount = formData.get('amount') as string;
  const paymentMethod = formData.get('paymentMethod') as string;
  const cardId = formData.get('cardId') as string;
  const date = formData.get('date') as string;
  const visibility = formData.get('visibility') as string;
  const splitType = formData.get('splitType') as string;
  const ownerShare = Number(formData.get('ownerShare') || 50);
  const ownerContribution = Number(formData.get('ownerContribution') || 0);
  const partnerContribution = Number(formData.get('partnerContribution') || 0);
  const receiptFile = formData.get('receiptFile') as File | null;

  if (!type || !category || !amount || !paymentMethod || !date) {
    return { error: 'Completa todos los campos obligatorios' };
  }

  const numericAmount = Number(amount);
  if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
    return { error: 'El monto debe ser mayor a cero' };
  }

  const allowedReceiptTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
  if (receiptFile && receiptFile.size > 0 && !allowedReceiptTypes.includes(receiptFile.type)) {
    return { error: 'El comprobante debe ser JPG, PNG, WEBP o PDF' };
  }

  let normalizedCardId: string | null = null;
  if (cardId) {
    const card = await queryOne<{ id: string; cardType: string }>(
      `select id, card_type as "cardType"
       from credit_cards
       where id = $1
         and (user_id = $2 or visibility = 'SHARED')
       limit 1`,
      [cardId, session.id],
    );

    if (!card) {
      return { error: 'La tarjeta seleccionada no está disponible para este usuario' };
    }
    normalizedCardId = card.id;
  }

  const splitData = visibility === 'SHARED'
    ? {
        shares: splitShares(splitType || '50/50', ownerShare),
        contributions: {
          owner: ownerContribution,
          partner: partnerContribution,
        },
      }
    : null;
  
  const newExpense = await queryOne<{ id: string }>(
    `insert into expenses
      (user_id, paid_by_id, type, category, amount, payment_method, date, visibility, card_id, split_type, split_data, ocr_status)
     values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11::jsonb, $12)
     returning id`,
    [
      session.id,
      session.id,
      type.trim(),
      category,
      amount,
      paymentMethod,
      date,
      visibility === 'SHARED' ? 'SHARED' : 'PRIVATE',
      normalizedCardId,
      visibility === 'SHARED' ? splitType || '50/50' : null,
      splitData ? JSON.stringify(splitData) : null,
      receiptFile && receiptFile.size > 0 ? 'MANUAL_REVIEW' : null,
    ],
  );

  if (newExpense && receiptFile && receiptFile.size > 0) {
    const receipt = await queryOne<{ id: string }>(
      `insert into receipts
        (user_id, expense_id, file_name, file_type, ocr_status, extracted_data)
       values ($1, $2, $3, $4, 'MANUAL_REVIEW', $5::jsonb)
       returning id`,
      [
        session.id,
        newExpense.id,
        receiptFile.name,
        receiptFile.type,
        JSON.stringify({
          fileSize: receiptFile.size,
          note: 'Archivo recibido. Pendiente de OCR o revisión manual.',
        }),
      ],
    );

    if (receipt) {
      await query(
        `update expenses
         set receipt_id = $1, updated_at = now()
         where id = $2`,
        [receipt.id, newExpense.id],
      );
    }
  }

  if (newExpense && normalizedCardId) {
    await query(
      `update credit_cards
       set balance = case
           when card_type = 'DEBIT' then greatest(0, balance - $1::numeric)
           else balance + $1::numeric
         end,
         updated_at = now()
       where id = $2`,
      [amount, normalizedCardId],
    );
  }

  if (newExpense && visibility === 'SHARED' && session.coupleId) {
    const scope = coupleScopeId(session);
    const otherUser = await queryOne<{ id: string; role: string }>(
      'select id, role from users where couple_id = $1 and id <> $2 limit 1',
      [scope, session.id],
    );

    if (otherUser) {
      const shares = splitShares(splitType || '50/50', ownerShare);
      const otherShare = otherUser.role === 'OWNER' ? shares.owner : shares.partner;
      const owerExpected = (numericAmount * otherShare) / 100;
      const otherPaid = otherUser.role === 'OWNER' ? ownerContribution : partnerContribution;
      const owerAmount = Math.max(0, owerExpected - otherPaid);

      if (owerAmount > 0) {
        await query(
          `insert into couple_balances (couple_id, payer_id, ower_id, amount, expense_id, status)
           values ($1, $2, $3, $4, $5, 'PENDING')`,
          [scope, session.id, otherUser.id, owerAmount.toFixed(2), newExpense.id],
        );
      }
    }
  }

  revalidatePath('/expenses');
  revalidatePath('/dashboard');
  revalidatePath('/shared');
  return { success: true };
}
