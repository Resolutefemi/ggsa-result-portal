/**
 * Seed the database with default subjects, classes, an admin teacher,
 * school settings, and a sample student so the system is usable on first run.
 */
import { PrismaClient } from '@prisma/client';
import { hashSecret } from '../src/lib/auth';
import {
  DEFAULT_SUBJECTS,
  DEFAULT_CLASSES,
  SCHOOL_INFO,
} from '../src/lib/constants';

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

    // Assign all "BOTH" or matching-category subjects to each class
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

  // 5) Sample students in JSS 1 with PIN 1234
  if (jss1) {
    const sampleStudents = [
      { name: 'Adeyemi Johnson', adm: 'JSS1/001', sex: 'M', house: 'Red' },
      { name: 'Bola Adekunle', adm: 'JSS1/002', sex: 'F', house: 'Blue' },
      { name: 'Chinedu Okafor', adm: 'JSS1/003', sex: 'M', house: 'Green' },
      { name: 'Fatima Bello', adm: 'JSS1/004', sex: 'F', house: 'Yellow' },
      { name: 'Samuel Ojo', adm: 'JSS1/005', sex: 'M', house: 'Red' },
    ];
    for (const ss of sampleStudents) {
      await prisma.student.upsert({
        where: { admissionNumber: ss.adm },
        update: {},
        create: {
          name: ss.name,
          admissionNumber: ss.adm,
          classId: jss1.id,
          sex: ss.sex,
          house: ss.house,
          pinHash: hashSecret('1234'),
          year: '2025/2026',
          teacherId: teacher.id,
        },
      });
    }
    console.log(`✓ ${sampleStudents.length} sample students (PIN: 1234)`);
  }

  console.log('\n🎉 Seed complete!');
  console.log('   Admin:    admin / admin123');
  console.log('   Teacher:  teacher1 / teacher123');
  console.log('   Student PIN: 1234');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
