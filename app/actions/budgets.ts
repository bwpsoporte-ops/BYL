'use server';

import { getSession } from '@/lib/session';
import { currentPeriod } from '@/lib/finance';
import { revalidatePath } from 'next/cache';
import { query } from '@/lib/db';

export async function createBudget(formData: FormData) {
  const session = await getSession();
  if (!session) throw new Error('No session');

  const category = formData.get('category') as string;
  const monthlyLimit = formData.get('monthlyLimit') as string;
  const visibility = formData.get('visibility') as string;
  const period = currentPeriod();

  if (!category || !monthlyLimit) {
    return { error: 'Selecciona categoria y limite mensual' };
  }

  if (Number(monthlyLimit) <= 0) {
    return { error: 'El limite mensual debe ser mayor a cero' };
  }

  try {
    await query(
      `insert into budgets (user_id, category, monthly_limit, month, year, visibility)
       values ($1, $2, $3, $4, $5, $6)
       on conflict (user_id, category, month, year)
       do update set monthly_limit = excluded.monthly_limit, visibility = excluded.visibility, updated_at = now()`,
      [session.id, category, monthlyLimit, period.month, period.year, visibility === 'SHARED' ? 'SHARED' : 'PRIVATE'],
    );
  } catch (error) {
    console.error('Create budget error:', error);
    return { error: 'No se pudo guardar el presupuesto. Revisa la base de datos.' };
  }

  revalidatePath('/budgets');
  revalidatePath('/dashboard');
  return { success: true };
}
