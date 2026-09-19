// Barrel export for lib/auth
export { SESSION_COOKIE_NAME, CHALLENGE_COOKIE_NAME } from './constants';
export {
  createSessionToken,
  verifySessionToken,
  createChallengeToken,
  verifyChallengeToken,
  getAdminSession,
  getAdminSessionFromRequest,
} from './session';
export { getWebAuthnConfig } from './webauthn';
export { requireAdminAuth } from './admin';
export type { AdminAuthResult } from './admin';
