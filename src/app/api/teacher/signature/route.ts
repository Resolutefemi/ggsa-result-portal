import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentTeacher } from '@/lib/session';

export const runtime = 'nodejs';

/**
 * POST /api/teacher/signature
 * Body: { signatureImage: <base64 data URL> }
 * Saves the teacher's signature image (snapped on phone or uploaded).
 * Used on every result sheet this teacher finalizes.
 *
 * Image is stored as a base64 data URL in Teacher.signatureImage.
 * We cap the size at ~500KB to keep DB rows reasonable.
 */
export async function POST(req: NextRequest) {
  const teacher = await getCurrentTeacher();
  if (!teacher) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { signatureImage } = await req.json();
  if (!signatureImage || typeof signatureImage !== 'string') {
    return NextResponse.json({ error: 'Signature image is required.' }, { status: 400 });
  }

  // Validate it's a data URL with an image type
  if (!signatureImage.startsWith('data:image/')) {
    return NextResponse.json({ error: 'Image must be a PNG or JPEG data URL.' }, { status: 400 });
  }

  // Cap size: ~500KB (base64 string length)
  const MAX_BYTES = 500 * 1024;
  // Rough size estimate: base64 length * 0.75
  const approxBytes = signatureImage.length * 0.75;
  if (approxBytes > MAX_BYTES) {
    return NextResponse.json(
      { error: 'Image is too large. Please use an image under 500KB.' },
      { status: 400 }
    );
  }

  const updated = await db.teacher.update({
    where: { id: teacher.id },
    data: { signatureImage },
    select: { id: true, fullName: true, signatureImage: true },
  });

  return NextResponse.json({
    ok: true,
    message: 'Signature saved. It will be added to every result you finalize.',
    teacher: updated,
  });
}

// GET — returns the current teacher's signature (for preview in the form)
export async function GET() {
  const teacher = await getCurrentTeacher();
  if (!teacher) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  return NextResponse.json({
    signatureImage: teacher.signatureImage || null,
    fullName: teacher.fullName,
  });
}
