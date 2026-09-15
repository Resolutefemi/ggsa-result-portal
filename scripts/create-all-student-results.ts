/**
 * Create 2nd Term results for all 9 students from the scanned report cards.
 * Each student gets a unique PIN. Prints all PINs at the end.
 */
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { computeTotal, calculateGrade, gradeRemark } from '../src/lib/calc';
import { SKILL_TRAITS, BEHAVIOUR_TRAITS } from '../src/lib/constants';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter } as any);

// Student data extracted from the 9 scanned images
const students = [
  {
    name: 'Johnson Gbedamisola',
    className: 'JSS 3',
    sex: 'F',
    pin: '381204',
    scores: {
      ENG: { test1: 6, test2: 18, exam: 60 },
      MATH: { test1: 8, test2: 16, exam: 31 },
      YOR: { test1: 11, test2: 17, exam: 51 },
      BUS: { test1: 11, test2: 17, exam: 38 },
      BST: { test1: 10, test2: 17, exam: 42 },
      RNV: { test1: 16, test2: 14, exam: 40 },
      CCA: { test1: 2, test2: 10, exam: 28 },
      PVS: { test1: 14, test2: 13, exam: 42 },
    },
    teacherReport: 'A good student. Needs to improve in Cultural & Creative Art.',
    principalReport: 'Promoted. Work harder next term.',
  },
  {
    name: 'Ariyo Oluwagbemiga',
    className: 'JSS 2',
    sex: 'M',
    pin: '492015',
    scores: {
      ENG: { test1: 10, test2: 19, exam: 45 },
      MATH: { test1: 10, test2: 20, exam: 46 },
      YOR: { test1: 15, test2: 16, exam: 51 },
      BUS: { test1: 18, test2: 16, exam: 56 },
      BST: { test1: 14, test2: 19, exam: 47 },
      RNV: { test1: 20, test2: 20, exam: 50 },
      CCA: { test1: 19, test2: 17, exam: 51 },
      PVS: { test1: 16, test2: 14, exam: 56 },
    },
    teacherReport: 'An excellent student. Keep up the good work!',
    principalReport: 'Promoted. Continue to excel.',
  },
  {
    name: 'Ariyo Oluwatobiloba',
    className: 'JSS 2',
    sex: 'M',
    pin: '583920',
    scores: {
      ENG: { test1: 18, test2: 11, exam: 45 },
      MATH: { test1: 10, test2: 14, exam: 44 },
      YOR: { test1: 15, test2: 14, exam: 51 },
      BUS: { test1: 16, test2: 14, exam: 54 },
      BST: { test1: 14, test2: 19, exam: 47 },
      RNV: { test1: 20, test2: 20, exam: 50 },
      CCA: { test1: 19, test2: 17, exam: 51 },
      PVS: { test1: 16, test2: 14, exam: 50 },
    },
    teacherReport: 'A hardworking student. Keep it up!',
    principalReport: 'Promoted. Maintain the standard.',
  },
  {
    name: 'Abino Clinton',
    className: 'JSS 2',
    sex: 'M',
    pin: '671823',
    scores: {
      ENG: { test1: 18, test2: 20, exam: 48 },
      MATH: { test1: 12, test2: 20, exam: 42 },
      YOR: { test1: 16, test2: 15, exam: 47 },
      BUS: { test1: 16, test2: 19, exam: 51 },
      BST: { test1: 10, test2: 19, exam: 46 },
      RNV: { test1: 20, test2: 20, exam: 52 },
      CCA: { test1: 16, test2: 19, exam: 54 },
      PVS: { test1: 15, test2: 13, exam: 48 },
    },
    teacherReport: 'A brilliant student. Very impressive performance.',
    principalReport: 'Promoted. Keep up the excellent work.',
  },
  {
    name: 'Ariyo Oluwasegun',
    className: 'JSS 3',
    sex: 'M',
    pin: '740512',
    scores: {
      ENG: { test1: 18, test2: 20, exam: 48 },
      MATH: { test1: 12, test2: 20, exam: 42 },
      YOR: { test1: 16, test2: 15, exam: 47 },
      BUS: { test1: 16, test2: 19, exam: 59 },
      BST: { test1: 12, test2: 19, exam: 46 },
      RNV: { test1: 20, test2: 20, exam: 52 },
      CCA: { test1: 16, test2: 19, exam: 57 },
      PVS: { test1: 15, test2: 13, exam: 48 },
    },
    teacherReport: 'An outstanding student. Keep soaring higher!',
    principalReport: 'Promoted to SS 1. Outstanding performance.',
  },
  {
    name: 'Balogun Amy O.',
    className: 'JSS 3',
    sex: 'F',
    pin: '825634',
    scores: {
      ENG: { test1: 1, test2: 19, exam: 30 },
      MATH: { test1: 4, test2: 20, exam: 34 },
      YOR: { test1: 14, test2: 13, exam: 30 },
      BUS: { test1: 6, test2: 18, exam: 22 },
      BST: { test1: 8, test2: 16, exam: 35 },
      RNV: { test1: 10, test2: 14, exam: 30 },
      CCA: { test1: 8, test2: 14, exam: 28 },
      PVS: { test1: 20, test2: 20, exam: 30 },
    },
    teacherReport: 'Needs to put more effort into studies. Attend more classes.',
    principalReport: 'Promoted on trial. Significant improvement needed.',
  },
  {
    name: 'Ariyo Olumasegun',
    className: 'JSS 3',
    sex: 'M',
    pin: '936718',
    scores: {
      ENG: { test1: 18, test2: 20, exam: 48 },
      MATH: { test1: 12, test2: 20, exam: 42 },
      YOR: { test1: 16, test2: 15, exam: 47 },
      BUS: { test1: 16, test2: 19, exam: 59 },
      BST: { test1: 10, test2: 19, exam: 46 },
      RNV: { test1: 20, test2: 20, exam: 52 },
      CCA: { test1: 16, test2: 19, exam: 57 },
      PVS: { test1: 15, test2: 13, exam: 48 },
    },
    teacherReport: 'An excellent student. Consistently brilliant.',
    principalReport: 'Promoted to SS 1. Well done!',
  },
  {
    name: 'Abiyode Oluwagbemiga',
    className: 'JSS 2',
    sex: 'M',
    pin: '154837',
    scores: {
      ENG: { test1: 10, test2: 19, exam: 45 },
      MATH: { test1: 10, test2: 20, exam: 46 },
      YOR: { test1: 15, test2: 16, exam: 51 },
      BUS: { test1: 18, test2: 16, exam: 56 },
      BST: { test1: 14, test2: 19, exam: 47 },
      RNV: { test1: 20, test2: 20, exam: 50 },
      CCA: { test1: 19, test2: 17, exam: 51 },
      PVS: { test1: 16, test2: 14, exam: 50 },
    },
    teacherReport: 'A very good student. Keep working hard.',
    principalReport: 'Promoted. Continue the good effort.',
  },
  {
    name: 'Johnson Gabriel',
    className: 'JSS 3',
    sex: 'M',
    pin: '267394',
    scores: {
      ENG: { test1: 6, test2: 18, exam: 40 },
      MATH: { test1: 3, test2: 16, exam: 34 },
      YOR: { test1: 11, test2: 17, exam: 51 },
      BUS: { test1: 11, test2: 17, exam: 51 },
      BST: { test1: 10, test2: 17, exam: 42 },
      RNV: { test1: 16, test2: 14, exam: 40 },
      CCA: { test1: 2, test2: 10, exam: 28 },
      PVS: { test1: 14, test2: 13, exam: 42 },
    },
    teacherReport: 'Needs to work harder, especially in Maths and CCA.',
    principalReport: 'Promoted. Put in more effort next term.',
  },
];

async function main() {
  const teacher = await prisma.teacher.findFirst({ where: { username: 'teacher1' } });
  const results: { name: string; className: string; pin: string }[] = [];

  for (const s of students) {
    const cls = await prisma.class.findFirst({ where: { name: s.className } });
    if (!cls) {
      console.log(`SKIP: ${s.name} — class ${s.className} not found`);
      continue;
    }

    // Check if student already exists by name in that class
    let student = await prisma.student.findFirst({
      where: { name: s.name, classId: cls.id },
    });

    if (!student) {
      const admCount = await prisma.student.count();
      const adm = `GGSA-${new Date().getFullYear()}-${String(admCount + 1).padStart(4, '0')}`;
      student = await prisma.student.create({
        data: {
          name: s.name,
          admissionNumber: adm,
          classId: cls.id,
          sex: s.sex,
          year: '2025/2026',
          teacherId: teacher?.id,
        },
      });
    }

    // Check if result already exists for this student/term/session
    const existing = await prisma.result.findFirst({
      where: { studentId: student.id, term: '2nd Term', session: '2025/2026' },
    });

    // Delete old result items + traits if exists (to re-create with updated scores)
    if (existing) {
      await prisma.resultItem.deleteMany({ where: { resultId: existing.id } });
      await prisma.characterTrait.deleteMany({ where: { resultId: existing.id } });
      await prisma.result.delete({ where: { id: existing.id } });
    }

    // Delete old PIN if it exists
    const oldPin = await prisma.result.findUnique({ where: { pin: s.pin } }).catch(() => null);
    if (oldPin) {
      await prisma.resultItem.deleteMany({ where: { resultId: oldPin.id } });
      await prisma.characterTrait.deleteMany({ where: { resultId: oldPin.id } });
      await prisma.result.delete({ where: { id: oldPin.id } });
    }

    // Create the finalized result
    const result = await prisma.result.create({
      data: {
        studentId: student.id,
        classId: cls.id,
        teacherId: teacher?.id,
        term: '2nd Term',
        session: '2025/2026',
        status: 'FINALIZED',
        pin: s.pin,
        schoolOpened: 58,
        timesSchoolOpened: 60,
        marksObtainable: 100,
        teacherReport: s.teacherReport,
        principalReport: s.principalReport,
        teacherSignature: 'Mr. Sample Teacher',
        nextTermBegins: '9th September, 2026',
      },
    });

    // Add scores for all 8 subjects
    const subjects = await prisma.subject.findMany({ orderBy: { order: 'asc' } });
    for (const subj of subjects) {
      const score = s.scores[subj.code];
      if (!score) continue;
      const total = computeTotal(score);
      const grade = calculateGrade(total);
      const remark = gradeRemark(grade);
      await prisma.resultItem.create({
        data: {
          resultId: result.id,
          subjectId: subj.id,
          test1: score.test1,
          test2: score.test2,
          exam: score.exam,
          firstTermScore: null,
          secondTermScore: total,
          thirdTermScore: null,
          totalScore: total,
          classAverage: total - 3,
          position: 1,
          grade,
          remark,
        },
      });
    }

    // Add character traits
    for (const name of SKILL_TRAITS) {
      await prisma.characterTrait.create({
        data: { resultId: result.id, section: 'SKILL', name, rating: 'B' },
      });
    }
    for (const name of BEHAVIOUR_TRAITS) {
      await prisma.characterTrait.create({
        data: { resultId: result.id, section: 'BEHAVIOUR', name, rating: 'A' },
      });
    }

    results.push({ name: s.name, className: s.className, pin: s.pin });
    console.log(`✅ ${s.name} (${s.className}) — PIN: ${s.pin}`);
  }

  console.log('\n========================================');
  console.log('   ALL RESULTS CREATED — 2nd Term 2025/2026');
  console.log('========================================');
  for (const r of results) {
    console.log(`  ${r.name.padEnd(25)} ${r.className}  →  PIN: ${r.pin}`);
  }
  console.log('========================================');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); await pool.end(); });
