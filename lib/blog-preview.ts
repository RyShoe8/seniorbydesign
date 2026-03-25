import { randomBytes, timingSafeEqual } from 'crypto';

export function generateBlogPreviewToken(): string {
  return randomBytes(24).toString('hex');
}

export function blogPreviewTokensMatch(stored: string | undefined, provided: string): boolean {
  if (!stored || !provided) return false;
  if (stored.length !== provided.length) return false;
  try {
    return timingSafeEqual(Buffer.from(stored, 'utf8'), Buffer.from(provided, 'utf8'));
  } catch {
    return false;
  }
}
