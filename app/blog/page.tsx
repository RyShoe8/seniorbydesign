import { Metadata } from 'next';
import Link from 'next/link';
import { getBlogPosts } from '../actions';
import NewsletterCTA from '@/components/NewsletterCTA';
import PageSchema from '@/components/PageSchema';
import SeoImage from '@/components/SeoImage';
import { generateSEOMetadata, BreadcrumbSchema, IndexItemListSchema } from '@/components/SEO';
import { BLOG_INDEX_TITLE, BLOG_INDEX_META, BLOG_INDEX_SUBTITLE, BLOG_INDEX_INTRO } from '@/lib/team-seo';
import { blogFeaturedAlt, heroAlt, STATIC_IMAGES } from '@/lib/image-seo';
import styles from './page.module.css';

export const metadata: Metadata = generateSEOMetadata({
  title: BLOG_INDEX_TITLE,
  description: BLOG_INDEX_META,
  url: '/blog',
  type: 'website',
  keywords: [
    'senior living design journal',
    'senior living interior design trends',
    'FF&E insights',
    'design principles',
  ],
});

export const revalidate = 0;

export default async function Blog() {
  const posts = await getBlogPosts();

  const itemListEntries = posts
    .filter((p) => p.slug && p.title)
    .map((p) => ({
      name: p.title,
      urlPath: `/blog/${encodeURIComponent(p.slug)}`,
    }));

  return (
    <>
      <PageSchema
        schemas={[
          BreadcrumbSchema([
            { name: 'Home', url: '/' },
            { name: 'Blog', url: '/blog' },
          ]),
          ...(itemListEntries.length > 0
            ? [
                IndexItemListSchema({
                  name: 'The Principled Design Journal',
                  description:
                    'Articles on interior design, senior living, and commercial design from Senior By Design.',
                  items: itemListEntries,
                }),
              ]
            : []),
        ]}
      />
      <section className={styles.blogHero}>
        <div className={styles.blogHeroImage}>
          <SeoImage
            src={STATIC_IMAGES.blogHero}
            alt={heroAlt('blog-index')}
            fill
            className={styles.heroImage}
            priority
            unoptimized
          />
          <h1>The Principled Design Journal</h1>
        </div>
      </section>

      <section className="blog-subtitle section-padding">
        <div className="container">
          <h2 className={styles.blogSubtitle}>{BLOG_INDEX_SUBTITLE}</h2>
          <p className={styles.blogIntro}>{BLOG_INDEX_INTRO}</p>
        </div>
      </section>

      <section className="blog-content section-padding">
        <div className="container">
          {posts.length > 0 ? (
            <div className={styles.blogGrid}>
              {posts.map((post) => (
                <article key={post._id?.toString()} className={styles.blogCard}>
                  <Link href={`/blog/${post.slug}`}>
                    {post.featuredImage && (
                      <div className={styles.blogImage}>
                        <SeoImage
                          src={post.featuredImage}
                          alt={blogFeaturedAlt(post.title)}
                          fill
                          style={{ objectFit: 'cover' }}
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 400px"
                          unoptimized={post.featuredImage.startsWith('http')}
                        />
                      </div>
                    )}
                    <div className={styles.blogContentWrapper}>
                      <h2>{post.title}</h2>
                      <p className={styles.blogExcerpt}>{post.excerpt}</p>
                      {post.publishedAt && (
                        <p className={styles.blogDate}>
                          {new Date(post.publishedAt).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </Link>
                </article>
              ))}
            </div>
          ) : (
            <div className={styles.noPosts}>
              <p>No blog posts available yet.</p>
            </div>
          )}
        </div>
      </section>

      <NewsletterCTA />
    </>
  );
}
