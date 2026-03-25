import type { BlogPost } from '@/lib/models';

const META_MAX = 160;
const ARTICLE_BODY_SCHEMA_MAX = 3500;

const TITLE_STOPWORDS = new Set([
  'the',
  'and',
  'for',
  'with',
  'you',
  'that',
  'this',
  'from',
  'are',
  'was',
  'but',
  'not',
  'how',
  'our',
  'your',
  'its',
  'into',
  'about',
]);

export function stripHtmlToPlainText(html: string | undefined | null, maxLength?: number): string {
  let t = (html ?? '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (maxLength != null && t.length > maxLength) {
    const slice = t.slice(0, maxLength);
    const lastSpace = slice.lastIndexOf(' ');
    t = (lastSpace > maxLength * 0.5 ? slice.slice(0, lastSpace) : slice).trimEnd();
    if (t.length > 0) t += '…';
  }
  return t;
}

function clampMetaDescription(text: string, max = META_MAX): string {
  const s = text.trim();
  if (s.length <= max) return s;
  const slice = s.slice(0, max - 1);
  const lastSpace = slice.lastIndexOf(' ');
  const out = (lastSpace > max * 0.5 ? slice.slice(0, lastSpace) : slice).trimEnd();
  return `${out}…`;
}

export function metaDescription(post: Pick<BlogPost, 'excerpt' | 'body'>): string {
  const ex = (post.excerpt ?? '').trim();
  if (ex) return clampMetaDescription(ex);
  return clampMetaDescription(stripHtmlToPlainText(post.body));
}

export function articleBodyForSchema(post: Pick<BlogPost, 'body'>): string | undefined {
  const raw = post.body ?? '';
  if (!raw.trim()) return undefined;
  const t = stripHtmlToPlainText(raw, ARTICLE_BODY_SCHEMA_MAX);
  return t || undefined;
}

export function wordCountFromBody(post: Pick<BlogPost, 'body'>): number | undefined {
  const raw = post.body ?? '';
  if (!raw.trim()) return undefined;
  const t = raw.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  const n = t.split(/\s+/).filter(Boolean).length;
  return n > 0 ? n : undefined;
}

export function titleDerivedKeywords(title: string, maxTokens = 4): string[] {
  return title
    .toLowerCase()
    .split(/[^a-z0-9]+/i)
    .filter((w) => w.length > 2)
    .filter((w) => !TITLE_STOPWORDS.has(w))
    .slice(0, maxTokens);
}

export const BASE_BLOG_KEYWORDS = [
  'interior design',
  'senior living design',
  'design principles',
  'commercial design',
];
