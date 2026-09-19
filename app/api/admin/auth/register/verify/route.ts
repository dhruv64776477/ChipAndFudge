import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { verifyRegistrationResponse } from '@simplewebauthn/server';
import type { RegistrationResponseJSON } from '@simplewebauthn/server';
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

    // Enforce single admin device rule at the database level
    const deviceCount = await AdminDevice.countDocuments();
    if (deviceCount > 0) {
      return NextResponse.json(
        { error: 'Registration rejected. Only one active master admin device is permitted.' },
        { status: 403 }
      );
    }

    const body = await req.json();

    const challengeCookie = req.cookies.get(CHALLENGE_COOKIE_NAME)?.value;
    if (!challengeCookie) {
      return NextResponse.json(
        { error: 'Registration challenge expired or missing. Please try again.' },
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

    const verification = await verifyRegistrationResponse({
      response: body as RegistrationResponseJSON,
      expectedChallenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
    });

    if (!verification.verified || !verification.registrationInfo) {
      return NextResponse.json(
        { error: 'Passkey registration verification failed.' },
        { status: 400 }
      );
    }

    const { credential } = verification.registrationInfo;
    const publicKeyBase64 = Buffer.from(credential.publicKey).toString('base64');
    const deviceId = `device-${crypto.randomUUID()}`;

    const adminDevice = await AdminDevice.create({
      deviceId,
      credentialId: credential.id,
      publicKey: publicKeyBase64,
      counter: credential.counter,
      transports: credential.transports || [],
      createdAt: new Date(),
      lastUsedAt: new Date(),
    });

    await AuditLog.create({
      action: 'ADMIN_LOGIN',
      deviceId,
      timestamp: new Date(),
      details: {
        credentialId: credential.id,
        registeredAt: adminDevice.createdAt,
      },
    });

    const sessionToken = await createSessionToken(credential.id, deviceId);

    const res = NextResponse.json({
      verified: true,
      message: 'Master passkey enrolled successfully.',
      deviceId,
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
    console.error('Registration verification error:', error);
    const message = error instanceof Error ? error.message : 'Registration failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
