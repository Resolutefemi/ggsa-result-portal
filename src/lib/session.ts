/**
 * Server-side session helper.
 * Uses a signed cookie to track the logged-in teacher.
 * (Lightweight - no NextAuth needed for this internal school tool.)
 */
import { cookies } from 'next/headers';
import crypto from 'crypto';
import { db } from './db';

const SESSION_SECRET = process.env.SESSION_SECRET || 'ggsa-session-secret-2026';
const COOKIE_NAME = 'ggsa_session';

function sign(payload: string): string {
  const sig = crypto.createHmac('sha256', SESSION_SECRET).update(payload).digest('hex');
  return `${payload}.${sig}`;
}

function verify(token: string): string | null {
  const [payload, sig] = token.split('.');
  if (!payload || !sig) return null;
  const expected = crypto.createHmac('sha256', SESSION_SECRET).update(payload).digest('hex');
  if (sig !== expected) return null;
  return payload;
}

export async function setSession(teacherId: string, username: string): Promise<void> {
  const payload = JSON.stringify({ id: teacherId, username, t: Date.now() });
  const token = sign(Buffer.from(payload).toString('base64'));
  const store = await cookies();
  store.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
}

export async function clearSession(): Promise<void> {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}

export async function getCurrentTeacher() {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  if (!token) return null;
  const payload = verify(token);
  if (!payload) return null;
  try {
    const data = JSON.parse(Buffer.from(payload, 'base64').toString('utf-8'));
    if (!data.id) return null;
    const teacher = await db.teacher.findUnique({ where: { id: data.id } });
    return teacher;
  } catch {
    return null;
  }
}
