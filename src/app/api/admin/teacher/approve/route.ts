import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentTeacher } from '@/lib/session';

export const runtime = 'nodejs';

/**
 * POST /api/admin/teacher/approve
 * Body: { teacherId, action: 'APPROVE' | 'REJECT' }
 * Admin only — approves or rejects a pending teacher signup.
 */
export async function POST(req: NextRequest) {
  const admin = await getCurrentTeacher();
  if (!admin || admin.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Admin only' }, { status: 403 });
  }
  const { teacherId, action } = await req.json();
  if (!teacherId || !['APPROVE', 'REJECT'].includes(action)) {
    return NextResponse.json({ error: 'teacherId and action (APPROVE or REJECT) required' }, { status: 400 });
  }

  const target = await db.teacher.findUnique({ where: { id: teacherId } });
  if (!target) {
    return NextResponse.json({ error: 'Teacher not found' }, { status: 404 });
  }
  if (target.role === 'ADMIN') {
    return NextResponse.json({ error: 'Cannot modify admin accounts' }, { status: 400 });
  }

  const newStatus = action === 'APPROVE' ? 'APPROVED' : 'REJECTED';
  const updated = await db.teacher.update({
    where: { id: teacherId },
    data: { status: newStatus },
    select: { id: true, username: true, fullName: true, status: true },
  });

  return NextResponse.json({
    ok: true,
    teacher: updated,
    message: action === 'APPROVE'
      ? `${updated.fullName} (@${updated.username}) has been approved. They can now log in.`
      : `${updated.fullName} (@${updated.username}) has been rejected.`,
  });
}
