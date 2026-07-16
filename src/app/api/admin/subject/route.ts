import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentTeacher } from '@/lib/session';
import { DEFAULT_SUBJECTS } from '@/lib/constants';

export const runtime = 'nodejs';

// GET - list subjects
export async function GET(req: NextRequest) {
  const teacher = await getCurrentTeacher();
  if (!teacher) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const subjects = await db.subject.findMany({ orderBy: { order: 'asc' } });
  return NextResponse.json({ subjects });
}

// POST - create subject (admin only)
export async function POST(req: NextRequest) {
  const teacher = await getCurrentTeacher();
  if (!teacher || teacher.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Admin only' }, { status: 403 });
  }
  const { name, code, order, category } = await req.json();
  if (!name || !code) return NextResponse.json({ error: 'name, code required' }, { status: 400 });
  const subject = await db.subject.create({
    data: { name, code, order: order || 0, category: category || 'BOTH' },
  });
  return NextResponse.json({ subject });
}

// POST /api/admin/subject/reseed - re-apply default subjects (admin)
export async function PUT() {
  const teacher = await getCurrentTeacher();
  if (!teacher || teacher.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Admin only' }, { status: 403 });
  }
  for (const s of DEFAULT_SUBJECTS) {
    await db.subject.upsert({
      where: { code: s.code },
      update: { name: s.name, order: s.order, category: s.category },
      create: s,
    });
  }
  return NextResponse.json({ ok: true });
}

// DELETE /api/admin/subject?id=...
export async function DELETE(req: NextRequest) {
  const teacher = await getCurrentTeacher();
  if (!teacher || teacher.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Admin only' }, { status: 403 });
  }
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
  await db.subject.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
