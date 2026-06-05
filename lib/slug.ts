/**
 * Canonical URL segment: lowercase, hyphen-separated, URL-decoded once.
 */
export function normalizeSlug(slug: string): string {
  if (slug == null || typeof slug !== 'string') return '';
  let s = slug.trim();
  try {
    s = decodeURIComponent(s);
  } catch {
    // keep trimmed raw slug if decode fails
  }
  return s
    .trim()
    .toLowerCase()
    .replace(/_/g, '-')
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

/** Generate a slug from a display title or name. */
export function slugFromTitle(title: string): string {
  if (!title?.trim()) return '';
  return normalizeSlug(title.replace(/[^a-z0-9]+/gi, '-'));
}
