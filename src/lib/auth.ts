/**
 * Hash helper for passwords (simple SHA-256 with salt).
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
 * Generate a unique 6-digit numeric PIN for a result.
 * (6 digits gives 1M possible PINs — plenty for a single school, easy to type.)
 */
export function generateResultPin(): string {
  // 6-digit code, leading zeros allowed (always 6 chars)
  const n = crypto.randomInt(0, 1_000_000);
  return n.toString().padStart(6, '0');
}
