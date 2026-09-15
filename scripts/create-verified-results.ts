/**
 * Create CORRECT 2nd Term results for 4 students using Claude's verified data.
 * All students are JSS 3, 2nd Term, 2025/2026.
 * Next Term Begins: 27 April 2026. No. in Class: 5.
 */
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { computeTotal, calculateGrade, gradeRemark } from '../src/lib/calc';
import { SKILL_TRAITS, BEHAVIOUR_TRAITS } from '../src/lib/constants';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter } as any);

// The 9 subjects from the scanned cards
const SUBJECTS = [
  { name: 'English Studies', code: 'ENG', order: 1 },
  { name: 'Mathematics', code: 'MATH', order: 2 },
  { name: 'Yoruba Studies', code: 'YOR', order: 3 },
  { name: 'Business Studies', code: 'BUS', order: 4 },
  { name: 'Information Tech.', code: 'IT', order: 5 },
  { name: 'Civic Edu.', code: 'CIV', order: 6 },
  { name: 'Cult. & Creat. Arts', code: 'CCA', order: 7 },
  { name: 'Agric Science', code: 'AGR', order: 8 },
  { name: 'Home Economics', code: 'HEC', order: 9 },
];

const students = [
  {
    name: 'Ariyo Oluwasegun',
    sex: 'M',
    pin: '740512',
    teacherReport: 'Consistently delivers outstanding performance. Keep it up.',
    principalReport: 'Promoted to SS 1. Well done!',
    scores: {
      ENG: { t1: 18, t2: 20, exam: 48, total: 86, pos: '1st', grade: 'A', remark: 'Excellent', classAvg: 55 },
      MATH: { t1: 12, t2: 20, exam: 42, total: 74, pos: '2nd', grade: 'A', remark: 'Excellent', classAvg: 53 },
      YOR: { t1: 16, t2: 15, exam: 47, total: 78, pos: '2nd', grade: 'A', remark: 'Excellent', classAvg: 57 },
      BUS: { t1: 16, t2: 19, exam: 59, total: 94, pos: '1st', grade: 'A', remark: 'Excellent', classAvg: 62 },
      IT: { t1: 12, t2: 19, exam: 46, total: 77, pos: '2nd', grade: 'A', remark: 'Excellent', classAvg: 57 },
      CIV: { t1: 20, t2: 20, exam: 52, total: 92, pos: '1st', grade: 'A', remark: 'Excellent', classAvg: 61 },
      CCA: { t1: 16, t2: 19, exam: 57, total: 92, pos: '1st', grade: 'A', remark: 'Excellent', classAvg: 52 },
      AGR: { t1: 15, t2: 13, exam: 48, total: 76, pos: '2nd', grade: 'A', remark: 'Excellent', classAvg: 43 },
      HEC: { t1: 20, t2: 20, exam: 60, total: 100, pos: '1st', grade: 'A', remark: 'Excellent', classAvg: 51 },
    },
    firstTerm: { ENG: 74, MATH: 74, YOR: 74, BUS: 81, IT: 81, CIV: 70, CCA: null, AGR: 83, HEC: 81 },
    traits: { all: 'B', except: { 'Integrity': 'D' } },
  },
  {
    name: 'Ariyo Oluwagbemiga',
    sex: 'M',
    pin: '492015',
    teacherReport: 'Outstanding result. Keep it up.',
    principalReport: 'Promoted to SS 1. Continue to excel.',
    scores: {
      ENG: { t1: 10, t2: 19, exam: 45, total: 74, pos: '2nd', grade: 'A', remark: 'Excellent', classAvg: 55 },
      MATH: { t1: 10, t2: 20, exam: 46, total: 76, pos: '1st', grade: 'A', remark: 'Excellent', classAvg: 53 },
      YOR: { t1: 15, t2: 16, exam: 51, total: 82, pos: '1st', grade: 'A', remark: 'Excellent', classAvg: 57 },
      BUS: { t1: 18, t2: 16, exam: 56, total: 90, pos: '2nd', grade: 'A', remark: 'Excellent', classAvg: 62 },
      IT: { t1: 14, t2: 19, exam: 47, total: 80, pos: '1st', grade: 'A', remark: 'Excellent', classAvg: 57 },
      CIV: { t1: 20, t2: 20, exam: 50, total: 90, pos: '2nd', grade: 'A', remark: 'Excellent', classAvg: 61 },
      CCA: { t1: 19, t2: 17, exam: 51, total: 87, pos: '2nd', grade: 'A', remark: 'Excellent', classAvg: 52 },
      AGR: { t1: 16, t2: 14, exam: 50, total: 86, pos: '1st', grade: 'A', remark: 'Excellent', classAvg: 43 },
      HEC: { t1: 20, t2: 20, exam: 60, total: 100, pos: '1st', grade: 'A', remark: 'Excellent', classAvg: 51 },
    },
    firstTerm: { ENG: 76, MATH: 74, YOR: 75, BUS: 88, IT: 84, CIV: 70, CCA: null, AGR: 83, HEC: 92 },
    traits: { all: 'A', except: { 'Attentiveness': 'B' } },
  },
  {
    name: 'Johnson Gbemisola',
    sex: 'F',
    pin: '381204',
    teacherReport: 'Fair performance, put more effort.',
    principalReport: 'Promoted. Work harder next term.',
    scores: {
      ENG: { t1: 6, t2: 18, exam: 40, total: 64, pos: '4th', grade: 'B', remark: 'Average', classAvg: 58 },
      MATH: { t1: 3, t2: 16, exam: 34, total: 55, pos: '3rd', grade: 'C', remark: 'Good', classAvg: 57 },
      BUS: { t1: 11, t2: 17, exam: 51, total: 79, pos: '3rd', grade: 'A', remark: 'Excellent', classAvg: 62 },
      IT: { t1: 10, t2: 17, exam: 42, total: 69, pos: '3rd', grade: 'B', remark: 'Good', classAvg: 57 },
      CIV: { t1: 16, t2: 14, exam: 40, total: 70, pos: '3rd', grade: 'A', remark: 'Excellent', classAvg: 61 },
      CCA: { t1: 2, t2: 10, exam: 28, total: 40, pos: '4th', grade: 'E', remark: 'Fair', classAvg: 52 },
      AGR: { t1: 14, t2: 13, exam: 42, total: 69, pos: '3rd', grade: 'B', remark: 'Good', classAvg: 43 },
      HEC: { t1: 20, t2: 20, exam: 54, total: 94, pos: '2nd', grade: 'A', remark: 'Excellent', classAvg: 51 },
    },
    firstTerm: { ENG: 74, MATH: 50, BUS: 66, IT: 79, CIV: 69, CCA: null, AGR: 77, HEC: 82 },
    traits: { all: 'C', except: {} },
  },
  {
    name: 'Balogun Anu O.',
    sex: 'F',
    pin: '825634',
    teacherReport: 'A fair result, put more effort next term.',
    principalReport: 'Promoted on trial. Significant improvement needed.',
    scores: {
      ENG: { t1: 1, t2: 19, exam: 30, total: 50, pos: '4th', grade: 'C', remark: 'Average', classAvg: 55 },
      MATH: { t1: 4, t2: 20, exam: 34, total: 58, pos: '4th', grade: 'C', remark: 'Average', classAvg: 53 },
      YOR: { t1: 14, t2: 13, exam: 30, total: 57, pos: '4th', grade: 'C', remark: 'Average', classAvg: 58 },
      BUS: { t1: 6, t2: 18, exam: 22, total: 46, pos: '4th', grade: 'D', remark: 'Pass', classAvg: 56 },
      IT: { t1: 8, t2: 16, exam: 35, total: 57, pos: '4th', grade: 'C', remark: 'Good', classAvg: 57 },
      CIV: { t1: 10, t2: 14, exam: 30, total: 54, pos: '4th', grade: 'C', remark: 'Credit', classAvg: 61 },
      CCA: { t1: 8, t2: 17, exam: 28, total: 43, pos: '3rd', grade: 'D', remark: 'Pass', classAvg: 52 },
      AGR: { t1: 20, t2: 20, exam: 30, total: 50, pos: '3rd', grade: 'A', remark: 'Excellent', classAvg: 54 },
      HEC: { t1: 16, t2: 14, exam: 60, total: 71, pos: '4th', grade: 'A', remark: 'Excellent', classAvg: 43 },
    },
    firstTerm: { ENG: 56, MATH: 52, YOR: 70, BUS: 54, IT: 45, CIV: 47, CCA: 77, AGR: 70, HEC: 59 },
    traits: { all: 'B', except: {} },
  },
];

async function main() {
  const jss3 = await prisma.class.findFirst({ where: { name: 'JSS 3' } });
  if (!jss3) throw new Error('JSS 3 not found');
  const teacher = await prisma.teacher.findFirst({ where: { username: 'teacher1' } });

  // === Step 1: Update subjects to match the cards ===
  // Delete old subjects and re-create with correct names
  await prisma.resultItem.deleteMany({});
  await prisma.classSubject.deleteMany({});
  await prisma.subject.deleteMany({});
  
  for (const s of SUBJECTS) {
    await prisma.subject.create({
      data: { name: s.name, code: s.code, order: s.order, category: 'JUNIOR', isParent: false, parentCode: null },
    });
  }
  console.log(`✓ Created ${SUBJECTS.length} subjects`);

  // Assign all subjects to JSS 3
  const allSubjects = await prisma.subject.findMany();
  for (const s of allSubjects) {
    await prisma.classSubject.create({ data: { classId: jss3.id, subjectId: s.id } }).catch(() => {});
  }
  console.log('✓ Assigned subjects to JSS 3');

  // === Step 2: Delete ALL old results ===
  const oldResults = await prisma.result.findMany({});
  for (const old of oldResults) {
    await prisma.resultItem.deleteMany({ where: { resultId: old.id } });
    await prisma.characterTrait.deleteMany({ where: { resultId: old.id } });
    await prisma.result.delete({ where: { id: old.id } });
  }
  console.log(`✓ Deleted ${oldResults.length} old results`);

  // === Step 3: Delete old wrong students, keep the 4 correct ones ===
  const keepNames = students.map(s => s.name);
  const allStudents = await prisma.student.findMany();
  for (const s of allStudents) {
    if (!keepNames.some(n => s.name.includes(n.split(' ')[0]))) {
      await prisma.student.delete({ where: { id: s.id } }).catch(() => {});
    }
  }

  // === Step 4: Create results for each student ===
  const results: { name: string; pin: string }[] = [];

  for (const stu of students) {
    // Find or create student
    let student = await prisma.student.findFirst({ where: { name: stu.name, classId: jss3.id } });
    if (!student) {
      const admCount = await prisma.student.count();
      const adm = `GGSA-2026-${String(admCount + 1).padStart(4, '0')}-${Math.random().toString(36).slice(2, 5).toUpperCase()}`;
      student = await prisma.student.create({
        data: { name: stu.name, admissionNumber: adm, classId: jss3.id, sex: stu.sex, year: '2025/2026', teacherId: teacher?.id },
      });
    }

    // Delete any existing result for this student
    const existing = await prisma.result.findFirst({ where: { studentId: student.id, term: '2nd Term', session: '2025/2026' } });
    if (existing) {
      await prisma.resultItem.deleteMany({ where: { resultId: existing.id } });
      await prisma.characterTrait.deleteMany({ where: { resultId: existing.id } });
      await prisma.result.delete({ where: { id: existing.id } });
    }

    // Delete old PIN if exists
    const oldPin = await prisma.result.findUnique({ where: { pin: stu.pin } }).catch(() => null);
    if (oldPin) {
      await prisma.resultItem.deleteMany({ where: { resultId: oldPin.id } });
      await prisma.characterTrait.deleteMany({ where: { resultId: oldPin.id } });
      await prisma.result.delete({ where: { id: oldPin.id } });
    }

    // Create finalized result
    const result = await prisma.result.create({
      data: {
        studentId: student.id,
        classId: jss3.id,
        teacherId: teacher?.id,
        term: '2nd Term',
        session: '2025/2026',
        status: 'FINALIZED',
        pin: stu.pin,
        schoolOpened: 6,
        timesSchoolOpened: 5,
        marksObtainable: 100,
        teacherReport: stu.teacherReport,
        principalReport: stu.principalReport,
        teacherSignature: 'Mr. Sample Teacher',
        nextTermBegins: '27 April 2026',
      },
    });

    // Add scores for each subject
    for (const subj of allSubjects) {
      const sc = stu.scores[subj.code];
      if (!sc) continue;
      const ft = stu.firstTerm[subj.code as keyof typeof stu.firstTerm];
      await prisma.resultItem.create({
        data: {
          resultId: result.id,
          subjectId: subj.id,
          test1: sc.t1,
          test2: sc.t2,
          exam: sc.exam,
          firstTermScore: ft ?? null,
          secondTermScore: sc.total,
          thirdTermScore: null,
          totalScore: sc.total,
          classAverage: sc.classAvg,
          position: sc.pos === '1st' ? 1 : sc.pos === '2nd' ? 2 : sc.pos === '3rd' ? 3 : sc.pos === '4th' ? 4 : null,
          grade: sc.grade,
          remark: sc.remark,
        },
      });
    }

    // Add character traits
    for (const name of SKILL_TRAITS) {
      const rating = stu.traits.except[name as keyof typeof stu.traits.except] || stu.traits.all;
      await prisma.characterTrait.create({ data: { resultId: result.id, section: 'SKILL', name, rating } });
    }
    for (const name of BEHAVIOUR_TRAITS) {
      const rating = stu.traits.except[name as keyof typeof stu.traits.except] || stu.traits.all;
      await prisma.characterTrait.create({ data: { resultId: result.id, section: 'BEHAVIOUR', name, rating } });
    }

    results.push({ name: stu.name, pin: stu.pin });
    console.log(`✅ ${stu.name} (JSS 3) — PIN: ${stu.pin}`);
  }

  console.log('\n========================================');
  console.log('   4 STUDENTS — 2nd Term 2025/2026');
  console.log('   All JSS 3 — Next Term: 27 April 2026');
  console.log('========================================');
  for (const r of results) {
    console.log(`  ${r.name.padEnd(25)} →  PIN: ${r.pin}`);
  }
  console.log('========================================');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); await pool.end(); });
