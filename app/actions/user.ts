'use server';

import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';
import { signToken } from '@/lib/auth';
import { getSession } from '@/lib/session';
import { revalidatePath } from 'next/cache';
import { query, queryOne } from '@/lib/db';

export async function changePassword(formData: FormData) {
  const password = formData.get('password') as string;
  const confirmPassword = formData.get('confirmPassword') as string;
  const userId = formData.get('userId') as string;

  if (password !== confirmPassword) {
    return { error: 'Las contraseñas no coinciden' };
  }

  if (password.length < 6) {
    return { error: 'La contraseña debe tener al menos 6 caracteres' };
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const user = await queryOne<{
    id: string;
    username: string;
    name: string;
    role: string;
    couple_id: string | null;
    must_change_password: boolean;
  }>(
    `update users
     set password_hash = $1, must_change_password = false, updated_at = now()
     where id = $2
     returning id, username, name, role, couple_id, must_change_password`,
    [passwordHash, userId],
  );

  if (!user) {
    return { error: 'No se pudo actualizar el usuario' };
  }

  const payload = {
    id: user.id,
    username: user.username,
    name: user.name,
    role: user.role,
    coupleId: user.couple_id,
    mustChangePassword: user.must_change_password,
  };

  const token = signToken(payload);
  const cookieStore = await cookies();
  cookieStore.set('auth_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: '/',
  });

  return { success: true, redirectTo: '/dashboard' };
}

export async function createPartner(formData: FormData) {
  const session = await getSession();
  if (!session || session.role !== 'OWNER') {
    return { error: 'Solo el usuario administrador puede crear la cuenta de pareja' };
  }

  const name = formData.get('name') as string;
  const username = formData.get('username') as string;
  const tempPassword = formData.get('password') as string;
  const ownerId = session.id;

  if (!name || !username || !tempPassword) {
    return { error: 'Completa todos los campos' };
  }

  if (tempPassword.length < 6) {
    return { error: 'La contraseña temporal debe tener al menos 6 caracteres' };
  }

  const currentPartner = await queryOne<{ id: string }>(
    `select id from users
     where role = 'PARTNER' and created_by_id = $1
     limit 1`,
    [ownerId],
  );

  if (currentPartner) {
    return { error: 'Ya existe un usuario de pareja vinculado a esta cuenta' };
  }

  const existing = await queryOne<{ id: string }>(
    'select id from users where username = $1 limit 1',
    [username.trim()],
  );

  if (existing) {
    return { error: 'El nombre de usuario ya existe' };
  }

  const passwordHash = await bcrypt.hash(tempPassword, 10);

  await query(
    `insert into users (name, username, password_hash, role, must_change_password, couple_id, created_by_id)
     values ($1, $2, $3, 'PARTNER', true, $4, $5)`,
    [name.trim(), username.trim(), passwordHash, ownerId, ownerId],
  );

  await query('update users set couple_id = $1, updated_at = now() where id = $1', [ownerId]);

  revalidatePath('/settings');
  return { success: true };
}
