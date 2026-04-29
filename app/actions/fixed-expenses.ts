'use server';

import { getSession } from '@/lib/session';
import { revalidatePath } from 'next/cache';
import { query } from '@/lib/db';

export async function createFixedExpense(formData: FormData) {
  const session = await getSession();
  if (!session) throw new Error('No session');

  const name = formData.get('name') as string;
  const amount = formData.get('amount') as string;
  const dayOfMonth = Number(formData.get('dayOfMonth') || 1);
  const category = formData.get('category') as string;
  const paymentMethod = formData.get('paymentMethod') as string;
  const visibility = formData.get('visibility') as string;

  if (!name || !amount) {
    return { error: 'Completa nombre y monto' };
  }

  if (Number(amount) <= 0) {
    return { error: 'El monto debe ser mayor a cero' };
  }

  if (dayOfMonth < 1 || dayOfMonth > 31) {
    return { error: 'El dia de pago debe estar entre 1 y 31' };
  }

  try {
    await query(
      `insert into fixed_expenses
        (user_id, name, amount, day_of_month, category, payment_method, visibility)
       values ($1, $2, $3, $4, $5, $6, $7)`,
      [
        session.id,
        name.trim(),
        amount,
        dayOfMonth,
        category || 'Servicios del hogar',
        paymentMethod || 'Banco',
        visibility === 'SHARED' ? 'SHARED' : 'PRIVATE',
      ],
    );
  } catch (error) {
    console.error('Create fixed expense error:', error);
    return { error: 'No se pudo guardar el gasto fijo. Revisa la base de datos.' };
  }

  revalidatePath('/fixed-expenses');
  revalidatePath('/dashboard');
  return { success: true };
}

export async function payFixedExpense(formData: FormData) {
  const session = await getSession();
  if (!session) throw new Error('No session');

  const fixedExpenseId = formData.get('fixedExpenseId') as string;
  const amount = formData.get('amount') as string;
  const name = formData.get('name') as string;
  const category = formData.get('category') as string;
  const paymentMethod = formData.get('paymentMethod') as string;
  const visibility = formData.get('visibility') as string;
  const paidAt = new Date().toISOString().slice(0, 10);

  await query('begin');
  try {
    await query(
      `insert into expenses (user_id, paid_by_id, type, category, amount, payment_method, date, visibility)
       values ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [session.id, session.id, name, category, amount, paymentMethod, paidAt, visibility === 'SHARED' ? 'SHARED' : 'PRIVATE'],
    );
    await query(
      `update fixed_expenses set last_paid_at = $1, status = 'ACTIVE', updated_at = now() where id = $2`,
      [paidAt, fixedExpenseId],
    );
    await query('commit');
  } catch (error) {
    await query('rollback');
    throw error;
  }

  revalidatePath('/fixed-expenses');
  revalidatePath('/expenses');
  revalidatePath('/dashboard');
  return { success: true };
}
