/**
 * Create 2nd Term results for the 4 students from the scanned report cards.
 * Corrected names and scores based on deep analysis of all 9 images.
 */
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { computeTotal, calculateGrade, gradeRemark } from '../src/lib/calc';
import { SKILL_TRAITS, BEHAVIOUR_TRAITS } from '../src/lib/constants';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter } as any);

const students = [
  {
    name: 'Ariyo Oluwagbemiga David',
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
    teacherReport: 'Outstanding result. Keep it up.',
    principalReport: 'Promoted. Continue to excel.',
  },
  {
    name: 'Ariyo Oluwasegun Israel',
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
    teacherReport: 'Consistently diligent. Outstanding performance. Keep it up.',
    principalReport: 'Promoted to SS 1. Well done!',
  },
  {
    name: 'Balogun Anu Opeyemi',
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
      PVS: { test1: 14, test2: 13, exam: 42 },
    },
    teacherReport: 'A fair result. Put in more effort next term.',
    principalReport: 'Promoted on trial. Significant improvement needed.',
  },
  {
    name: 'Johnson Gbemisola Mary',
    className: 'JSS 3',
    sex: 'F',
    pin: '381204',
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
    teacherReport: 'Fair performance. Put in more effort.',
    principalReport: 'Promoted. Work harder next term.',
  },
];

async function main() {
  const teacher = await prisma.teacher.findFirst({ where: { username: 'teacher1' } });

  // Delete ALL old 2nd Term results (from previous wrong run)
  const oldResults = await prisma.result.findMany({
    where: { term: '2nd Term', session: '2025/2026' },
  });
  for (const old of oldResults) {
    await prisma.resultItem.deleteMany({ where: { resultId: old.id } });
    await prisma.characterTrait.deleteMany({ where: { resultId: old.id } });
    await prisma.result.delete({ where: { id: old.id } });
  }
  console.log(`Deleted ${oldResults.length} old 2nd Term results`);

  // Delete old students that were created with wrong names
  const wrongNames = [
    'Oluwaseun Adebayo',
    'Abino Clinton',
    'Ariyo Oluwatobiloba',
    'Ariyo Olumasegun',
    'Abiyode Oluwagbemiga',
    'Johnson Gabriel',
    'Johnson Gbedamisola',
  ];
  for (const name of wrongNames) {
    const s = await prisma.student.findFirst({ where: { name } });
    if (s) {
      await prisma.student.delete({ where: { id: s.id } });
      console.log(`Deleted wrong student: ${name}`);
    }
  }

  const results: { name: string; className: string; pin: string }[] = [];

  for (const s of students) {
    const cls = await prisma.class.findFirst({ where: { name: s.className } });
    if (!cls) { console.log(`SKIP: ${s.name} — class ${s.className} not found`); continue; }

    // Check if student already exists
    let student = await prisma.student.findFirst({
      where: { name: s.name, classId: cls.id },
    });

    if (!student) {
      const admCount = await prisma.student.count();
      const adm = `GGSA-${new Date().getFullYear()}-${String(admCount + 1).padStart(4, '0')}-${Math.random().toString(36).slice(2, 5).toUpperCase()}`;
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
        data: { resultId: result.id, section: 'BEHAVIOUR', name, rating: 'B' },
      });
    }

    results.push({ name: s.name, className: s.className, pin: s.pin });
    console.log(`✅ ${s.name} (${s.className}) — PIN: ${s.pin}`);
  }

  console.log('\n========================================');
  console.log('   4 STUDENTS — 2nd Term 2025/2026');
  console.log('========================================');
  for (const r of results) {
    console.log(`  ${r.name.padEnd(30)} ${r.className}  →  PIN: ${r.pin}`);
  }
  console.log('========================================');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); await pool.end(); });
