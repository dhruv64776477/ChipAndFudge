import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';
import { AdminSessionPayload } from '@/types/admin';

const DEFAULT_SECRET = 'chip_and_fudge_ultra_secure_session_secret_2026_dev_key_32bytes_min';
const SECRET_KEY = new TextEncoder().encode(process.env.SESSION_SECRET || DEFAULT_SECRET);

export const SESSION_COOKIE_NAME = 'cf_admin_session';
export const CHALLENGE_COOKIE_NAME = 'cf_auth_challenge';

export async function createSessionToken(deviceId: string): Promise<string> {
  return await new SignJWT({
    sub: 'admin',
    deviceId,
    role: 'admin',
  } as AdminSessionPayload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(SECRET_KEY);
}

export async function verifySessionToken(token: string): Promise<AdminSessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET_KEY);
    if (payload.role === 'admin' && typeof payload.deviceId === 'string') {
      return payload as unknown as AdminSessionPayload;
    }
    return null;
  } catch {
    return null;
  }
}

export async function createChallengeToken(
  challenge: string,
  type: 'registration' | 'login'
): Promise<string> {
  return await new SignJWT({ challenge, type })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('5m')
    .sign(SECRET_KEY);
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

export async function getAdminSession(): Promise<AdminSessionPayload | null> {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!sessionToken) return null;
  return verifySessionToken(sessionToken);
}

export function getAdminSessionFromRequest(req: NextRequest): Promise<AdminSessionPayload | null> {
  const sessionToken = req.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (!sessionToken) return Promise.resolve(null);
  return verifySessionToken(sessionToken);
}
