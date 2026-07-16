import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const runtime = 'nodejs';

/**
 * GET /api/settings
 * Returns public school settings (principal signature image, etc.)
 * Used by the student result view (no auth needed).
 */
export async function GET() {
  const setting = await db.setting.findUnique({
    where: { key: 'principalSignatureImage' },
  });
  return NextResponse.json({
    principalSignatureImage: setting?.value || null,
  });
}
