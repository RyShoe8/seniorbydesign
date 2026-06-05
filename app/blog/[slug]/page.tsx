import { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { getPublishedBlogPost, getRelatedBlogPosts } from '../../actions';
import PageSchema from '@/components/PageSchema';
import { generateSEOMetadata, ArticleSchema, BreadcrumbSchema } from '@/components/SEO';
import { BlogPostArticle } from '../BlogPostArticle';
import { normalizeSlug } from '@/lib/slug';
import {
  metaDescription,
  articleBodyForSchema,
  wordCountFromBody,
  titleDerivedKeywords,
  BASE_BLOG_KEYWORDS,
} from '@/lib/blog-seo';
import { blogContextualLinks } from '@/lib/internal-links';

type Props = {
  params: { slug: string };
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const decodedSlug = decodeURIComponent(params.slug);
  const post = await getPublishedBlogPost(decodedSlug);

  if (!post) {
    return {
      title: 'Blog Post Not Found',
    };
  }

  const pathSlug = normalizeSlug(post.slug);
  const derived = titleDerivedKeywords(post.title);
  const keywords = Array.from(new Set([...BASE_BLOG_KEYWORDS, ...derived]));

  return generateSEOMetadata({
    title: `${post.title} - The Principled Design Journal`,
    description: metaDescription(post),
    url: `/blog/${pathSlug}`,
    image: post.featuredImage,
    type: 'article',
    publishedTime: post.publishedAt ? new Date(post.publishedAt).toISOString() : undefined,
    modifiedTime: post.updatedAt ? new Date(post.updatedAt).toISOString() : undefined,
    author: post.author,
    keywords,
  });
}

export default async function BlogPostPage({ params }: Props) {
  const decodedSlug = decodeURIComponent(params.slug);
  const post = await getPublishedBlogPost(decodedSlug);

  if (!post) {
    notFound();
  }

  const pathSlug = normalizeSlug(post.slug);
  if (decodedSlug !== pathSlug) {
    redirect(`/blog/${encodeURIComponent(pathSlug)}`);
  }

  const relatedPosts = await getRelatedBlogPosts(post.slug, 3);
  const contextualLinks = blogContextualLinks({
    slug: pathSlug,
    title: post.title,
    excerpt: post.excerpt,
  });

  const derived = titleDerivedKeywords(post.title);
  const keywords = Array.from(new Set([...BASE_BLOG_KEYWORDS, ...derived]));

  return (
    <>
      <PageSchema
        schemas={[
          ArticleSchema({
            title: post.title,
            description: metaDescription(post),
            url: `/blog/${pathSlug}`,
            image: post.featuredImage,
            publishedTime: post.publishedAt ? new Date(post.publishedAt).toISOString() : undefined,
            modifiedTime: post.updatedAt ? new Date(post.updatedAt).toISOString() : undefined,
            authorName: post.author,
            keywords,
            articleBody: articleBodyForSchema(post),
            wordCount: wordCountFromBody(post),
          }),
          BreadcrumbSchema([
            { name: 'Home', url: '/' },
            { name: 'Blog', url: '/blog' },
            { name: post.title, url: `/blog/${pathSlug}` },
          ]),
        ]}
      />
      <BlogPostArticle
        post={post}
        contextualLinks={contextualLinks}
        relatedPosts={relatedPosts.map((p) => ({
          slug: p.slug,
          title: p.title,
          excerpt: p.excerpt,
          featuredImage: p.featuredImage,
        }))}
      />
    </>
  );
}
