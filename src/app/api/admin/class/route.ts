import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentTeacher } from '@/lib/session';
import { DEFAULT_SUBJECTS } from '@/lib/constants';

export const runtime = 'nodejs';

// GET /api/admin/class - list all classes
export async function GET() {
  const teacher = await getCurrentTeacher();
  if (!teacher || teacher.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Admin only' }, { status: 403 });
  }
  const classes = await db.class.findMany({
    include: {
      _count: { select: { students: true, subjects: true, teachers: true } },
    },
    orderBy: { name: 'asc' },
  });
  return NextResponse.json({ classes });
}

// POST - create class
export async function POST(req: NextRequest) {
  const teacher = await getCurrentTeacher();
  if (!teacher || teacher.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Admin only' }, { status: 403 });
  }
  const { name, category } = await req.json();
  if (!name) return NextResponse.json({ error: 'name required' }, { status: 400 });
  const cls = await db.class.create({
    data: { name, category: category || 'JUNIOR' },
  });

  // Auto-assign default subjects matching the category
  const subjects = await db.subject.findMany({
    where: {
      OR: [
        { category: 'BOTH' },
        { category: category || 'JUNIOR' },
      ],
    },
  });
  for (const s of subjects) {
    await db.classSubject.create({
      data: { classId: cls.id, subjectId: s.id },
    }).catch(() => {}); // ignore duplicates
  }

  return NextResponse.json({ class: cls });
}

// DELETE /api/admin/class?id=...
export async function DELETE(req: NextRequest) {
  const teacher = await getCurrentTeacher();
  if (!teacher || teacher.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Admin only' }, { status: 403 });
  }
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
  await db.class.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
