'use server';

import { getSession } from '@/lib/session';
import { revalidatePath } from 'next/cache';
import { query } from '@/lib/db';

export async function createProject(formData: FormData) {
  const session = await getSession();
  if (!session) throw new Error('No session');

  const name = formData.get('name') as string;
  const targetAmount = formData.get('targetAmount') as string;
  const targetDate = formData.get('targetDate') as string;
  const visibility = formData.get('visibility') as string;

  if (!name || !targetAmount || !targetDate) {
    return { error: 'Completa nombre, meta y fecha' };
  }
  
  await query(
    `insert into projects (user_id, name, target_amount, target_date, current_amount, visibility)
     values ($1, $2, $3, $4, 0, $5)`,
    [session.id, name, targetAmount, targetDate, visibility === 'SHARED' ? 'SHARED' : 'PRIVATE'],
  );

  revalidatePath('/projects');
  return { success: true };
}

export async function addProjectContribution(formData: FormData) {
  const session = await getSession();
  if (!session) throw new Error('No session');

  const projectId = formData.get('projectId') as string;
  const amount = formData.get('amount') as string;
  const date = (formData.get('date') as string) || new Date().toISOString().slice(0, 10);
  const note = formData.get('note') as string;

  if (!projectId || !amount) {
    return { error: 'Indica el proyecto y el monto del aporte' };
  }

  await query('begin');
  try {
    await query(
      `insert into project_contributions (project_id, user_id, amount, date, note)
       values ($1, $2, $3, $4, $5)`,
      [projectId, session.id, amount, date, note || null],
    );
    await query(
      'update projects set current_amount = current_amount + $1, updated_at = now() where id = $2',
      [amount, projectId],
    );
    await query('commit');
  } catch (error) {
    await query('rollback');
    throw error;
  }

  revalidatePath('/projects');
  revalidatePath('/dashboard');
  return { success: true };
}
