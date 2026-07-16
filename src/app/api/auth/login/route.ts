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
      return NextResponse.json({ error: 'Invalid username or password.' }, { status: 401 });
    }
    // Block login if account is not approved
    if (teacher.status === 'PENDING') {
      return NextResponse.json(
        { error: 'Your account is awaiting admin approval. Please check back later.' },
        { status: 403 }
      );
    }
    if (teacher.status === 'REJECTED') {
      return NextResponse.json(
        { error: 'Your signup request was not approved. Please contact the school administrator.' },
        { status: 403 }
      );
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
    demo: { admin: 'Ariyo / Samuel2474life', teacher1: 'teacher123' },
  });
}

