import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentTeacher } from '@/lib/session';
import { computePositionsAndAverage, computeTotal, calculateGrade, gradeRemark } from '@/lib/calc';
import { SKILL_TRAITS, BEHAVIOUR_TRAITS } from '@/lib/constants';

export const runtime = 'nodejs';

/**
 * POST /api/finalize
 * Body: { studentId, term, session }
 * 1. Save current draft (re-uses POST /api/teacher/result logic, simpler version)
 * 2. For every subject in the class, gather all students' totals for this term+session,
 *    compute positions and class average, and write them to each student's ResultItem.
 * 3. Mark this student's result as FINALIZED.
 */
export async function POST(req: NextRequest) {
  const teacher = await getCurrentTeacher();
  if (!teacher) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { studentId, term, session, items, traits, ...resultFields } = body;
  if (!studentId || !term || !session) {
    return NextResponse.json({ error: 'studentId, term, session required' }, { status: 400 });
  }

  const student = await db.student.findUnique({ where: { id: studentId } });
  if (!student) return NextResponse.json({ error: 'Student not found' }, { status: 404 });

  if (teacher.role !== 'ADMIN') {
    const assignment = await db.classAssignment.findUnique({
      where: { teacherId_classId: { teacherId: teacher.id, classId: student.classId } },
    });
    if (!assignment) return NextResponse.json({ error: 'Not assigned' }, { status: 403 });
  }

  // 1) Save the current draft first (same logic as POST /api/teacher/result)
  let result = await db.result.findFirst({
    where: { studentId, term, session },
    include: { items: true, traits: true },
  });

  if (!result) {
    result = await db.result.create({
      data: {
        studentId,
        classId: student.classId,
        teacherId: teacher.id,
        term,
        session,
        status: 'DRAFT',
        schoolOpened: resultFields.schoolOpened ?? 0,
        timesSchoolOpened: resultFields.timesSchoolOpened ?? 0,
        marksObtainable: resultFields.marksObtainable ?? 100,
        teacherReport: resultFields.teacherReport,
        principalReport: resultFields.principalReport,
        teacherSignature: resultFields.teacherSignature,
        nextTermBegins: resultFields.nextTermBegins,
      },
      include: { items: true, traits: true },
    });
  } else {
    if (result.status === 'FINALIZED') {
      return NextResponse.json({ error: 'Already finalized' }, { status: 400 });
    }
    result = await db.result.update({
      where: { id: result.id },
      data: {
        teacherId: teacher.id,
        schoolOpened: resultFields.schoolOpened ?? result.schoolOpened,
        timesSchoolOpened: resultFields.timesSchoolOpened ?? result.timesSchoolOpened,
        marksObtainable: resultFields.marksObtainable ?? result.marksObtainable,
        teacherReport: resultFields.teacherReport ?? result.teacherReport,
        principalReport: resultFields.principalReport ?? result.principalReport,
        teacherSignature: resultFields.teacherSignature ?? result.teacherSignature,
        nextTermBegins: resultFields.nextTermBegins ?? result.nextTermBegins,
      },
      include: { items: true, traits: true },
    });
  }

  // Save items
  for (const item of items || []) {
    const total = computeTotal(item);
    const grade = calculateGrade(total);
    const remark = gradeRemark(grade);
    const data = {
      test1: item.test1 ?? null,
      test2: item.test2 ?? null,
      exam: item.exam ?? null,
      firstTermScore: item.firstTermScore ?? null,
      secondTermScore: item.secondTermScore ?? null,
      thirdTermScore: item.thirdTermScore ?? null,
      totalScore: total,
      grade,
      remark,
    };
    if (item.id) {
      await db.resultItem.update({ where: { id: item.id }, data });
    } else {
      await db.resultItem.create({
        data: { resultId: result.id, subjectId: item.subjectId, ...data },
      });
    }
  }

  // Save traits
  for (const t of traits || []) {
    if (!t.section || !t.name) continue;
    const existing = result.traits.find(
      (et) => et.section === t.section && et.name === t.name
    );
    if (existing) {
      await db.characterTrait.update({
        where: { id: existing.id },
        data: { rating: t.rating || null },
      });
    } else {
      await db.characterTrait.create({
        data: { resultId: result.id, section: t.section, name: t.name, rating: t.rating || null },
      });
    }
  }

  // 2) Compute positions + class averages across all students in the class for this term+session
  const classStudents = await db.student.findMany({
    where: { classId: student.classId },
    select: { id: true },
  });

  // For each subject in the class, gather totals from all students' results
  const classSubjects = await db.classSubject.findMany({
    where: { classId: student.classId },
    include: { subject: true },
  });

  for (const cs of classSubjects) {
    const totalsForSubject: { studentId: string; total: number | null }[] = [];
    for (const s of classStudents) {
      const r = await db.result.findFirst({
        where: { studentId: s.id, term, session },
        include: { items: true },
      });
      if (!r) {
        totalsForSubject.push({ studentId: s.id, total: null });
        continue;
      }
      const item = r.items.find((i) => i.subjectId === cs.subjectId);
      const total = item ? computeTotal(item) : null;
      totalsForSubject.push({ studentId: s.id, total });
    }
    const { positions, average } = computePositionsAndAverage(totalsForSubject);

    // Write position + classAverage back to each student's ResultItem
    for (const s of classStudents) {
      const r = await db.result.findFirst({
        where: { studentId: s.id, term, session },
        include: { items: true },
      });
      if (!r) continue;
      const item = r.items.find((i) => i.subjectId === cs.subjectId);
      if (item) {
        await db.resultItem.update({
          where: { id: item.id },
          data: {
            position: positions[s.id] ?? null,
            classAverage: average ? Math.round(average * 100) / 100 : null,
          },
        });
      }
    }
  }

  // 3) Mark this student's result as FINALIZED
  await db.result.update({
    where: { id: result.id },
    data: { status: 'FINALIZED' },
  });

  return NextResponse.json({ ok: true, resultId: result.id, status: 'FINALIZED' });
}

/**
 * POST /api/finalize/unfinalize  (not implemented - separate route would be cleaner)
 * Body: { resultId }
 * Reverts a finalized result back to DRAFT.
 */
export async function PUT(req: NextRequest) {
  const teacher = await getCurrentTeacher();
  if (!teacher || teacher.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Admin only' }, { status: 403 });
  }
  const { resultId } = await req.json();
  await db.result.update({
    where: { id: resultId },
    data: { status: 'DRAFT' },
  });
  return NextResponse.json({ ok: true });
}
