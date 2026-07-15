/**
 * Seed the database with default subjects, classes, an admin teacher,
 * school settings, sample students, AND one finalized demo result with PIN 1234
 * so the user can immediately test the student PIN-check flow.
 */
import { PrismaClient } from '@prisma/client';
import { hashSecret } from '../src/lib/auth';
import {
  DEFAULT_SUBJECTS,
  DEFAULT_CLASSES,
  SCHOOL_INFO,
  SKILL_TRAITS,
  BEHAVIOUR_TRAITS,
  calculateGrade,
  gradeRemark,
} from '../src/lib/constants';
import { computeTotal } from '../src/lib/calc';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // 1) Settings
  for (const [key, value] of Object.entries(SCHOOL_INFO)) {
    await prisma.setting.upsert({
      where: { key },
      update: { value },
      create: { key, value },
    });
  }
  console.log('✓ School settings');

  // 2) Subjects
  for (const s of DEFAULT_SUBJECTS) {
    await prisma.subject.upsert({
      where: { code: s.code },
      update: { name: s.name, order: s.order, category: s.category },
      create: s,
    });
  }
  console.log(`✓ ${DEFAULT_SUBJECTS.length} subjects`);

  // 3) Classes
  const classes: { id: string; name: string; category: string }[] = [];
  for (const c of DEFAULT_CLASSES) {
    const cls = await prisma.class.upsert({
      where: { name: c.name },
      update: { category: c.category },
      create: c,
    });
    classes.push(cls);

    const subjects = await prisma.subject.findMany({
      where: {
        OR: [
          { category: 'BOTH' },
          { category: c.category },
        ],
      },
    });
    for (const subj of subjects) {
      await prisma.classSubject.upsert({
        where: {
          classId_subjectId: { classId: cls.id, subjectId: subj.id },
        },
        update: {},
        create: { classId: cls.id, subjectId: subj.id },
      });
    }
  }
  console.log(`✓ ${classes.length} classes with subject mappings`);

  // 4) Admin teacher (username: admin, password: admin123)
  const admin = await prisma.teacher.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      passwordHash: hashSecret('admin123'),
      fullName: 'School Administrator',
      email: 'admin@godgenerals.edu',
      role: 'ADMIN',
    },
  });

  // Sample teacher
  const teacher = await prisma.teacher.upsert({
    where: { username: 'teacher1' },
    update: {},
    create: {
      username: 'teacher1',
      passwordHash: hashSecret('teacher123'),
      fullName: 'Mr. Sample Teacher',
      email: 'teacher1@godgenerals.edu',
      subject: 'Mathematics',
      role: 'TEACHER',
    },
  });

  // Assign teachers to JSS 1
  const jss1 = classes.find((c) => c.name === 'JSS 1');
  if (jss1) {
    for (const t of [admin, teacher]) {
      await prisma.classAssignment.upsert({
        where: { teacherId_classId: { teacherId: t.id, classId: jss1.id } },
        update: {},
        create: { teacherId: t.id, classId: jss1.id },
      });
    }
  }
  console.log('✓ Teachers (admin/admin123, teacher1/teacher123)');

  // 5) Sample students in JSS 1 (no per-student PIN anymore — PINs are per-result)
  let firstStudent: any = null;
  if (jss1) {
    const sampleStudents = [
      { name: 'Adeyemi Johnson', adm: 'JSS1/001', sex: 'M', house: 'Red' },
      { name: 'Bola Adekunle', adm: 'JSS1/002', sex: 'F', house: 'Blue' },
      { name: 'Chinedu Okafor', adm: 'JSS1/003', sex: 'M', house: 'Green' },
      { name: 'Fatima Bello', adm: 'JSS1/004', sex: 'F', house: 'Yellow' },
      { name: 'Samuel Ojo', adm: 'JSS1/005', sex: 'M', house: 'Red' },
    ];
    for (const ss of sampleStudents) {
      const s = await prisma.student.upsert({
        where: { admissionNumber: ss.adm },
        update: {},
        create: {
          name: ss.name,
          admissionNumber: ss.adm,
          classId: jss1.id,
          sex: ss.sex,
          house: ss.house,
          year: '2025/2026',
          teacherId: teacher.id,
        },
      });
      if (ss.adm === 'JSS1/001') firstStudent = s;
    }
    console.log(`✓ ${sampleStudents.length} sample students`);
  }

  // 6) Create ONE finalized demo result for the first student with a known PIN: 1234
  if (firstStudent && jss1) {
    // Clean up any existing results for this student/term/session (from previous test runs)
    await prisma.result.deleteMany({
      where: { studentId: firstStudent.id, term: '1st Term', session: '2025/2026' },
    });
    // Also clean up any result that has the demo PIN 1234
    const existing = await prisma.result.findUnique({ where: { pin: '1234' } });
    if (existing) {
      await prisma.result.delete({ where: { id: existing.id } });
    }

    const result = await prisma.result.create({
      data: {
        studentId: firstStudent.id,
        classId: jss1.id,
        teacherId: teacher.id,
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

    // Add ResultItems with sample scores for a few subjects
    const classSubjects = await prisma.classSubject.findMany({
      where: { classId: jss1.id },
      include: { subject: true },
      orderBy: { subject: { order: 'asc' } },
    });

    const sampleScores: Record<string, { test1: number; test2: number; exam: number }> = {
      ENG: { test1: 15, test2: 16, exam: 45 },
      MATH: { test1: 14, test2: 15, exam: 42 },
      YOR: { test1: 16, test2: 17, exam: 48 },
      BSC: { test1: 13, test2: 14, exam: 40 },
      SOC: { test1: 17, test2: 16, exam: 47 },
      CIV: { test1: 15, test2: 15, exam: 44 },
    };

    for (const cs of classSubjects) {
      const score = sampleScores[cs.subject.code];
      if (!score) continue;
      const total = computeTotal(score);
      const grade = calculateGrade(total);
      const remark = gradeRemark(grade);
      await prisma.resultItem.create({
        data: {
          resultId: result.id,
          subjectId: cs.subjectId,
          test1: score.test1,
          test2: score.test2,
          exam: score.exam,
          totalScore: total,
          classAverage: total - 2, // demo value
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

    console.log('✓ Finalized demo result with PIN 1234 (Adeyemi Johnson, JSS 1, 1st Term 2025/2026)');
  }

  console.log('\n🎉 Seed complete!');
  console.log('   Admin:    admin / admin123');
  console.log('   Teacher:  teacher1 / teacher123');
  console.log('   Demo result PIN: 1234');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
