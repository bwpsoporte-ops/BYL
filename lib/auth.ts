import jwt from 'jsonwebtoken';

const SECRET = process.env.JWT_SECRET || 'secret';

export interface UserPayload {
  id: string;
  username: string;
  name: string;
  role: string;
  coupleId: string | null;
  mustChangePassword: boolean;
}

export function signToken(payload: UserPayload): string {
  return jwt.sign(payload, SECRET, { expiresIn: '7d' });
}

export function verifyToken(token: string): UserPayload | null {
  try {
    return jwt.verify(token, SECRET) as UserPayload;
  } catch (err) {
    return null;
  }
}
