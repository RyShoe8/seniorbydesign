import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getPublishedBlogPost } from '../../actions';
import { generateSEOMetadata, JSONLDSchema, ArticleSchema, BreadcrumbSchema } from '@/components/SEO';
import { BlogPostArticle } from '../BlogPostArticle';

type Props = {
  params: { slug: string };
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const post = await getPublishedBlogPost(params.slug);

  if (!post) {
    return {
      title: 'Blog Post Not Found',
    };
  }

  return generateSEOMetadata({
    title: `${post.title} - The Principled Design Journal`,
    description: post.excerpt || post.body.substring(0, 160),
    url: `/blog/${post.slug}`,
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
  });
}

export default async function BlogPostPage({ params }: Props) {
  const post = await getPublishedBlogPost(params.slug);

  if (!post) {
    notFound();
  }

  return (
    <>
      <JSONLDSchema schema={ArticleSchema({
        title: post.title,
        description: post.excerpt || post.body.substring(0, 200),
        url: `/blog/${post.slug}`,
        image: post.featuredImage,
        publishedTime: post.publishedAt ? new Date(post.publishedAt).toISOString() : undefined,
        modifiedTime: post.updatedAt ? new Date(post.updatedAt).toISOString() : undefined,
        keywords: [
          'interior design',
          'senior living design',
          'commercial design',
          'design principles',
        ],
      })} />
      <JSONLDSchema schema={BreadcrumbSchema([
        { name: 'Home', url: '/' },
        { name: 'Blog', url: '/blog' },
        { name: post.title, url: `/blog/${post.slug}` },
      ])} />
      <BlogPostArticle post={post} />
    </>
  );
}
