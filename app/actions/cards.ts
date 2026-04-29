'use server';

import { getSession } from '@/lib/session';
import { revalidatePath } from 'next/cache';
import { query, queryOne } from '@/lib/db';

export async function createCard(formData: FormData) {
  const session = await getSession();
  if (!session) throw new Error('No session');

  const bank = formData.get('bank') as string;
  const name = formData.get('name') as string;
  const rawCardNumber = formData.get('cardNumber') as string;
  const digits = String(rawCardNumber || '').replace(/\D/g, '');
  const lastFour = digits.slice(-4);
  const cardBrand = detectCardBrand(digits);
  const cardType = formData.get('cardType') as string;
  const creditLimit = formData.get('creditLimit') as string;
  const balance = formData.get('balance') as string;
  const cutDate = formData.get('cutDate') as string;
  const dueDate = formData.get('dueDate') as string;
  const minPayment = formData.get('minPayment') as string;
  const visibility = formData.get('visibility') as string;
  const imageUrl = formData.get('imageUrl') as string;
  const isCredit = cardType !== 'DEBIT';

  if (!bank || !name || !digits || !cardType) {
    return { error: 'Completa todos los campos obligatorios' };
  }

  if (digits.length < 12 || digits.length > 19) {
    return { error: 'Ingresa un número de tarjeta válido' };
  }

  if (isCredit && (!creditLimit || !cutDate || !dueDate)) {
    return { error: 'Las tarjetas de crédito necesitan límite, corte y fecha de pago' };
  }
  
  await query(
    `insert into credit_cards
      (user_id, bank, name, last_four, card_brand, card_type, credit_limit, balance, cut_date, due_date, min_payment, visibility, image_url, wallet_enabled)
     values ($1, $2, $3, $4, $5, $6, $7, $8, $9::date, $10::date, $11, $12, $13, false)`,
    [
      session.id,
      bank.trim(),
      name.trim(),
      lastFour,
      cardBrand,
      isCredit ? 'CREDIT' : 'DEBIT',
      isCredit ? creditLimit : '0',
      balance || '0',
      isCredit ? cutDate : null,
      isCredit ? dueDate : null,
      isCredit ? minPayment || '0' : '0',
      visibility === 'SHARED' ? 'SHARED' : 'PRIVATE',
      imageUrl?.trim() || null,
    ],
  );

  revalidatePath('/cards');
  revalidatePath('/dashboard');
  return { success: true };
}

function detectCardBrand(digits: string) {
  if (/^4/.test(digits)) return 'VISA';
  if (/^(5[1-5]|2[2-7])/.test(digits)) return 'MASTERCARD';
  if (/^3[47]/.test(digits)) return 'AMEX';
  return 'OTRA';
}

export async function deleteCard(formData: FormData) {
  const session = await getSession();
  if (!session) throw new Error('No session');

  const cardId = formData.get('cardId') as string;
  if (!cardId) return { error: 'Tarjeta no indicada' };

  const card = await queryOne<{ id: string }>(
    `select id from credit_cards
     where id = $1 and user_id = $2
     limit 1`,
    [cardId, session.id],
  );

  if (!card) {
    return { error: 'No puedes eliminar esta tarjeta' };
  }

  await query('delete from credit_cards where id = $1 and user_id = $2', [cardId, session.id]);
  revalidatePath('/cards');
  revalidatePath('/dashboard');
  revalidatePath('/expenses');
  return { success: true };
}
