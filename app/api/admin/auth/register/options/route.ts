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
    const existingDeviceCount = await AdminDevice.countDocuments();
    if (existingDeviceCount > 0) {
      console.warn('[WebAuthn Register Options] Registration rejected: Admin device already exists in DB');
      return NextResponse.json(
        { error: 'ADMIN_ALREADY_REGISTERED', message: 'An admin device is already registered.' },
        { status: 403 }
      );
    }

    const { rpName, rpID } = getWebAuthnConfig();

    // Validate required values explicitly
    if (!rpName) {
      throw new Error('Missing WEBAUTHN_RP_NAME');
    }
    if (!rpID) {
      throw new Error('Missing WEBAUTHN_RP_ID');
    }

    const userName = 'admin@thechipandfudge.com';
    const userDisplayName = 'The Chip & Fudge Admin';

    // Stable 32-byte Uint8Array userID for the master admin user
    const userID = new TextEncoder().encode('the-chip-and-fudge-admin-master-user');

    console.log('[WebAuthn Register Inputs]', {
      hasRpName: Boolean(rpName),
      hasRpId: Boolean(rpID),
      hasUserName: Boolean(userName),
      hasUserId: Boolean(userID),
    });

    const options = await generateRegistrationOptions({
      rpName,
      rpID,
      userID,
      userName,
      userDisplayName,
      attestationType: 'none',
      authenticatorSelection: {
        residentKey: 'preferred',
        userVerification: 'required',
      },
    });

    // Validate all generated option properties explicitly before returning to client
    if (!options) {
      throw new Error('generateRegistrationOptions returned undefined');
    }
    if (!options.challenge) {
      throw new Error('Missing WebAuthn challenge in generated options');
    }
    if (!options.user) {
      throw new Error('Missing WebAuthn user object in generated options');
    }
    if (!options.user.id) {
      throw new Error('Missing WebAuthn user ID in generated options');
    }
    if (!options.rp || !options.rp.id) {
      throw new Error('Missing WebAuthn RP ID in generated options');
    }

    console.log('[WebAuthn Generated Options Summary]', {
      hasChallenge: Boolean(options.challenge),
      hasRp: Boolean(options.rp),
      hasRpId: Boolean(options.rp?.id),
      hasUser: Boolean(options.user),
      hasUserId: Boolean(options.user?.id),
      hasUserName: Boolean(options.user?.name),
    });

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
    console.error('[Registration options error]', error);
    const message = error instanceof Error ? error.message : 'Failed to generate registration options.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
