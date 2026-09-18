/**
 * RESTORE: Re-create JSS 1 sample students + demo result (PIN 1234)
 * Also clean up duplicate students and restore class-subject mappings.
 */
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { computeTotal, calculateGrade, gradeRemark } from '../src/lib/calc';
import { SKILL_TRAITS, BEHAVIOUR_TRAITS } from '../src/lib/constants';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter } as any);

async function main() {
  console.log('🔧 RESTORING MISSING DATA...\n');

  // === Step 1: Clean up duplicate students ===
  // Keep only the correct versions, delete duplicates
  const duplicatesToDelete = [
    'Ariyo Oluwagbemiga',      // JSS 2 version (should be JSS 3 only)
    'Balogun Amy O.',           // wrong spelling
    'Ariyo Oluwasegun Israel',  // duplicate with extra name
    'Ariyo Oluwagbemiga David', // duplicate with extra name
    'Johnson Gbemisola Mary',   // duplicate with extra name
    'Balogun Anu Opeyemi',      // duplicate with extra name
  ];
  for (const name of duplicatesToDelete) {
    const s = await prisma.student.findFirst({ where: { name } });
    if (s) {
      // Delete their results first
      const results = await prisma.result.findMany({ where: { studentId: s.id } });
      for (const r of results) {
        await prisma.resultItem.deleteMany({ where: { resultId: r.id } });
        await prisma.characterTrait.deleteMany({ where: { resultId: r.id } });
        await prisma.result.delete({ where: { id: r.id } });
      }
      await prisma.student.delete({ where: { id: s.id } });
      console.log(`  Deleted duplicate: ${name}`);
    }
  }

  // === Step 2: Assign subjects to ALL classes (JSS 1, 2, 3) ===
  const classes = await prisma.class.findMany();
  const subjects = await prisma.subject.findMany();
  for (const cls of classes) {
    for (const subj of subjects) {
      await prisma.classSubject.upsert({
        where: { classId_subjectId: { classId: cls.id, subjectId: subj.id } },
        update: {},
        create: { classId: cls.id, subjectId: subj.id },
      }).catch(() => {});
    }
    console.log(`  Assigned ${subjects.length} subjects to ${cls.name}`);
  }

  // === Step 3: Restore JSS 1 sample students + demo result (PIN 1234) ===
  const jss1 = await prisma.class.findFirst({ where: { name: 'JSS 1' } });
  const teacher = await prisma.teacher.findFirst({ where: { username: 'teacher1' } });

  const sampleStudents = [
    { name: 'Adeyemi Johnson', adm: 'JSS1/001', sex: 'M', house: 'Red' },
    { name: 'Bola Adekunle', adm: 'JSS1/002', sex: 'F', house: 'Blue' },
    { name: 'Chinedu Okafor', adm: 'JSS1/003', sex: 'M', house: 'Green' },
    { name: 'Fatima Bello', adm: 'JSS1/004', sex: 'F', house: 'Yellow' },
    { name: 'Samuel Ojo', adm: 'JSS1/005', sex: 'M', house: 'Red' },
  ];

  for (const ss of sampleStudents) {
    let student = await prisma.student.findFirst({ where: { name: ss.name, classId: jss1.id } });
    if (!student) {
      student = await prisma.student.create({
        data: {
          name: ss.name,
          admissionNumber: ss.adm,
          classId: jss1.id,
          sex: ss.sex,
          house: ss.house,
          year: '2025/2026',
          teacherId: teacher?.id,
        },
      });
      console.log(`  ✅ Restored student: ${ss.name} (${ss.adm})`);
    } else {
      console.log(`  ✓ Already exists: ${ss.name}`);
    }
  }

  // === Step 4: Restore demo result for Adeyemi Johnson (PIN 1234, 1st Term) ===
  const adeyemi = await prisma.student.findFirst({ where: { name: 'Adeyemi Johnson', classId: jss1.id } });
  if (adeyemi) {
    // Check if result already exists
    const existing = await prisma.result.findFirst({
      where: { studentId: adeyemi.id, term: '1st Term', session: '2025/2026' },
    });

    if (!existing) {
      // Delete old PIN 1234 if it exists
      const oldPin = await prisma.result.findUnique({ where: { pin: '1234' } }).catch(() => null);
      if (oldPin) {
        await prisma.resultItem.deleteMany({ where: { resultId: oldPin.id } });
        await prisma.characterTrait.deleteMany({ where: { resultId: oldPin.id } });
        await prisma.result.delete({ where: { id: oldPin.id } });
      }

      const result = await prisma.result.create({
        data: {
          studentId: adeyemi.id,
          classId: jss1.id,
          teacherId: teacher?.id,
          term: '1st Term',
          session: '2025/2026',
          status: 'FINALIZED',
          pin: '1234',
          schoolOpened: 60,
          timesSchoolOpened: 62,
          marksObtainable: 100,
          teacherReport: 'A diligent and hardworking student. Keep up the good work!',
          principalReport: 'Promoted to the next class. More effort needed.',
          teacherSignature: 'Mr. Sample Teacher',
          nextTermBegins: '9th September, 2026',
        },
      });

      // Add scores for all subjects
      const sampleScores: Record<string, { test1: number; test2: number; exam: number }> = {
        ENG: { test1: 15, test2: 16, exam: 45 },
        MATH: { test1: 14, test2: 15, exam: 42 },
        YOR: { test1: 16, test2: 17, exam: 48 },
        BUS: { test1: 14, test2: 15, exam: 43 },
        IT: { test1: 14, test2: 15, exam: 43 },
        CIV: { test1: 15, test2: 16, exam: 45 },
        CCA: { test1: 16, test2: 15, exam: 44 },
        AGR: { test1: 14, test2: 14, exam: 41 },
        HEC: { test1: 15, test2: 14, exam: 43 },
      };

      for (const subj of subjects) {
        const score = sampleScores[subj.code];
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
            firstTermScore: total,
            secondTermScore: null,
            thirdTermScore: null,
            totalScore: total,
            classAverage: total - 2,
            position: 1,
            grade,
            remark,
          },
        });
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

      console.log('  ✅ Restored demo result: PIN 1234 (Adeyemi Johnson, JSS 1, 1st Term)');
    } else {
      console.log('  ✓ Demo result already exists (PIN 1234)');
    }
  }

  // === Step 5: Show summary ===
  const allStudents = await prisma.student.findMany({ include: { class: true } });
  const allResults = await prisma.result.findMany({ include: { student: true } });

  console.log('\n========================================');
  console.log('   RESTORE COMPLETE');
  console.log('========================================');
  console.log(`  Students: ${allStudents.length}`);
  for (const s of allStudents) console.log(`    ${s.name} | ${s.class.name}`);
  console.log(`\n  Results: ${allResults.length}`);
  for (const r of allResults) {
    console.log(`    PIN: ${r.pin || '(none)'} | ${r.student.name} | ${r.term} ${r.session} | ${r.status}`);
  }
  console.log('========================================');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); await pool.end(); });
