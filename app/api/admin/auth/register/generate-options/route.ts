import { NextRequest, NextResponse } from 'next/server';
import { generateRegistrationOptions } from '@simplewebauthn/server';
import { connectToDatabase } from '@/lib/mongodb';
import { AdminDevice } from '@/models/AdminDevice';
import { getWebAuthnConfig } from '@/lib/auth/webauthn';
import { createChallengeToken, CHALLENGE_COOKIE_NAME } from '@/lib/auth/session';

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();

    // Check if an admin device is already registered (enforce 1 master admin device rule)
    const existingAdmin = await AdminDevice.findOne({ enabled: true });
    if (existingAdmin) {
      return NextResponse.json(
        { error: 'An admin device is already registered. Registration is locked to one master device.' },
        { status: 403 }
      );
    }

    const { rpName, rpID } = getWebAuthnConfig(req);

    const options = await generateRegistrationOptions({
      rpName,
      rpID,
      userName: 'owner@thechipandfudge.com',
      userDisplayName: 'The Chip & Fudge Master Device',
      attestationType: 'none',
      authenticatorSelection: {
        residentKey: 'preferred',
        userVerification: 'preferred',
      },
    });

    const challengeToken = await createChallengeToken(options.challenge, 'registration');

    const res = NextResponse.json(options);
    res.cookies.set(CHALLENGE_COOKIE_NAME, challengeToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 300,
    });

    return res;
  } catch (error: unknown) {
    console.error('Registration options error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
