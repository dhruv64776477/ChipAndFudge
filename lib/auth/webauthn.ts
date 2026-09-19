/**
 * WebAuthn Relying Party configuration.
 *
 * In production the RP ID and Origin are locked to environment variables or fallback values.
 */
export function getWebAuthnConfig() {
  const rpName = process.env.WEBAUTHN_RP_NAME || 'The Chip & Fudge';
  let rpID = process.env.WEBAUTHN_RP_ID;
  let origin = process.env.WEBAUTHN_ORIGIN;

  if (!rpID) {
    rpID = process.env.NODE_ENV === 'production' ? 'chip-and-fudge.vercel.app' : 'localhost';
  }
  if (!origin) {
    origin = process.env.NODE_ENV === 'production' ? 'https://chip-and-fudge.vercel.app' : 'http://localhost:3000';
  }

  // Ensure rpID does NOT contain protocol or port or trailing slash
  // WebAuthn RP ID must be a bare hostname (e.g., "chip-and-fudge.vercel.app")
  const cleanRpID = rpID.replace(/^https?:\/\//, '').split('/')[0].split(':')[0];

  // Ensure origin has protocol and NO trailing slash
  // WebAuthn Origin must be full URL with protocol (e.g., "https://chip-and-fudge.vercel.app")
  const cleanOrigin = origin.replace(/\/$/, '');

  if (!rpName || !cleanRpID || !cleanOrigin) {
    throw new Error('WebAuthn production configuration is missing or incomplete.');
  }

  return { rpName, rpID: cleanRpID, origin: cleanOrigin };
}
