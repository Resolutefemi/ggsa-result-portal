import { NextResponse } from 'next/server';
import { clearSession, getCurrentTeacher } from '@/lib/session';

export const runtime = 'nodejs';

export async function POST() {
  await clearSession();
  return NextResponse.json({ ok: true });
}

export async function GET() {
  const teacher = await getCurrentTeacher();
  if (!teacher) return NextResponse.json({ authenticated: false });
  return NextResponse.json({
    authenticated: true,
    teacher: {
      id: teacher.id,
      username: teacher.username,
      fullName: teacher.fullName,
      role: teacher.role,
      subject: teacher.subject,
    },
  });
}
