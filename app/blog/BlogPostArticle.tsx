import Image from 'next/image';
import Link from 'next/link';
import { prepareBlogBodyForDisplay } from '@/lib/blog-body-html';
import styles from './[slug]/page.module.css';

export type BlogPostArticleData = {
  slug: string;
  title: string;
  body: string;
  featuredImage?: string;
  publishedAt?: Date;
};

function isHtmlEffectivelyEmpty(html: string): boolean {
  return !html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
}

type Props = {
  post: BlogPostArticleData;
  showPreviewBanner?: boolean;
};

export function BlogPostArticle({ post, showPreviewBanner }: Props) {
  const safeHtml = prepareBlogBodyForDisplay(post.body);
  const empty = isHtmlEffectivelyEmpty(safeHtml);

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
          {empty ? (
            <div className={styles.blogPostBody}>
              <p>No content available.</p>
            </div>
          ) : (
            <div
              className={styles.blogPostBody}
              dangerouslySetInnerHTML={{ __html: safeHtml }}
            />
          )}
        </div>
      </div>
    </article>
  );
}
