import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyPin } from '@/lib/auth';

export const runtime = 'nodejs';

/**
 * POST /api/student/check
 * Body: { admissionNumber, pin, term, session }
 * Returns the student's result if PIN is correct and result is FINALIZED.
 */
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { admissionNumber, pin, term, session } = body;
  if (!admissionNumber || !pin || !term || !session) {
    return NextResponse.json({ error: 'All fields required' }, { status: 400 });
  }

  const student = await db.student.findUnique({
    where: { admissionNumber },
    include: { class: true },
  });
  if (!student) {
    return NextResponse.json({ error: 'Student not found. Check admission number.' }, { status: 404 });
  }
  if (!verifyPin(pin, student.pinHash)) {
    return NextResponse.json({ error: 'Incorrect PIN. Please try again.' }, { status: 401 });
  }

  const result = await db.result.findFirst({
    where: { studentId: student.id, term, session },
    include: {
      items: { include: { subject: true } },
      traits: true,
    },
  });

  if (!result || result.status !== 'FINALIZED') {
    return NextResponse.json({
      error: 'Your result has not been finalized yet. Please check back later.',
      student: {
        name: student.name,
        className: student.class.name,
        admissionNumber: student.admissionNumber,
      },
    }, { status: 404 });
  }

  const items = result.items
    .map((i) => ({
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
    }))
    .sort((a, b) => a.order - b.order);

  const traits = [
    ...result.traits.filter((t) => t.section === 'SKILL'),
    ...result.traits.filter((t) => t.section === 'BEHAVIOUR'),
  ];

  return NextResponse.json({
    student: {
      name: student.name,
      admissionNumber: student.admissionNumber,
      sex: student.sex,
      house: student.house,
      year: student.year,
      className: student.class.name,
    },
    result: {
      id: result.id,
      term: result.term,
      session: result.session,
      status: result.status,
      schoolOpened: result.schoolOpened,
      timesSchoolOpened: result.timesSchoolOpened,
      marksObtainable: result.marksObtainable,
      teacherReport: result.teacherReport,
      principalReport: result.principalReport,
      teacherSignature: result.teacherSignature,
      nextTermBegins: result.nextTermBegins,
    },
    items,
    traits,
  });
}

// Helper: list available terms/sessions for dropdowns
export async function GET() {
  const sessions = await db.result.findMany({
    select: { session: true, term: true },
    distinct: ['session', 'term'],
  });
  return NextResponse.json({
    terms: ['1st Term', '2nd Term', '3rd Term'],
    sessions: [...new Set(sessions.map((s) => s.session))].sort().reverse(),
  });
}
