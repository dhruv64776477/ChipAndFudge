import { NextResponse } from 'next/server';
import { generateRegistrationOptions } from '@simplewebauthn/server';
import { connectToDatabase } from '@/lib/mongodb';
import { AdminDevice } from '@/models/AdminDevice';
import { getWebAuthnConfig } from '@/lib/auth/webauthn';
import { createChallengeToken, CHALLENGE_COOKIE_NAME } from '@/lib/auth/session';

/**
 * POST /api/admin/auth/register/options
 *
 * Generate WebAuthn registration options.
 * Rejects if an admin device is already registered (single-admin-device rule).
 */
export async function POST() {
  try {
    await connectToDatabase();

    // Enforce single-admin-device rule at the database level
    const existingDevice = await AdminDevice.countDocuments();
    if (existingDevice > 0) {
      return NextResponse.json(
        { error: 'ADMIN_ALREADY_REGISTERED' },
        { status: 403 }
      );
    }

    const { rpName, rpID } = getWebAuthnConfig();
    if (!rpName || !rpID) {
      return NextResponse.json(
        { error: 'WebAuthn configuration is missing on the server.' },
        { status: 500 }
      );
    }

    // Explicitly pass Uint8Array userID for stable WebAuthn user entity identification
    const userID = new TextEncoder().encode('the-chip-and-fudge-admin-master-user');

    const options = await generateRegistrationOptions({
      rpName,
      rpID,
      userID,
      userName: 'admin@thechipandfudge.com',
      userDisplayName: 'The Chip & Fudge Admin',
      attestationType: 'none',
      authenticatorSelection: {
        residentKey: 'preferred',
        userVerification: 'required',
      },
    });

    if (!options || !options.challenge || !options.user || !options.user.id) {
      console.error('Invalid WebAuthn options generated:', options);
      return NextResponse.json(
        { error: 'Failed to generate valid registration options.' },
        { status: 500 }
      );
    }

    // Store the challenge in a short-lived signed JWT cookie
    const challengeToken = await createChallengeToken(options.challenge, 'registration');

    const res = NextResponse.json(options);
    res.cookies.set(CHALLENGE_COOKIE_NAME, challengeToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 300, // 5 minutes
    });

    return res;
  } catch (error: unknown) {
    console.error('Registration options error:', error);
    const message = error instanceof Error ? error.message : 'Failed to generate registration options.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
