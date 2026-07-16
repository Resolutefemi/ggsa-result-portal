import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentTeacher } from '@/lib/session';
import { DEFAULT_SUBJECTS } from '@/lib/constants';

export const runtime = 'nodejs';

/**
 * POST /api/admin/class/find-or-create
 * Body: { name, category? }
 *
 * Used by the Add Student dialog when "Write manually" is selected.
 * - If a class with the given name (case-insensitive) exists, return it.
 * - Otherwise create it (auto-assigning default subjects matching the category)
 *   and return the new class.
 *
 * Returns: { class: { id, name, category } }
 */
export async function POST(req: NextRequest) {
  const teacher = await getCurrentTeacher();
  if (!teacher || teacher.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Admin only' }, { status: 403 });
  }
  const { name, category } = await req.json();
  if (!name || typeof name !== 'string' || name.trim().length < 1) {
    return NextResponse.json({ error: 'Class name is required.' }, { status: 400 });
  }
  const trimmed = name.trim();

  // Look up existing class (case-insensitive)
  const existing = await db.class.findFirst({
    where: { name: { equals: trimmed, mode: 'insensitive' } },
  });
  if (existing) {
    return NextResponse.json({ class: existing, created: false });
  }

  // Determine category: use provided, else guess from name (SS -> SENIOR, else JUNIOR)
  let cat = category;
  if (!cat) {
    const upper = trimmed.toUpperCase();
    if (upper.startsWith('SS')) cat = 'SENIOR';
    else if (upper.startsWith('JSS')) cat = 'JUNIOR';
    else cat = 'JUNIOR';
  }

  // Create the class
  const cls = await db.class.create({
    data: { name: trimmed, category: cat },
  });

  // Auto-assign default subjects matching the category
  const subjects = await db.subject.findMany({
    where: {
      OR: [
        { category: 'BOTH' },
        { category: cat },
      ],
    },
  });
  for (const s of subjects) {
    await db.classSubject
      .create({ data: { classId: cls.id, subjectId: s.id } })
      .catch(() => {}); // ignore duplicates
  }

  return NextResponse.json({ class: cls, created: true });
}
