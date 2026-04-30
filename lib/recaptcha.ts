/**
 * Server-only reCAPTCHA v3 verification (siteverify).
 */

const MIN_SCORE = 0.5;
const SITEVERIFY_URL = 'https://www.google.com/recaptcha/api/siteverify';

type SiteverifyResponse = {
  success: boolean;
  score?: number;
  action?: string;
  challenge_ts?: string;
  hostname?: string;
  'error-codes'?: string[];
};

let warnedMissingSecret = false;

function getClientIp(request: Request): string | undefined {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    const first = forwarded.split(',')[0]?.trim();
    if (first) return first;
  }
  const real = request.headers.get('x-real-ip')?.trim();
  if (real) return real;
  return undefined;
}

/**
 * Returns true if verification passed or was skipped (no secret in env).
 * Returns false if the request should be rejected (return 403 in API).
 */
export async function verifyRecaptchaV3(
  token: string | undefined,
  expectedAction: string,
  request: Request
): Promise<boolean> {
  const secret = process.env.RECAPTCHA_SECRET;

  if (!secret) {
    if (!warnedMissingSecret) {
      console.warn('RECAPTCHA_SECRET is not set; reCAPTCHA verification is skipped');
      warnedMissingSecret = true;
    }
    return true;
  }

  if (!token || typeof token !== 'string' || !token.trim()) {
    return false;
  }

  const params = new URLSearchParams();
  params.set('secret', secret);
  params.set('response', token.trim());
  const ip = getClientIp(request);
  if (ip) {
    params.set('remoteip', ip);
  }

  let res: Response;
  try {
    res = await fetch(SITEVERIFY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
    });
  } catch {
    return false;
  }

  if (!res.ok) {
    return false;
  }

  const data = (await res.json()) as SiteverifyResponse;
  if (!data.success) {
    return false;
  }
  if (data.action && data.action !== expectedAction) {
    return false;
  }
  const score = data.score;
  if (typeof score !== 'number' || score < MIN_SCORE) {
    return false;
  }

  return true;
}
