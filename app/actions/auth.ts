'use server';

import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';
import { signToken } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { queryOne } from '@/lib/db';

export async function loginUser(formData: FormData) {
  const username = formData.get('username') as string;
  const password = formData.get('password') as string;

  if (!username || !password) {
    return { error: 'Se requieren usuario y contraseña' };
  }

  let user;
  try {
    user = await queryOne<{
      id: string;
      username: string;
      name: string;
      password_hash: string;
      role: string;
      couple_id: string | null;
      must_change_password: boolean;
    }>(
      `select id, username, name, password_hash, role, couple_id, must_change_password
       from users
       where username = $1
       limit 1`,
      [username.trim()],
    );
  } catch (error) {
    console.error('Login database error:', error);
    return {
      error: 'No se pudo conectar con la base de datos. Ejecuta el SQL de db/NEON_DATABASE.md en Neon y revisa DATABASE_URL.',
    };
  }

  if (!user) {
    return { error: 'Usuario no encontrado' };
  }

  const match = await bcrypt.compare(password, user.password_hash);
  if (!match) {
    return { error: 'Contraseña incorrecta' };
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

  return {
    success: true,
    redirectTo: user.must_change_password ? '/change-password' : '/dashboard',
  };
}

export async function logoutUser() {
  const cookieStore = await cookies();
  cookieStore.delete('auth_token');
  redirect('/login');
}
