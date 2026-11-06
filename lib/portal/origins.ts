// Where account links (invitations, password resets) and staff notices point.
// These are chosen from configuration only, never from request headers, because
// a forged Host header must not be able to redirect a secret token.
const PRODUCTION = {
  staff: "https://seniorbydesign.com",
  client: "https://clients.seniorbydesign.com",
} as const;

export type OriginAudience = keyof typeof PRODUCTION;
type Env = Record<string, string | undefined>;

export function parseOrigin(value: string | undefined): string | null {
  const raw = value?.trim();
  if (!raw) return null;
  try {
    const url = new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`);
    return /\./.test(url.hostname) || url.hostname === "localhost" ? url.origin : null;
  } catch {
    return null;
  }
}

export function accountOrigin(
  audience: OriginAudience,
  env: Env = process.env,
): string | null {
  const configured = parseOrigin(
    audience === "staff" ? env.SBD_ADMIN_ORIGIN : env.SBD_PORTAL_ORIGIN,
  );
  if (configured) return configured;
  // A non-production Vercel deployment keeps its links on that deployment.
  if (env.VERCEL_ENV && env.VERCEL_ENV !== "production") {
    const preview = parseOrigin(env.VERCEL_URL);
    if (preview) return preview;
  }
  const fallback = parseOrigin(env.NEXTAUTH_URL) || parseOrigin(env.NEXT_PUBLIC_SITE_URL);
  if (fallback) return fallback;
  return env.VERCEL_ENV === "production" || env.NODE_ENV === "production"
    ? PRODUCTION[audience]
    : null;
}

/**
 * Same-site check for state-changing requests. The request URL is compared
 * first, then the host the platform reports, so a proxy that rewrites the
 * internal URL does not reject genuine same-site requests.
 */
export function sameSiteRequest(
  origin: string | null,
  requestUrl: string,
  headers: { get(name: string): string | null },
): boolean {
  if (!origin) return false;
  if (origin === new URL(requestUrl).origin) return true;
  const originHost = parseOrigin(origin) && new URL(origin).host;
  if (!originHost) return false;
  return [headers.get("x-forwarded-host")?.split(",")[0].trim(), headers.get("host")]
    .filter(Boolean)
    .includes(originHost);
}
