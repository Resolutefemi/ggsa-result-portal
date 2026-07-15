import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentTeacher } from '@/lib/session';

export const runtime = 'nodejs';

// GET /api/admin/student?classId=...
export async function GET(req: NextRequest) {
  const teacher = await getCurrentTeacher();
  if (!teacher || teacher.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Admin only' }, { status: 403 });
  }
  const { searchParams } = new URL(req.url);
  const classId = searchParams.get('classId');
  const students = await db.student.findMany({
    where: classId ? { classId } : undefined,
    include: { class: true },
    orderBy: [{ class: { name: 'asc' } }, { name: 'asc' }],
  });
  return NextResponse.json({ students });
}

// POST /api/admin/student - create student
export async function POST(req: NextRequest) {
  const teacher = await getCurrentTeacher();
  if (!teacher || teacher.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Admin only' }, { status: 403 });
  }
  const body = await req.json();
  const { name, admissionNumber, classId, sex, house, year, teacherId } = body;
  if (!name || !admissionNumber || !classId) {
    return NextResponse.json({ error: 'name, admissionNumber, classId required' }, { status: 400 });
  }
  try {
    const student = await db.student.create({
      data: {
        name,
        admissionNumber,
        classId,
        sex: sex || 'M',
        house,
        year,
        teacherId,
      },
    });
    return NextResponse.json({ student });
  } catch (e: any) {
    if (e?.code === 'P2002') {
      return NextResponse.json({ error: 'Admission number already exists' }, { status: 400 });
    }
    throw e;
  }
}

// PUT /api/admin/student - update student
export async function PUT(req: NextRequest) {
  const teacher = await getCurrentTeacher();
  if (!teacher || teacher.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Admin only' }, { status: 403 });
  }
  const body = await req.json();
  const { id, name, admissionNumber, classId, sex, house, year, teacherId } = body;
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
  const data: any = { name, admissionNumber, classId, sex, house, year, teacherId };
  Object.keys(data).forEach((k) => data[k] === undefined && delete data[k]);
  const student = await db.student.update({ where: { id }, data });
  return NextResponse.json({ student });
}

// DELETE /api/admin/student?id=...
export async function DELETE(req: NextRequest) {
  const teacher = await getCurrentTeacher();
  if (!teacher || teacher.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Admin only' }, { status: 403 });
  }
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
  await db.student.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
