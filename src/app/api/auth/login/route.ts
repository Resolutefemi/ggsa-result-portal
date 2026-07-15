import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifySecret } from '@/lib/auth';
import { setSession } from '@/lib/session';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json();
    if (!username || !password) {
      return NextResponse.json({ error: 'Username and password required' }, { status: 400 });
    }
    const teacher = await db.teacher.findUnique({ where: { username } });
    if (!teacher || !verifySecret(password, teacher.passwordHash)) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }
    await setSession(teacher.id, teacher.username);
    return NextResponse.json({
      id: teacher.id,
      username: teacher.username,
      fullName: teacher.fullName,
      role: teacher.role,
      subject: teacher.subject,
    });
  } catch (e) {
    console.error('[auth/login]', e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Teacher login endpoint. POST {username, password}.',
    demo: { admin: 'admin123', teacher1: 'teacher123' },
  });
}
