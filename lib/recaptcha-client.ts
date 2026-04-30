'use client';

/**
 * Client-only: obtain reCAPTCHA v3 token. Requires the script in root layout.
 */

export type RecaptchaAction = 'contact' | 'newsletter';

declare global {
  interface Window {
    grecaptcha: {
      ready: (cb: () => void) => void;
      execute: (siteKey: string, options: { action: string }) => Promise<string>;
    };
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

export async function getRecaptchaToken(
  action: RecaptchaAction,
  maxAttempts = 5
): Promise<string> {
  const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;
  if (!siteKey) {
    throw new Error('reCAPTCHA is not configured');
  }
  if (typeof window === 'undefined') {
    throw new Error('reCAPTCHA is only available in the browser');
  }
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    if (window.grecaptcha) {
      return new Promise((resolve, reject) => {
        window.grecaptcha.ready(() => {
          window.grecaptcha
            .execute(siteKey, { action })
            .then(resolve)
            .catch(reject);
        });
      });
    }
    await sleep(120 * (attempt + 1));
  }
  throw new Error('reCAPTCHA is not loaded yet');
}
