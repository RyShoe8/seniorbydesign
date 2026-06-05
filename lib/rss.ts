import type { BlogPost } from '@/lib/models';
import { absoluteUrl } from '@/lib/schema/constants';
import { metaDescription } from '@/lib/blog-seo';
import { BLOG_INDEX_META } from '@/lib/team-seo';

const FEED_TITLE = 'The Principled Design Journal | Senior By Design';
const FEED_PATH = '/feed.xml';
const BLOG_PATH = '/blog';
const MAX_ITEMS = 50;

export function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export function formatRfc822(date: Date): string {
  return date.toUTCString();
}

function cdata(text: string): string {
  return `<![CDATA[${text.replace(/]]>/g, ']]]]><![CDATA[>')}]]>`;
}

function postDate(post: BlogPost): Date | null {
  const raw = post.updatedAt ?? post.publishedAt;
  if (!raw) return null;
  return raw instanceof Date ? raw : new Date(raw);
}

function enclosureType(url: string): string {
  const lower = url.toLowerCase();
  if (lower.endsWith('.png')) return 'image/png';
  if (lower.endsWith('.webp')) return 'image/webp';
  if (lower.endsWith('.gif')) return 'image/gif';
  return 'image/jpeg';
}

function featuredImageUrl(image: string | undefined): string | null {
  if (!image?.trim()) return null;
  return image.startsWith('http') ? image : absoluteUrl(image);
}

export function buildBlogRssFeed(posts: BlogPost[]): string {
  const feedUrl = absoluteUrl(FEED_PATH);
  const blogUrl = absoluteUrl(BLOG_PATH);

  const items = posts
    .filter((post) => post.slug && post.publishedAt)
    .slice(0, MAX_ITEMS);

  const lastBuild =
    items.reduce<Date | null>((latest, post) => {
      const d = postDate(post);
      if (!d || Number.isNaN(d.getTime())) return latest;
      return !latest || d > latest ? d : latest;
    }, null) ?? new Date();

  const itemXml = items
    .map((post) => {
      const link = absoluteUrl(`/blog/${encodeURIComponent(post.slug)}`);
      const pubDate = post.publishedAt
        ? formatRfc822(post.publishedAt instanceof Date ? post.publishedAt : new Date(post.publishedAt))
        : '';
      const description = metaDescription(post);
      const author = post.author?.trim();

      const enclosureUrl = featuredImageUrl(post.featuredImage);
      const enclosure = enclosureUrl
        ? `\n      <enclosure url="${escapeXml(enclosureUrl)}" type="${enclosureType(enclosureUrl)}" />`
        : '';

      const authorTag = author ? `\n      <author>${escapeXml(author)}</author>` : '';

      return `    <item>
      <title>${escapeXml(post.title)}</title>
      <link>${escapeXml(link)}</link>
      <guid isPermaLink="true">${escapeXml(link)}</guid>
      <description>${cdata(description)}</description>${authorTag}
      <pubDate>${pubDate}</pubDate>${enclosure}
    </item>`;
    })
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(FEED_TITLE)}</title>
    <link>${escapeXml(blogUrl)}</link>
    <description>${escapeXml(BLOG_INDEX_META)}</description>
    <language>en-us</language>
    <lastBuildDate>${formatRfc822(lastBuild)}</lastBuildDate>
    <atom:link href="${escapeXml(feedUrl)}" rel="self" type="application/rss+xml" />
${itemXml}
  </channel>
</rss>`;
}
