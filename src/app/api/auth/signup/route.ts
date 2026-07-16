import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { hashSecret } from '@/lib/auth';

export const runtime = 'nodejs';

/**
 * POST /api/auth/signup
 * Body: { username, password, fullName, email?, subject? }
 *
 * Creates a new teacher with status = 'PENDING'.
 * The admin must approve the signup before the teacher can log in.
 *
 * Validation:
 * - username: required, 3-30 chars, alphanumeric + underscore
 * - password: required, min 6 chars
 * - fullName: required
 * - Username must not already exist
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { username, password, fullName, email, subject } = body;

    // === Validation ===
    if (!username || !password || !fullName) {
      return NextResponse.json(
        { error: 'Username, password, and full name are all required.' },
        { status: 400 }
      );
    }

    if (typeof username !== 'string' || !/^[a-zA-Z0-9_]{3,30}$/.test(username)) {
      return NextResponse.json(
        { error: 'Username must be 3-30 characters: letters, numbers, or underscores only.' },
        { status: 400 }
      );
    }

    if (typeof password !== 'string' || password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters long.' },
        { status: 400 }
      );
    }

    if (typeof fullName !== 'string' || fullName.trim().length < 3) {
      return NextResponse.json(
        { error: 'Please enter your full name (at least 3 characters).' },
        { status: 400 }
      );
    }

    // Check username uniqueness
    const existing = await db.teacher.findUnique({ where: { username } });
    if (existing) {
      return NextResponse.json(
        { error: 'That username is already taken. Please choose another.' },
        { status: 400 }
      );
    }

    // Create the teacher with PENDING status
    const teacher = await db.teacher.create({
      data: {
        username,
        passwordHash: hashSecret(password),
        fullName: fullName.trim(),
        email: email?.trim() || null,
        subject: subject?.trim() || null,
        role: 'TEACHER',
        status: 'PENDING',
      },
      select: {
        id: true,
        username: true,
        fullName: true,
        status: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      ok: true,
      message: 'Signup received! Your account is now awaiting admin approval. You will be able to log in once the administrator approves your request.',
      teacher,
    });
  } catch (e) {
    console.error('[auth/signup]', e);
    return NextResponse.json({ error: 'Server error. Please try again.' }, { status: 500 });
  }
}
