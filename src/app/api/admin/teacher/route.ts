import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentTeacher } from '@/lib/session';
import { hashSecret } from '@/lib/auth';

export const runtime = 'nodejs';

// GET /api/admin/teacher - list teachers
export async function GET() {
  const teacher = await getCurrentTeacher();
  if (!teacher || teacher.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Admin only' }, { status: 403 });
  }
  const teachers = await db.teacher.findMany({
    include: {
      classes: { include: { class: true } },
    },
    orderBy: { fullName: 'asc' },
  });
  return NextResponse.json({ teachers });
}

// POST - create teacher
export async function POST(req: NextRequest) {
  const teacher = await getCurrentTeacher();
  if (!teacher || teacher.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Admin only' }, { status: 403 });
  }
  const { username, password, fullName, email, subject, role, classIds } = await req.json();
  if (!username || !password || !fullName) {
    return NextResponse.json({ error: 'username, password, fullName required' }, { status: 400 });
  }
  try {
    const t = await db.teacher.create({
      data: {
        username,
        passwordHash: hashSecret(password),
        fullName,
        email,
        subject,
        role: role || 'TEACHER',
        status: 'APPROVED', // admin-created teachers are auto-approved
        classes: classIds?.length
          ? { create: classIds.map((cid: string) => ({ classId: cid })) }
          : undefined,
      },
      include: { classes: true },
    });
    return NextResponse.json({ teacher: t });
  } catch (e: any) {
    if (e?.code === 'P2002') {
      return NextResponse.json({ error: 'Username already exists' }, { status: 400 });
    }
    throw e;
  }
}

// PUT - update teacher
export async function PUT(req: NextRequest) {
  const teacher = await getCurrentTeacher();
  if (!teacher || teacher.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Admin only' }, { status: 403 });
  }
  const { id, username, password, fullName, email, subject, role, classIds } = await req.json();
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
  const data: any = { username, fullName, email, subject, role };
  if (password) data.passwordHash = hashSecret(password);
  Object.keys(data).forEach((k) => data[k] === undefined && delete data[k]);

  const t = await db.teacher.update({ where: { id }, data });

  if (classIds) {
    await db.classAssignment.deleteMany({ where: { teacherId: id } });
    for (const cid of classIds) {
      await db.classAssignment.create({ data: { teacherId: id, classId: cid } }).catch(() => {});
    }
  }

  return NextResponse.json({ teacher: t });
}

// DELETE /api/admin/teacher?id=...
export async function DELETE(req: NextRequest) {
  const teacher = await getCurrentTeacher();
  if (!teacher || teacher.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Admin only' }, { status: 403 });
  }
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
  await db.teacher.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
