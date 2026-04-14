/**
 * Canonical service URL segment: lowercase, trimmed, URL-decoded once.
 * Use for sitemaps, canonicals, and DB persistence so one URL consolidates signals.
 */
export function normalizeServiceSlug(slug: string): string {
  if (slug == null || typeof slug !== 'string') return '';
  let s = slug.trim();
  try {
    s = decodeURIComponent(s);
  } catch {
    // keep trimmed raw slug if decode fails
  }
  return s.trim().toLowerCase();
}
