import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthenticationResponse } from '@simplewebauthn/server';
import type { AuthenticationResponseJSON } from '@simplewebauthn/server';
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

    const adminDevice = await AdminDevice.findOne({ enabled: true });
    if (!adminDevice) {
      return NextResponse.json(
        { error: 'No admin passkey has been enrolled. Please visit /admin/setup.' },
        { status: 400 }
      );
    }

    const body = await req.json();

    // Dev network bypass login if enrolled via dev mode
    if (body.devBypass === true && (process.env.NODE_ENV as string) !== 'production') {
      adminDevice.lastUsedAt = new Date();
      await adminDevice.save();

      await AuditLog.create({
        action: 'ADMIN_LOGIN',
        deviceId: adminDevice.deviceId,
        timestamp: new Date(),
        details: { mode: 'DEV_NETWORK_LOGIN' },
      });

      const sessionToken = await createSessionToken(adminDevice.deviceId);
      const res = NextResponse.json({
        verified: true,
        message: 'Admin authenticated in dev mode.',
      });

      res.cookies.set(SESSION_COOKIE_NAME, sessionToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 7 * 24 * 60 * 60,
      });

      return res;
    }

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

    const { rpID, origin } = getWebAuthnConfig(req);
    const credentialPublicKey = new Uint8Array(Buffer.from(adminDevice.webauthnPublicKey, 'base64'));

    const verification = await verifyAuthenticationResponse({
      response: body as AuthenticationResponseJSON,
      expectedChallenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
      credential: {
        id: adminDevice.webauthnCredentialId,
        publicKey: credentialPublicKey,
        counter: adminDevice.counter,
        transports: adminDevice.transports as any,
      },
    });

    if (!verification.verified || !verification.authenticationInfo) {
      return NextResponse.json(
        { error: 'Passkey authentication failed. Unauthorized device.' },
        { status: 401 }
      );
    }

    // Update replay counter
    adminDevice.counter = verification.authenticationInfo.newCounter;
    adminDevice.lastUsedAt = new Date();
    await adminDevice.save();

    await AuditLog.create({
      action: 'ADMIN_LOGIN',
      deviceId: adminDevice.deviceId,
      timestamp: new Date(),
      details: {
        credentialID: adminDevice.webauthnCredentialId,
        counter: adminDevice.counter,
      },
    });

    const sessionToken = await createSessionToken(adminDevice.deviceId);

    const res = NextResponse.json({
      verified: true,
      message: 'Admin authenticated successfully.',
    });

    res.cookies.set(SESSION_COOKIE_NAME, sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
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
