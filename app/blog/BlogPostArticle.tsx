import AboutSbdBoilerplate from '@/components/AboutSbdBoilerplate';
import SeoImage from '@/components/SeoImage';
import { blogFeaturedAlt } from '@/lib/image-seo';
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

export type RelatedBlogPostSummary = {
  slug: string;
  title: string;
  excerpt?: string;
  featuredImage?: string;
};

type Props = {
  post: BlogPostArticleData;
  showPreviewBanner?: boolean;
  relatedPosts?: RelatedBlogPostSummary[];
  contextualLinks?: { href: string; label: string }[];
};

export function BlogPostArticle({ post, showPreviewBanner, relatedPosts, contextualLinks }: Props) {
  const safeHtml = prepareBlogBodyForDisplay(post.body);
  const empty = isHtmlEffectivelyEmpty(safeHtml);

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://seniorbydesign.com';
  const pageUrl = `${siteUrl}/blog/${post.slug}`;
  const encodedPageUrl = encodeURIComponent(pageUrl);
  const facebookShareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodedPageUrl}`;
  const linkedInShareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodedPageUrl}`;

  return (
    <article className="blog-post">
      <section className={styles.blogPostHero}>
        <div className={styles.blogPostHeroImage}>
          {post.featuredImage ? (
            <SeoImage
              src={post.featuredImage}
              alt={blogFeaturedAlt(post.title)}
              fill
              className={styles.heroImage}
              priority
              unoptimized={post.featuredImage.startsWith('http')}
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
          <h1 id="blog-article-title" className={styles.blogPostTitle}>
            {post.title}
          </h1>
          {!showPreviewBanner && (
            <div className={styles.shareRow}>
              <span className={styles.shareLabel}>Share</span>
              <a
                href={facebookShareUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.shareLink}
                aria-label="Share on Facebook"
              >
                <svg
                  className={styles.shareIcon}
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    fill="currentColor"
                    d="M24 12.073C24 5.446 18.627 0 12 0S0 5.446 0 12.073c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"
                  />
                </svg>
                Facebook
              </a>
              <a
                href={linkedInShareUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.shareLink}
                aria-label="Share on LinkedIn"
              >
                <svg
                  className={styles.shareIcon}
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    fill="currentColor"
                    d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.07 2.07 0 01-2.063-2.065 2.064 2.064 0 114.127 0 2.07 2.07 0 01-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"
                  />
                </svg>
                LinkedIn
              </a>
            </div>
          )}
        </div>
      </div>

      <div className={`${styles.blogPostContent} reveal-on-scroll`}>
        <div className="container">
          {empty ? (
            <div id="blog-article-body" className={styles.blogPostBody}>
              <p>No content available.</p>
            </div>
          ) : (
            <div
              id="blog-article-body"
              className={styles.blogPostBody}
              dangerouslySetInnerHTML={{ __html: safeHtml }}
            />
          )}
        </div>
      </div>

      {!showPreviewBanner && contextualLinks && contextualLinks.length > 0 && (
        <aside className={styles.relatedSection} aria-label="Related services and portfolio">
          <div className="container">
            <h2 className={styles.relatedHeading}>Explore Related Work</h2>
            <ul className={styles.relatedList}>
              {contextualLinks.map((link) => (
                <li key={link.href} className={styles.relatedItem}>
                  <Link href={link.href} className={styles.relatedLink}>
                    <span className={styles.relatedText}>
                      <span className={styles.relatedTitle}>{link.label}</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </aside>
      )}

      {!showPreviewBanner && <AboutSbdBoilerplate />}

      {!showPreviewBanner && relatedPosts && relatedPosts.length > 0 && (
        <aside className={styles.relatedSection} aria-label="Related articles">
          <div className="container">
            <h2 className={styles.relatedHeading}>More from the Journal</h2>
            <ul className={styles.relatedList}>
              {relatedPosts.map((rp) => (
                <li key={rp.slug} className={styles.relatedItem}>
                  <Link href={`/blog/${encodeURIComponent(rp.slug)}`} className={styles.relatedLink}>
                    {rp.featuredImage ? (
                      <div className={styles.relatedThumb}>
                        <SeoImage
                          src={rp.featuredImage}
                          alt={blogFeaturedAlt(rp.title)}
                          fill
                          sizes="120px"
                          className={styles.relatedThumbImg}
                          unoptimized={rp.featuredImage.startsWith('http')}
                        />
                      </div>
                    ) : null}
                    <span className={styles.relatedText}>
                      <span className={styles.relatedTitle}>{rp.title}</span>
                      {rp.excerpt ? (
                        <span className={styles.relatedExcerpt}>{rp.excerpt}</span>
                      ) : null}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </aside>
      )}
    </article>
  );
}
