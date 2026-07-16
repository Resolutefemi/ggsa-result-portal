import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentTeacher } from '@/lib/session';

export const runtime = 'nodejs';

/**
 * POST /api/admin/principal-signature
 * Body: { signatureImage: <base64 data URL> }
 * Admin only — saves the principal's signature image as a school-wide setting.
 * Used on every finalized result sheet.
 */
export async function POST(req: NextRequest) {
  const teacher = await getCurrentTeacher();
  if (!teacher || teacher.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Admin only' }, { status: 403 });
  }

  const { signatureImage } = await req.json();
  if (!signatureImage || typeof signatureImage !== 'string') {
    return NextResponse.json({ error: 'Signature image is required.' }, { status: 400 });
  }

  if (!signatureImage.startsWith('data:image/')) {
    return NextResponse.json({ error: 'Image must be a PNG or JPEG data URL.' }, { status: 400 });
  }

  const MAX_BYTES = 500 * 1024;
  const approxBytes = signatureImage.length * 0.75;
  if (approxBytes > MAX_BYTES) {
    return NextResponse.json(
      { error: 'Image is too large. Please use an image under 500KB.' },
      { status: 400 }
    );
  }

  await db.setting.upsert({
    where: { key: 'principalSignatureImage' },
    update: { value: signatureImage },
    create: { key: 'principalSignatureImage', value: signatureImage },
  });

  return NextResponse.json({
    ok: true,
    message: 'Principal signature saved. It will be added to every finalized result.',
  });
}

// GET — returns the principal signature (admin only)
export async function GET() {
  const teacher = await getCurrentTeacher();
  if (!teacher || teacher.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Admin only' }, { status: 403 });
  }
  const setting = await db.setting.findUnique({ where: { key: 'principalSignatureImage' } });
  return NextResponse.json({ signatureImage: setting?.value || null });
}
