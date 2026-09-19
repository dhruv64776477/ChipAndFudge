import { NextRequest, NextResponse } from 'next/server';
import { generateAuthenticationOptions } from '@simplewebauthn/server';
import { connectToDatabase } from '@/lib/mongodb';
import { AdminDevice } from '@/models/AdminDevice';
import { getWebAuthnConfig } from '@/lib/auth/webauthn';
import { createChallengeToken, CHALLENGE_COOKIE_NAME } from '@/lib/auth/session';

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();

    const adminDevice = await AdminDevice.findOne({ enabled: true });
    if (!adminDevice) {
      return NextResponse.json(
        { error: 'No authorized master passkey device found. Please complete setup first.' },
        { status: 400 }
      );
    }

    const { rpID } = getWebAuthnConfig(req);

    const options = await generateAuthenticationOptions({
      rpID,
      allowCredentials: [
        {
          id: adminDevice.webauthnCredentialId,
          transports: adminDevice.transports as any,
        },
      ],
      userVerification: 'preferred',
    });

    const challengeToken = await createChallengeToken(options.challenge, 'login');

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
    console.error('Login options error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
