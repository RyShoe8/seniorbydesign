import { getBlogPosts } from '@/app/actions';
import { buildBlogRssFeed } from '@/lib/rss';

export const revalidate = 300;
export const dynamic = 'force-dynamic';

export async function GET() {
  let posts: Awaited<ReturnType<typeof getBlogPosts>> = [];

  try {
    posts = await getBlogPosts();
  } catch (error) {
    console.error('Error generating RSS feed:', error);
  }

  const xml = buildBlogRssFeed(posts);

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
    },
  });
}
