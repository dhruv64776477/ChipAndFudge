import crypto from 'crypto';

/**
 * Compute the SHA-256 hash of a raw QR token string.
 * The raw token is sent to the customer in the QR URL (/t/<token>),
 * but only this SHA-256 hash is stored in the database.
 */
export function hashToken(token: string): string {
  if (!token || typeof token !== 'string') {
    throw new Error('Invalid token for hashing');
  }
  return crypto.createHash('sha256').update(token.trim()).digest('hex');
}
