import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentTeacher } from '@/lib/session';

export const runtime = 'nodejs';

// GET /api/teacher/classes  - returns classes assigned to the logged-in teacher
export async function GET() {
  const teacher = await getCurrentTeacher();
  if (!teacher) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const assignments = await db.classAssignment.findMany({
    where: { teacherId: teacher.id },
    include: {
      class: {
        include: {
          _count: { select: { students: true } },
        },
      },
    },
    orderBy: { class: { name: 'asc' } },
  });

  // Admin sees all classes
  let classes: any[] = [];
  if (teacher.role === 'ADMIN') {
    const allClasses = await db.class.findMany({
      include: { _count: { select: { students: true } } },
      orderBy: { name: 'asc' },
    });
    classes = allClasses.map((c) => ({
      id: c.id,
      name: c.name,
      category: c.category,
      studentCount: c._count.students,
      subject: null,
    }));
  } else {
    classes = assignments.map((a) => ({
      id: a.class.id,
      name: a.class.name,
      category: a.class.category,
      studentCount: a.class._count.students,
      subject: a.subject,
    }));
  }

  return NextResponse.json({ classes });
}
