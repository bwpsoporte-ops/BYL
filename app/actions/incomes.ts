'use server';

import { getSession } from '@/lib/session';
import { revalidatePath } from 'next/cache';
import { query } from '@/lib/db';

export async function createIncome(formData: FormData) {
  const session = await getSession();
  if (!session) throw new Error('No session');

  const type = formData.get('type') as string;
  const amount = formData.get('amount') as string;
  const description = formData.get('description') as string;
  const date = formData.get('date') as string;
  const visibility = formData.get('visibility') as string;
  const isRecurring = formData.get('isRecurring') === 'on';
  const recurrenceFrequency = formData.get('recurrenceFrequency') as string;

  if (!type || !amount || !date) {
    return { error: 'Completa tipo, monto y fecha' };
  }
  
  await query(
    `insert into incomes
      (user_id, type, amount, description, date, visibility, is_recurring, recurrence_frequency, next_run_date)
     values ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
    [
      session.id,
      type,
      amount,
      description || null,
      date,
      visibility === 'SHARED' ? 'SHARED' : 'PRIVATE',
      isRecurring,
      isRecurring ? recurrenceFrequency || 'MONTHLY' : null,
      isRecurring ? date : null,
    ],
  );

  revalidatePath('/incomes');
  revalidatePath('/dashboard');
  return { success: true };
}
