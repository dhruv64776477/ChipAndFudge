import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthenticationResponse } from '@simplewebauthn/server';
import type { AuthenticationResponseJSON, AuthenticatorTransport } from '@simplewebauthn/server';
import { connectToDatabase } from '@/lib/mongodb';
import { AdminDevice } from '@/models/AdminDevice';
import { AuditLog } from '@/models/AuditLog';
import { getWebAuthnConfig } from '@/lib/auth/webauthn';
import {
  verifyChallengeToken,
  createSessionToken,
  CHALLENGE_COOKIE_NAME,
  SESSION_COOKIE_NAME,
} from '@/lib/auth/session';

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();

    const adminDevice = await AdminDevice.findOne();
    if (!adminDevice) {
      return NextResponse.json(
        { error: 'No admin passkey has been enrolled. Please visit /admin/setup.' },
        { status: 400 }
      );
    }

    const body = await req.json();

    const challengeCookie = req.cookies.get(CHALLENGE_COOKIE_NAME)?.value;
    if (!challengeCookie) {
      return NextResponse.json(
        { error: 'Login challenge expired or not found. Please try again.' },
        { status: 400 }
      );
    }

    const expectedChallenge = await verifyChallengeToken(challengeCookie);
    if (!expectedChallenge) {
      return NextResponse.json(
        { error: 'Invalid challenge signature or expired challenge.' },
        { status: 400 }
      );
    }

    const { rpID, origin } = getWebAuthnConfig();
    if (!rpID) {
      throw new Error('Missing WEBAUTHN_RP_ID');
    }
    if (!origin) {
      throw new Error('Missing WEBAUTHN_ORIGIN');
    }
    if (!expectedChallenge) {
      throw new Error('Missing expected WebAuthn challenge');
    }
    if (!adminDevice.publicKey) {
      throw new Error('Missing AdminDevice stored publicKey');
    }

    const credentialPublicKey = new Uint8Array(Buffer.from(adminDevice.publicKey, 'base64'));

    const verification = await verifyAuthenticationResponse({
      response: body as AuthenticationResponseJSON,
      expectedChallenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
      credential: {
        id: adminDevice.credentialId,
        publicKey: credentialPublicKey,
        counter: adminDevice.counter,
        transports: (adminDevice.transports || []) as AuthenticatorTransport[],
      },
    });

    if (!verification.verified || !verification.authenticationInfo) {
      return NextResponse.json(
        { error: 'Passkey authentication failed. Unauthorized device.' },
        { status: 401 }
      );
    }

    // Update replay counter according to WebAuthn verification result
    adminDevice.counter = verification.authenticationInfo.newCounter;
    adminDevice.lastUsedAt = new Date();
    await adminDevice.save();

    await AuditLog.create({
      action: 'ADMIN_LOGIN',
      deviceId: adminDevice.deviceId,
      timestamp: new Date(),
      details: {
        credentialId: adminDevice.credentialId,
        counter: adminDevice.counter,
      },
    });

    const sessionToken = await createSessionToken(adminDevice.credentialId, adminDevice.deviceId);

    const res = NextResponse.json({
      verified: true,
      message: 'Admin authenticated successfully.',
    });

    res.cookies.set(SESSION_COOKIE_NAME, sessionToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60,
    });

    res.cookies.set(CHALLENGE_COOKIE_NAME, '', {
      httpOnly: true,
      maxAge: 0,
      path: '/',
    });

    return res;
  } catch (error: unknown) {
    console.error('Login verification error:', error);
    const message = error instanceof Error ? error.message : 'Authentication failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
