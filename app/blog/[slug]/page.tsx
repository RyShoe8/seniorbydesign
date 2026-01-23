import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getBlogPost } from '../../actions';
import Image from 'next/image';
import { generateSEOMetadata, JSONLDSchema, ArticleSchema, BreadcrumbSchema } from '@/components/SEO';
import styles from './page.module.css';

function BlogPostContent({ body, title }: { body: string; title: string }) {
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  const imgRegex = /<img[^>]*src=["']([^"']+)["'][^>]*(?:alt=["']([^"']*)["'])?[^>]*>/g;
  let match;
  let partIndex = 0;

  while ((match = imgRegex.exec(body)) !== null) {
    // Add text before image
    const textBefore = body.substring(lastIndex, match.index);
    if (textBefore.trim()) {
      textBefore.split('\n\n').forEach((paragraph, j) => {
        if (paragraph.trim()) {
          parts.push(<p key={`text-${partIndex}-${j}`}>{paragraph.trim()}</p>);
        }
      });
    }
    
    // Add image
    const src = match[1];
    const alt = match[2] || '';
    parts.push(
      <div key={`img-${partIndex}`} className={styles.blogPostImage}>
        <Image
          src={src}
          alt={alt || title}
          width={1200}
          height={800}
          style={{ width: '100%', height: 'auto', objectFit: 'contain' }}
          unoptimized={src.startsWith('http')}
        />
      </div>
    );
    
    lastIndex = imgRegex.lastIndex;
    partIndex++;
  }
  
  // Add remaining text
  const remainingText = body.substring(lastIndex);
  if (remainingText.trim()) {
    remainingText.split('\n\n').forEach((paragraph, j) => {
      if (paragraph.trim()) {
        parts.push(<p key={`text-final-${j}`}>{paragraph.trim()}</p>);
      }
    });
  }
  
  return <>{parts.length > 0 ? parts : <p>No content available.</p>}</>;
}

type Props = {
  params: { slug: string };
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const post = await getBlogPost(params.slug);
  
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
  const post = await getBlogPost(params.slug);

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
      <article className="blog-post">
        <section className={styles.blogPostHero}>
          <div className={styles.blogPostHeroImage}>
            {post.featuredImage ? (
              <Image
                src={post.featuredImage}
                alt={post.title}
                fill
                className={styles.heroImage}
                priority
              />
            ) : (
              <div className={styles.heroPlaceholder} />
            )}
          </div>
        </section>

        <div className={styles.blogPostHeader}>
          <div className="container">
            <div className={styles.blogPostHeaderContent}>
              <Link href="/blog" className={styles.backLink}>
                ← Back to Blog
              </Link>
              {post.publishedAt && (
                <span className={styles.blogPostDate}>
                  {new Date(post.publishedAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </span>
              )}
            </div>
            <h1 className={styles.blogPostTitle}>{post.title}</h1>
          </div>
        </div>

        <div className={styles.blogPostContent}>
          <div className="container">
            <div className={styles.blogPostBody}>
              <BlogPostContent body={post.body} title={post.title} />
            </div>
          </div>
        </div>
      </article>
    </>
  );
}

