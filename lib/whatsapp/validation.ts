// lib/whatsapp/validation.ts
//
// Helpers for validating input and building the WhatsApp JID.

const MIN_PHONE_DIGITS = 8; // shortest real-world numbers (with country code)
const MAX_PHONE_DIGITS = 15; // E.164 max length

/**
 * Strips spaces, dashes, parentheses and a leading "+" from a phone number.
 * If 10 digits are passed without country code, automatically prepends "91" (India).
 */
export function normalizePhone(rawPhone: string): string {
  if (typeof rawPhone !== 'string') return '';
  let digits = rawPhone.replace(/[^\d]/g, '');
  if (digits.length === 10) {
    digits = '91' + digits;
  }
  return digits;
}

/**
 * Validates that a phone number (after normalization) is a plausible
 * international number including country code.
 */
export function validatePhone(rawPhone: string): { valid: boolean; digits: string; error?: string } {
  if (!rawPhone || typeof rawPhone !== 'string') {
    return { valid: false, digits: '', error: 'phone is required and must be a string' };
  }

  const digits = normalizePhone(rawPhone);

  if (digits.length < MIN_PHONE_DIGITS || digits.length > MAX_PHONE_DIGITS) {
    return {
      valid: false,
      digits,
      error: `phone must contain ${MIN_PHONE_DIGITS}-${MAX_PHONE_DIGITS} digits including country code`,
    };
  }

  return { valid: true, digits };
}

/**
 * Converts a validated phone number (digits only, with country code) into
 * a WhatsApp JID suitable for Baileys' sendMessage().
 */
export function toWhatsAppJid(digits: string): string {
  return `${digits}@s.whatsapp.net`;
}

/**
 * Validates a plain text message body.
 */
export function validateMessage(message: string): { valid: boolean; error?: string } {
  if (!message || typeof message !== 'string') {
    return { valid: false, error: 'message is required and must be a string' };
  }
  if (message.trim().length === 0) {
    return { valid: false, error: 'message cannot be empty' };
  }
  if (message.length > 4096) {
    return { valid: false, error: 'message is too long (max 4096 characters)' };
  }
  return { valid: true };
}

/**
 * Validates a URL string.
 */
export function validateLink(link: string): { valid: boolean; error?: string } {
  if (!link || typeof link !== 'string') {
    return { valid: false, error: 'link is required and must be a string' };
  }
  try {
    const url = new URL(link);
    if (!['http:', 'https:'].includes(url.protocol)) {
      return { valid: false, error: 'link must use http or https' };
    }
    return { valid: true };
  } catch {
    return { valid: false, error: 'link must be a valid URL' };
  }
}
