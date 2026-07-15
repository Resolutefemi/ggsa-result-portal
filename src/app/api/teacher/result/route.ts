import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentTeacher } from '@/lib/session';
import {
  SKILL_TRAITS,
  BEHAVIOUR_TRAITS,
  calculateGrade,
  gradeRemark,
} from '@/lib/constants';
import { computeTotal } from '@/lib/calc';

export const runtime = 'nodejs';

/**
 * GET /api/teacher/result?studentId=...&term=...&session=...
 * Returns the result for a student in a given term/session.
 * If no result exists yet, returns a draft skeleton with default subjects.
 */
export async function GET(req: NextRequest) {
  const teacher = await getCurrentTeacher();
  if (!teacher) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const studentId = searchParams.get('studentId');
  const term = searchParams.get('term') || '1st Term';
  const session = searchParams.get('session') || '2025/2026';

  if (!studentId) return NextResponse.json({ error: 'studentId required' }, { status: 400 });

  const student = await db.student.findUnique({
    where: { id: studentId },
    include: {
      class: { include: { subjects: { include: { subject: true } } } },
    },
  });
  if (!student) return NextResponse.json({ error: 'Student not found' }, { status: 404 });

  // Verify access
  if (teacher.role !== 'ADMIN') {
    const assignment = await db.classAssignment.findUnique({
      where: { teacherId_classId: { teacherId: teacher.id, classId: student.classId } },
    });
    if (!assignment) return NextResponse.json({ error: 'Not assigned to this class' }, { status: 403 });
  }

  let result = await db.result.findFirst({
    where: { studentId, term, session },
    include: {
      items: { include: { subject: true } },
      traits: true,
    },
  });

  // If no result yet, return a draft skeleton
  if (!result) {
    const subjects = student.class.subjects
      .map((cs) => cs.subject)
      .sort((a, b) => a.order - b.order);

    return NextResponse.json({
      student: {
        id: student.id,
        name: student.name,
        admissionNumber: student.admissionNumber,
        sex: student.sex,
        house: student.house,
        year: student.year,
        className: student.class.name,
        classId: student.classId,
      },
      result: {
        id: null,
        term,
        session,
        status: 'DRAFT',
        pin: null,
        schoolOpened: 0,
        timesSchoolOpened: 0,
        marksObtainable: 100,
        teacherReport: '',
        principalReport: '',
        teacherSignature: '',
        nextTermBegins: '',
      },
      items: subjects.map((s) => ({
        id: null,
        subjectId: s.id,
        subjectName: s.name,
        subjectCode: s.code,
        order: s.order,
        test1: null,
        test2: null,
        exam: null,
        firstTermScore: null,
        secondTermScore: null,
        thirdTermScore: null,
        totalScore: null,
        classAverage: null,
        position: null,
        grade: null,
        remark: null,
      })),
      traits: [
        ...SKILL_TRAITS.map((name) => ({ section: 'SKILL', name, rating: null })),
        ...BEHAVIOUR_TRAITS.map((name) => ({ section: 'BEHAVIOUR', name, rating: null })),
      ],
      classSubjectsCount: subjects.length,
    });
  }

  // Existing result - ensure subjects not yet entered are present
  const subjects = student.class.subjects
    .map((cs) => cs.subject)
    .sort((a, b) => a.order - b.order);
  const existingSubjectIds = new Set(result.items.map((i) => i.subjectId));
  const missingSubjects = subjects.filter((s) => !existingSubjectIds.has(s.id));

  const items = [
    ...result.items.map((i) => ({
      id: i.id,
      subjectId: i.subjectId,
      subjectName: i.subject.name,
      subjectCode: i.subject.code,
      order: i.subject.order,
      test1: i.test1,
      test2: i.test2,
      exam: i.exam,
      firstTermScore: i.firstTermScore,
      secondTermScore: i.secondTermScore,
      thirdTermScore: i.thirdTermScore,
      totalScore: i.totalScore,
      classAverage: i.classAverage,
      position: i.position,
      grade: i.grade,
      remark: i.remark,
    })),
    ...missingSubjects.map((s) => ({
      id: null,
      subjectId: s.id,
      subjectName: s.name,
      subjectCode: s.code,
      order: s.order,
      test1: null,
      test2: null,
      exam: null,
      firstTermScore: null,
      secondTermScore: null,
      thirdTermScore: null,
      totalScore: null,
      classAverage: null,
      position: null,
      grade: null,
      remark: null,
    })),
  ].sort((a, b) => a.order - b.order);

  // Ensure all default traits exist (fill missing)
  const existingTraits = new Set(result.traits.map((t) => `${t.section}|${t.name}`));
  const traits = [
    ...result.traits.map((t) => ({ id: t.id, section: t.section, name: t.name, rating: t.rating })),
    ...SKILL_TRAITS.filter((n) => !existingTraits.has(`SKILL|${n}`))
      .map((name) => ({ id: null, section: 'SKILL', name, rating: null })),
    ...BEHAVIOUR_TRAITS.filter((n) => !existingTraits.has(`BEHAVIOUR|${n}`))
      .map((name) => ({ id: null, section: 'BEHAVIOUR', name, rating: null })),
  ];

  return NextResponse.json({
    student: {
      id: student.id,
      name: student.name,
      admissionNumber: student.admissionNumber,
      sex: student.sex,
      house: student.house,
      year: student.year,
      className: student.class.name,
      classId: student.classId,
    },
    result: {
      id: result.id,
      term: result.term,
      session: result.session,
      status: result.status,
      pin: result.pin,
      schoolOpened: result.schoolOpened,
      timesSchoolOpened: result.timesSchoolOpened,
      marksObtainable: result.marksObtainable,
      teacherReport: result.teacherReport || '',
      principalReport: result.principalReport || '',
      teacherSignature: result.teacherSignature || '',
      nextTermBegins: result.nextTermBegins || '',
    },
    items,
    traits,
    classSubjectsCount: subjects.length,
  });
}

/**
 * POST /api/teacher/result
 * Body: { studentId, term, session, items[], traits[], schoolOpened, ... }
 * Saves the result (draft). Auto-computes grade + total on each item.
 * Position/class average computed on finalize.
 */
export async function POST(req: NextRequest) {
  const teacher = await getCurrentTeacher();
  if (!teacher) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const {
    studentId,
    term,
    session,
    items, // [{ subjectId, test1, test2, exam, firstTermScore, secondTermScore, thirdTermScore }]
    traits, // [{ section, name, rating }]
    schoolOpened,
    timesSchoolOpened,
    marksObtainable,
    teacherReport,
    principalReport,
    teacherSignature,
    nextTermBegins,
  } = body;

  if (!studentId || !term || !session) {
    return NextResponse.json({ error: 'studentId, term, session required' }, { status: 400 });
  }

  const student = await db.student.findUnique({ where: { id: studentId } });
  if (!student) return NextResponse.json({ error: 'Student not found' }, { status: 404 });

  if (teacher.role !== 'ADMIN') {
    const assignment = await db.classAssignment.findUnique({
      where: { teacherId_classId: { teacherId: teacher.id, classId: student.classId } },
    });
    if (!assignment) return NextResponse.json({ error: 'Not assigned to this class' }, { status: 403 });
  }

  // Find or create result
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
        schoolOpened: schoolOpened ?? 0,
        timesSchoolOpened: timesSchoolOpened ?? 0,
        marksObtainable: marksObtainable ?? 100,
        teacherReport,
        principalReport,
        teacherSignature,
        nextTermBegins,
      },
      include: { items: true, traits: true },
    });
  } else {
    if (result.status === 'FINALIZED') {
      return NextResponse.json({ error: 'Result is finalized and cannot be edited' }, { status: 400 });
    }
    result = await db.result.update({
      where: { id: result.id },
      data: {
        teacherId: teacher.id,
        schoolOpened: schoolOpened ?? result.schoolOpened,
        timesSchoolOpened: timesSchoolOpened ?? result.timesSchoolOpened,
        marksObtainable: marksObtainable ?? result.marksObtainable,
        teacherReport: teacherReport ?? result.teacherReport,
        principalReport: principalReport ?? result.principalReport,
        teacherSignature: teacherSignature ?? result.teacherSignature,
        nextTermBegins: nextTermBegins ?? result.nextTermBegins,
      },
      include: { items: true, traits: true },
    });
  }

  // Upsert items
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

  // Upsert traits
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
        data: {
          resultId: result.id,
          section: t.section,
          name: t.name,
          rating: t.rating || null,
        },
      });
    }
  }

  return NextResponse.json({ ok: true, resultId: result.id });
}
