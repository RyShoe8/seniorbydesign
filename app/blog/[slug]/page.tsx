import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getPublishedBlogPost } from '../../actions';
import { generateSEOMetadata, JSONLDSchema, ArticleSchema, BreadcrumbSchema } from '@/components/SEO';
import { BlogPostArticle } from '../BlogPostArticle';
import {
  metaDescription,
  articleBodyForSchema,
  wordCountFromBody,
  titleDerivedKeywords,
  BASE_BLOG_KEYWORDS,
} from '@/lib/blog-seo';

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

  const derived = titleDerivedKeywords(post.title);
  const keywords = Array.from(new Set([...BASE_BLOG_KEYWORDS, ...derived]));

  return generateSEOMetadata({
    title: `${post.title} - The Principled Design Journal`,
    description: metaDescription(post),
    url: `/blog/${post.slug}`,
    image: post.featuredImage,
    type: 'article',
    publishedTime: post.publishedAt ? new Date(post.publishedAt).toISOString() : undefined,
    modifiedTime: post.updatedAt ? new Date(post.updatedAt).toISOString() : undefined,
    author: post.author,
    keywords,
  });
}

export default async function BlogPostPage({ params }: Props) {
  const post = await getPublishedBlogPost(params.slug);

  if (!post) {
    notFound();
  }

  const derived = titleDerivedKeywords(post.title);
  const keywords = Array.from(new Set([...BASE_BLOG_KEYWORDS, ...derived]));

  return (
    <>
      <JSONLDSchema schema={ArticleSchema({
        title: post.title,
        description: metaDescription(post),
        url: `/blog/${post.slug}`,
        image: post.featuredImage,
        publishedTime: post.publishedAt ? new Date(post.publishedAt).toISOString() : undefined,
        modifiedTime: post.updatedAt ? new Date(post.updatedAt).toISOString() : undefined,
        authorName: post.author,
        keywords,
        articleBody: articleBodyForSchema(post),
        wordCount: wordCountFromBody(post),
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
