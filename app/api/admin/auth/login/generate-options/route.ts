import { NextResponse } from 'next/server';
import { generateAuthenticationOptions } from '@simplewebauthn/server';
import type { AuthenticatorTransport } from '@simplewebauthn/server';
import { connectToDatabase } from '@/lib/mongodb';
import { AdminDevice } from '@/models/AdminDevice';
import { getWebAuthnConfig } from '@/lib/auth/webauthn';
import { createChallengeToken, CHALLENGE_COOKIE_NAME } from '@/lib/auth/session';

export async function POST() {
  try {
    await connectToDatabase();

    const adminDevice = await AdminDevice.findOne();
    if (!adminDevice) {
      return NextResponse.json(
        { error: 'No authorized master passkey device found. Please complete setup first.' },
        { status: 400 }
      );
    }

    const { rpID } = getWebAuthnConfig();

    const options = await generateAuthenticationOptions({
      rpID,
      allowCredentials: [
        {
          id: adminDevice.credentialId,
          transports: (adminDevice.transports || []) as AuthenticatorTransport[],
        },
      ],
      userVerification: 'preferred',
    });

    const challengeToken = await createChallengeToken(options.challenge, 'login');

    const res = NextResponse.json(options);
    res.cookies.set(CHALLENGE_COOKIE_NAME, challengeToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 300,
    });

    return res;
  } catch (error: unknown) {
    console.error('Login options error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
