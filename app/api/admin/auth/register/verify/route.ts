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

    // Check if an admin device is already registered (Section 10)
    const existingAdmin = await AdminDevice.findOne({ enabled: true });
    if (existingAdmin) {
      return NextResponse.json(
        { error: 'Registration rejected. Only one active master admin device is permitted.' },
        { status: 403 }
      );
    }

    const body = await req.json();

    // Handle dev network bypass if enabled for non-HTTPS local IP development
    if (body.devBypass === true && (process.env.NODE_ENV as string) !== 'production') {
      const deviceId = `dev-${crypto.randomUUID()}`;
      const devDevice = await AdminDevice.create({
        deviceId,
        name: body.deviceName || 'Local Network Dev Device',
        webauthnCredentialId: `dev-cred-${Date.now()}`,
        webauthnPublicKey: 'dev-dummy-key',
        counter: 1,
        enabled: true,
        createdAt: new Date(),
        lastUsedAt: new Date(),
      });

      await AuditLog.create({
        action: 'ADMIN_LOGIN',
        deviceId,
        timestamp: new Date(),
        details: { mode: 'DEV_NETWORK_ENROLMENT' },
      });

      const sessionToken = await createSessionToken(deviceId);
      const res = NextResponse.json({
        verified: true,
        message: 'Master device enrolled in development mode.',
        deviceId,
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

    const { rpID, origin } = getWebAuthnConfig(req);

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
      name: 'Master Admin Device',
      webauthnCredentialId: credential.id,
      webauthnPublicKey: publicKeyBase64,
      counter: credential.counter,
      enabled: true,
      transports: credential.transports || [],
      createdAt: new Date(),
      lastUsedAt: new Date(),
    });

    await AuditLog.create({
      action: 'ADMIN_LOGIN',
      deviceId,
      timestamp: new Date(),
      details: {
        credentialID: credential.id,
        registeredAt: adminDevice.createdAt,
      },
    });

    const sessionToken = await createSessionToken(deviceId);

    const res = NextResponse.json({
      verified: true,
      message: 'Master passkey enrolled successfully.',
      deviceId,
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
    console.error('Registration verification error:', error);
    const message = error instanceof Error ? error.message : 'Registration failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
