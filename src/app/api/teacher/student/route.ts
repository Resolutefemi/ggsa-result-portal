import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentTeacher } from '@/lib/session';

export const runtime = 'nodejs';

/**
 * POST /api/teacher/student
 * Body: { name, classId, sex, year }
 * Allows a teacher to add a student to a class they're assigned to.
 * Admission number is auto-generated.
 */
export async function POST(req: NextRequest) {
  const teacher = await getCurrentTeacher();
  if (!teacher) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { name, classId, sex, year } = body;
  if (!name || !classId) {
    return NextResponse.json({ error: 'Name and class are required.' }, { status: 400 });
  }

  // Verify teacher has access to this class (admin bypasses)
  if (teacher.role !== 'ADMIN') {
    const assignment = await db.classAssignment.findUnique({
      where: { teacherId_classId: { teacherId: teacher.id, classId } },
    });
    if (!assignment) {
      return NextResponse.json({ error: 'You are not assigned to this class.' }, { status: 403 });
    }
  }

  // Auto-generate admission number
  const count = await db.student.count();
  const seq = String(count + 1).padStart(4, '0');
  let finalAdm = `GGSA-${new Date().getFullYear()}-${seq}`;
  const exists = await db.student.findUnique({ where: { admissionNumber: finalAdm } });
  if (exists) {
    finalAdm = `${finalAdm}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
  }

  try {
    const student = await db.student.create({
      data: {
        name,
        admissionNumber: finalAdm,
        classId,
        sex: sex || 'M',
        year: year || '2025/2026',
        teacherId: teacher.id,
      },
    });
    return NextResponse.json({ student });
  } catch (e: any) {
    if (e?.code === 'P2002') {
      return NextResponse.json({ error: 'Admission number already exists.' }, { status: 400 });
    }
    throw e;
  }
}

/**
 * DELETE /api/teacher/student?id=...
 * Allows a teacher to remove a student from a class they're assigned to.
 */
export async function DELETE(req: NextRequest) {
  const teacher = await getCurrentTeacher();
  if (!teacher) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

  // Find the student and verify the teacher has access to their class
  const student = await db.student.findUnique({ where: { id } });
  if (!student) return NextResponse.json({ error: 'Student not found' }, { status: 404 });

  if (teacher.role !== 'ADMIN') {
    const assignment = await db.classAssignment.findUnique({
      where: { teacherId_classId: { teacherId: teacher.id, classId: student.classId } },
    });
    if (!assignment) {
      return NextResponse.json({ error: 'You are not assigned to this student\'s class.' }, { status: 403 });
    }
  }

  await db.student.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
