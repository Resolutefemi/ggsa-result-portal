import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const runtime = 'nodejs';

/**
 * POST /api/student/check
 * Body: { pin }
 * Looks up the result by its unique PIN.
 * Returns the finalized result if found.
 *
 * Each result has a unique 6-digit PIN. Different terms / sessions
 * produce different PINs, so the PIN alone identifies (student, term, session).
 */
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { pin } = body;
  if (!pin) {
    return NextResponse.json({ error: 'Please enter your PIN.' }, { status: 400 });
  }

  // Normalize: digits only
  const cleanPin = String(pin).replace(/\D/g, '');

  const result = await db.result.findUnique({
    where: { pin: cleanPin },
    include: {
      student: { include: { class: true } },
      teacher: { select: { id: true, fullName: true, signatureImage: true } },
      items: { include: { subject: true } },
      traits: true,
    },
  });

  if (!result) {
    return NextResponse.json({ error: 'No result found for that PIN. Please check and try again.' }, { status: 404 });
  }

  if (result.status !== 'FINALIZED') {
    return NextResponse.json({
      error: 'Your result has not been finalized yet. Please check back later.',
      student: {
        name: result.student.name,
        className: result.student.class.name,
      },
    }, { status: 404 });
  }

  const items = result.items
    .map((i) => ({
      subjectName: i.subject.name,
      subjectCode: i.subject.code,
      order: i.subject.order,
      isParent: (i.subject as any).isParent || false,
      parentCode: (i.subject as any).parentCode || null,
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

  // Fetch the principal signature from settings
  const principalSigSetting = await db.setting.findUnique({
    where: { key: 'principalSignatureImage' },
  });

  return NextResponse.json({
    student: {
      name: result.student.name,
      admissionNumber: result.student.admissionNumber,
      sex: result.student.sex,
      house: result.student.house,
      year: result.student.year,
      className: result.student.class.name,
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
      teacherReport: result.teacherReport,
      principalReport: result.principalReport,
      teacherSignature: result.teacherSignature,
      nextTermBegins: result.nextTermBegins,
    },
    // Signature images (base64 data URLs) — snapped on the website
    teacherSignatureImage: result.teacher?.signatureImage || null,
    principalSignatureImage: principalSigSetting?.value || null,
    items,
    traits,
  });
}
