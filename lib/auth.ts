import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';

const DEFAULT_SECRET = 'chip_and_fudge_ultra_secure_session_secret_2026_dev_key_32bytes_min';
const SECRET_KEY = new TextEncoder().encode(process.env.SESSION_SECRET || DEFAULT_SECRET);

export const SESSION_COOKIE_NAME = 'cf_admin_session';
export const CHALLENGE_COOKIE_NAME = 'cf_auth_challenge';

export function getWebAuthnConfig(req?: NextRequest | Request) {
  let rpID = process.env.WEBAUTHN_RP_ID || 'localhost';
  let origin = process.env.WEBAUTHN_ORIGIN || 'http://localhost:3000';
  const rpName = process.env.WEBAUTHN_RP_NAME || 'The Chip & Fudge';

  if (req) {
    const url = new URL(req.url);
    const hostHeader = req.headers.get('host') || url.host;
    const originHeader = req.headers.get('origin');

    // If request specifies origin, allow matching origin
    if (originHeader) {
      origin = originHeader;
      try {
        const originUrl = new URL(originHeader);
        rpID = originUrl.hostname;
      } catch {
        // use fallback
      }
    } else if (hostHeader) {
      const hostname = hostHeader.split(':')[0];
      rpID = hostname;
      const proto = req.headers.get('x-forwarded-proto') || (url.protocol.replace(':', ''));
      origin = `${proto}://${hostHeader}`;
    }
  }

  return { rpName, rpID, origin };
}

export async function createSessionToken(credentialId: string): Promise<string> {
  const token = await new SignJWT({ sub: 'admin', credentialId, role: 'stall_owner' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(SECRET_KEY);
  return token;
}

export async function verifySessionToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, SECRET_KEY);
    return payload;
  } catch {
    return null;
  }
}

export async function createChallengeToken(challenge: string, type: 'registration' | 'login'): Promise<string> {
  const token = await new SignJWT({ challenge, type })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('5m')
    .sign(SECRET_KEY);
  return token;
}

export async function verifyChallengeToken(token: string): Promise<string | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET_KEY);
    if (typeof payload.challenge === 'string') {
      return payload.challenge;
    }
    return null;
  } catch {
    return null;
  }
}

export async function getAdminSessionFromCookies() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!sessionToken) return null;
  return verifySessionToken(sessionToken);
}

export async function requireAdminAuth(req: NextRequest) {
  const sessionToken = req.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (!sessionToken) {
    return null;
  }
  return verifySessionToken(sessionToken);
}
