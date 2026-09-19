/**
 * WebAuthn Relying Party configuration.
 *
 * In production the RP ID and Origin are locked to the environment variables.
 * Dynamic header-based overrides are only allowed in development for localhost
 * convenience.  This prevents an attacker from forging the Origin header to
 * bypass WebAuthn origin validation.
 */
export function getWebAuthnConfig() {
  const rpName = process.env.WEBAUTHN_RP_NAME || 'The Chip & Fudge';
  const rpID = process.env.WEBAUTHN_RP_ID || 'localhost';
  const origin = process.env.WEBAUTHN_ORIGIN || 'http://localhost:3000';

  return { rpName, rpID, origin };
}
