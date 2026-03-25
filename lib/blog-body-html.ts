import sanitizeHtml from 'sanitize-html';

const BLOCK_TAG_RE = /<\s*(p|h[1-6]|ul|ol|blockquote|div|pre)[\s>/]/i;

const ALLOWED_TAGS = [
  'p',
  'br',
  'strong',
  'em',
  'b',
  'i',
  'u',
  's',
  'strike',
  'h2',
  'h3',
  'h4',
  'ul',
  'ol',
  'li',
  'a',
  'img',
  'blockquote',
  'code',
  'pre',
];

const SANITIZE_OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: ALLOWED_TAGS,
  allowedAttributes: {
    a: ['href', 'target', 'rel'],
    img: ['src', 'alt', 'width', 'height'],
  },
  allowedSchemes: ['http', 'https', 'mailto'],
  allowProtocolRelative: false,
};

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function wrapPlainSegments(text: string): string {
  const trimmed = text.trim();
  if (!trimmed) return '';
  return trimmed
    .split(/\n\n+/)
    .map((chunk) => {
      const inner = escapeHtml(chunk).replace(/\n/g, '<br />');
      return `<p>${inner}</p>`;
    })
    .join('');
}

/** Legacy posts: plain text and newlines with optional raw <img> tags, no block wrappers. */
export function normalizeLegacyBlogBody(body: string): string {
  const t = body.trim();
  if (!t) return '<p></p>';
  if (BLOCK_TAG_RE.test(t)) return body;

  const imgRe = /<img\b[^>]*>/gi;
  const out: string[] = [];
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = imgRe.exec(t)) !== null) {
    const before = t.slice(last, m.index);
    if (before) out.push(wrapPlainSegments(before));
    out.push(m[0]);
    last = m.index + m[0].length;
  }
  const tail = t.slice(last);
  if (tail) out.push(wrapPlainSegments(tail));
  return out.join('') || '<p></p>';
}

export function sanitizeBlogBodyHtml(html: string): string {
  return sanitizeHtml(html, SANITIZE_OPTIONS);
}

export function prepareBlogBodyForDisplay(body: string | null | undefined): string {
  const raw = typeof body === 'string' ? body : '';
  const normalized = normalizeLegacyBlogBody(raw);
  return sanitizeBlogBodyHtml(normalized);
}
