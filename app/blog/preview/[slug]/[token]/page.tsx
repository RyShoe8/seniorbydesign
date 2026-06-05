import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getBlogPostForPreview } from '../../../../actions';
import PageSchema from '@/components/PageSchema';
import { generateSEOMetadata, BreadcrumbSchema } from '@/components/SEO';
import { BlogPostArticle } from '../../../BlogPostArticle';
import { metaDescription, titleDerivedKeywords, BASE_BLOG_KEYWORDS } from '@/lib/blog-seo';

type Props = {
  params: { slug: string; token: string };
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const post = await getBlogPostForPreview(params.slug, params.token);

  if (!post) {
    return {
      title: 'Blog Preview Not Found',
      robots: { index: false, follow: false },
    };
  }

  const previewPath = `/blog/preview/${encodeURIComponent(params.slug)}/${encodeURIComponent(params.token)}`;
  const derived = titleDerivedKeywords(post.title);
  const keywords = Array.from(new Set([...BASE_BLOG_KEYWORDS, ...derived]));

  return {
    ...generateSEOMetadata({
      title: `Preview: ${post.title} - The Principled Design Journal`,
      description: metaDescription(post),
      url: previewPath,
      image: post.featuredImage,
      type: 'article',
      publishedTime: post.publishedAt ? new Date(post.publishedAt).toISOString() : undefined,
      modifiedTime: post.updatedAt ? new Date(post.updatedAt).toISOString() : undefined,
      author: post.author,
      keywords,
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
      <PageSchema
        schemas={[
          BreadcrumbSchema([
            { name: 'Home', url: '/' },
            { name: 'Blog', url: '/blog' },
            { name: post.title, url: previewPath },
          ]),
        ]}
      />
      <BlogPostArticle post={post} showPreviewBanner />
    </>
  );
}
