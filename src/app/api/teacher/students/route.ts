import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentTeacher } from '@/lib/session';

export const runtime = 'nodejs';

// GET /api/teacher/students?classId=...  - returns students in a class
export async function GET(req: NextRequest) {
  const teacher = await getCurrentTeacher();
  if (!teacher) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const classId = searchParams.get('classId');
  if (!classId) return NextResponse.json({ error: 'classId required' }, { status: 400 });

  // Verify teacher has access to this class
  if (teacher.role !== 'ADMIN') {
    const assignment = await db.classAssignment.findUnique({
      where: { teacherId_classId: { teacherId: teacher.id, classId } },
    });
    if (!assignment) return NextResponse.json({ error: 'Not assigned to this class' }, { status: 403 });
  }

  const students = await db.student.findMany({
    where: { classId },
    orderBy: { name: 'asc' },
    include: {
      results: {
        orderBy: { createdAt: 'desc' },
        take: 1,
      },
    },
  });

  const result = students.map((s) => ({
    id: s.id,
    name: s.name,
    admissionNumber: s.admissionNumber,
    sex: s.sex,
    house: s.house,
    year: s.year,
    latestResult: s.results[0]
      ? {
          id: s.results[0].id,
          term: s.results[0].term,
          session: s.results[0].session,
          status: s.results[0].status,
        }
      : null,
  }));

  return NextResponse.json({ students });
}
