import crypto from 'crypto';

// Unambiguous, human-readable character set (excluding 0, O, 1, I)
const CHARSET = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';

/**
 * Generate a cryptographically secure, random Ticket ID (e.g. "7KX9-M2QP-8R4T").
 * Uses Node.js crypto.randomBytes() with at least 128 bits of entropy source.
 */
export function generateSecureTicketId(): string {
  const bytes = crypto.randomBytes(16); // 128 bits of cryptographic randomness
  let result = '';
  for (let i = 0; i < 12; i++) {
    const index = bytes[i] % CHARSET.length;
    result += CHARSET[index];
    if ((i === 3 || i === 7) && i < 11) {
      result += '-';
    }
  }
  return result;
}

/**
 * Generate a cryptographically secure random token (32 bytes = 256 bits = 64 hex characters).
 * This raw token is encoded into the customer's QR URL.
 */
export function generateSecureToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

