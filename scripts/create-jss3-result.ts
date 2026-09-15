/**
 * Create a JSS 3 student with a finalized 2nd Term result.
 * Prints the PIN at the end.
 */
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { hashSecret, generateResultPin } from '../src/lib/auth';
import { computeTotal, calculateGrade, gradeRemark } from '../src/lib/calc';
import { SKILL_TRAITS, BEHAVIOUR_TRAITS } from '../src/lib/constants';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter } as any);

async function main() {
  const jss3 = await prisma.class.findFirst({ where: { name: 'JSS 3' } });
  if (!jss3) throw new Error('JSS 3 not found');

  const teacher = await prisma.teacher.findFirst({ where: { username: 'teacher1' } });

  // Create student
  const student = await prisma.student.create({
    data: {
      name: 'Oluwaseun Adebayo',
      admissionNumber: 'JSS3/001',
      classId: jss3.id,
      sex: 'M',
      house: 'Red',
      year: '2025/2026',
      teacherId: teacher?.id,
    },
  });
  console.log('Student created:', student.name, student.admissionNumber);

  // Assign all subjects to JSS 3 if not already
  const subjects = await prisma.subject.findMany({ orderBy: { order: 'asc' } });
  for (const s of subjects) {
    await prisma.classSubject.upsert({
      where: { classId_subjectId: { classId: jss3.id, subjectId: s.id } },
      update: {},
      create: { classId: jss3.id, subjectId: s.id },
    }).catch(() => {});
  }

  // Create finalized result for 2nd Term
  const result = await prisma.result.create({
    data: {
      studentId: student.id,
      classId: jss3.id,
      teacherId: teacher?.id,
      term: '2nd Term',
      session: '2025/2026',
      status: 'FINALIZED',
      pin: '729108',
      schoolOpened: 58,
      timesSchoolOpened: 60,
      marksObtainable: 100,
      teacherReport: 'A very hardworking and intelligent student. Keep it up!',
      principalReport: 'Promoted to SS 1. Maintain the good work.',
      teacherSignature: 'Mr. Sample Teacher',
      nextTermBegins: '9th September, 2026',
    },
  });

  // Add scores for all 8 subjects
  const scores: Record<string, { test1: number; test2: number; exam: number }> = {
    ENG: { test1: 17, test2: 18, exam: 50 },
    MATH: { test1: 16, test2: 17, exam: 48 },
    YOR: { test1: 18, test2: 19, exam: 52 },
    BUS: { test1: 15, test2: 16, exam: 45 },
    BST: { test1: 16, test2: 18, exam: 49 },
    RNV: { test1: 17, test2: 17, exam: 50 },
    CCA: { test1: 18, test2: 18, exam: 51 },
    PVS: { test1: 15, test2: 17, exam: 46 },
  };

  for (const s of subjects) {
    const score = scores[s.code];
    if (!score) continue;
    const total = computeTotal(score);
    const grade = calculateGrade(total);
    const remark = gradeRemark(grade);
    await prisma.resultItem.create({
      data: {
        resultId: result.id,
        subjectId: s.id,
        test1: score.test1,
        test2: score.test2,
        exam: score.exam,
        firstTermScore: null, // 2nd term, so 1st term not auto-filled
        secondTermScore: total, // 2nd term auto-fills
        thirdTermScore: null,
        totalScore: total,
        classAverage: total - 3,
        position: 1,
        grade,
        remark,
      },
    });
    console.log(`  ${s.name}: ${score.test1} + ${score.test2} + ${score.exam} = ${total} (${grade} - ${remark})`);
  }

  // Add character traits
  for (const name of SKILL_TRAITS) {
    await prisma.characterTrait.create({
      data: { resultId: result.id, section: 'SKILL', name, rating: 'A' },
    });
  }
  for (const name of BEHAVIOUR_TRAITS) {
    await prisma.characterTrait.create({
      data: { resultId: result.id, section: 'BEHAVIOUR', name, rating: 'A' },
    });
  }

  console.log('\n✅ JSS 3 Result created successfully!');
  console.log('   Student: Oluwaseun Adebayo');
  console.log('   Class: JSS 3');
  console.log('   Term: 2nd Term 2025/2026');
  console.log('   PIN: 729108');
  console.log('   Use this PIN on the website to check the result.');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); await pool.end(); });
