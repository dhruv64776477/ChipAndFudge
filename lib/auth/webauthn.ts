/**
 * WebAuthn Relying Party configuration.
 *
 * In production the RP ID and Origin are loaded from environment variables
 * with production fallback defaults if running on Vercel.
 */
export function getWebAuthnConfig() {
  const envRpName = process.env.WEBAUTHN_RP_NAME;
  const envRpID = process.env.WEBAUTHN_RP_ID;
  const envOrigin = process.env.WEBAUTHN_ORIGIN;
  const envAppUrl = process.env.NEXT_PUBLIC_APP_URL;

  // Safe diagnostic logging (NO secrets logged)
  console.log('[WebAuthn Config]', {
    hasRpName: Boolean(envRpName),
    rpId: envRpID || '(undefined, using fallback)',
    hasOrigin: Boolean(envOrigin),
    hasAppUrl: Boolean(envAppUrl),
    nodeEnv: process.env.NODE_ENV,
  });

  const rpName = envRpName || 'The Chip & Fudge';

  // Determine raw RP ID with production domain fallback
  let rawRpID = envRpID;
  if (!rawRpID) {
    rawRpID = process.env.NODE_ENV === 'production' ? 'chip-and-fudge.vercel.app' : 'localhost';
  }

  // Determine raw Origin with production URL fallback
  let rawOrigin = envOrigin || envAppUrl;
  if (!rawOrigin) {
    rawOrigin = process.env.NODE_ENV === 'production' ? 'https://chip-and-fudge.vercel.app' : 'http://localhost:3000';
  }

  // Fail explicitly before calling .replace() if any value is missing
  if (!rpName) {
    throw new Error('Missing WEBAUTHN_RP_NAME');
  }
  if (!rawRpID) {
    throw new Error('Missing WEBAUTHN_RP_ID');
  }
  if (!rawOrigin) {
    throw new Error('Missing WEBAUTHN_ORIGIN');
  }

  // Sanitize RP ID: WebAuthn RP ID must be a bare hostname (e.g., "chip-and-fudge.vercel.app")
  // Remove protocol, port, or path if incorrectly included in environment variables
  const cleanRpID = String(rawRpID).trim().replace(/^https?:\/\//i, '').split('/')[0].split(':')[0];

  // Sanitize Origin: WebAuthn Origin must be full URL with protocol (e.g., "https://chip-and-fudge.vercel.app")
  // Remove trailing slash
  const cleanOrigin = String(rawOrigin).trim().replace(/\/+$/, '');

  if (!cleanRpID) {
    throw new Error('Invalid or empty WEBAUTHN_RP_ID after sanitization');
  }
  if (!cleanOrigin) {
    throw new Error('Invalid or empty WEBAUTHN_ORIGIN after sanitization');
  }

  return { rpName, rpID: cleanRpID, origin: cleanOrigin };
}
