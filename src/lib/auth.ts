/**
 * Hash helper for passwords and PINs (simple SHA-256 with salt).
 * For production this should use bcrypt/argon2 but SQLite + edge runtime
 * prefer a crypto-based approach.
 */
import crypto from 'crypto';

const SALT = 'ggsa-result-2026-salt';

export function hashSecret(input: string): string {
  return crypto.createHash('sha256').update(SALT + input).digest('hex');
}

export function verifySecret(input: string, hash: string): boolean {
  return hashSecret(input) === hash;
}

/**
 * Generate a 4-digit PIN hash for a student.
 */
export function hashPin(pin: string): string {
  return hashSecret(pin);
}

export function verifyPin(pin: string, hash: string): boolean {
  return verifySecret(pin, hash);
}
