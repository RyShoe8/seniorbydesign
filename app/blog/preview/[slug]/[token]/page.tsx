import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getBlogPostForPreview } from '../../../../actions';
import { generateSEOMetadata, JSONLDSchema, BreadcrumbSchema } from '@/components/SEO';
import { BlogPostArticle } from '../../../BlogPostArticle';

type Props = {
  params: { slug: string; token: string };
};

function bodyPlainPreview(body: string | undefined): string {
  return (body ?? '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 160);
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const post = await getBlogPostForPreview(params.slug, params.token);

  if (!post) {
    return {
      title: 'Blog Preview Not Found',
      robots: { index: false, follow: false },
    };
  }

  const previewPath = `/blog/preview/${encodeURIComponent(params.slug)}/${encodeURIComponent(params.token)}`;

  return {
    ...generateSEOMetadata({
      title: `Preview: ${post.title} - The Principled Design Journal`,
      description: post.excerpt || bodyPlainPreview(post.body),
      url: previewPath,
      image: post.featuredImage,
      type: 'article',
      publishedTime: post.publishedAt ? new Date(post.publishedAt).toISOString() : undefined,
      modifiedTime: post.updatedAt ? new Date(post.updatedAt).toISOString() : undefined,
      keywords: [
        'interior design',
        'senior living design',
        'design principles',
        'commercial design',
      ],
    }),
    robots: { index: false, follow: false },
  };
}

export default async function BlogPreviewPage({ params }: Props) {
  const post = await getBlogPostForPreview(params.slug, params.token);

  if (!post) {
    notFound();
  }

  const previewPath = `/blog/preview/${encodeURIComponent(params.slug)}/${encodeURIComponent(params.token)}`;

  return (
    <>
      <JSONLDSchema schema={BreadcrumbSchema([
        { name: 'Home', url: '/' },
        { name: 'Blog', url: '/blog' },
        { name: post.title, url: previewPath },
      ])} />
      <BlogPostArticle post={post} showPreviewBanner />
    </>
  );
}
