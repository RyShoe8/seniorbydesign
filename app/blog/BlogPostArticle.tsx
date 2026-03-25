import Image from 'next/image';
import Link from 'next/link';
import styles from './[slug]/page.module.css';

export type BlogPostArticleData = {
  slug: string;
  title: string;
  body: string;
  featuredImage?: string;
  publishedAt?: Date;
};

function BlogPostContent({ body, title }: { body: string; title: string }) {
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  const imgRegex = /<img[^>]*src=["']([^"']+)["'][^>]*(?:alt=["']([^"']*)["'])?[^>]*>/g;
  let match;
  let partIndex = 0;

  while ((match = imgRegex.exec(body)) !== null) {
    const textBefore = body.substring(lastIndex, match.index);
    if (textBefore.trim()) {
      textBefore.split('\n\n').forEach((paragraph, j) => {
        if (paragraph.trim()) {
          parts.push(<p key={`text-${partIndex}-${j}`}>{paragraph.trim()}</p>);
        }
      });
    }

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
  post: BlogPostArticleData;
  showPreviewBanner?: boolean;
};

export function BlogPostArticle({ post, showPreviewBanner }: Props) {
  return (
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
            {showPreviewBanner && (
              <span className={styles.blogPostDate} style={{ fontWeight: 600 }}>
                Preview{!post.publishedAt ? ' — not published' : ''}
              </span>
            )}
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
  );
}
