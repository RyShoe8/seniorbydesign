import { Metadata } from 'next';
import Link from 'next/link';
import { getBlogPosts } from '../actions';
import Image from 'next/image';
import { generateSEOMetadata, JSONLDSchema, BreadcrumbSchema } from '@/components/SEO';
import styles from './page.module.css';

export const metadata: Metadata = generateSEOMetadata({
  title: 'Blog - Senior By Design',
  description: 'Latest news and insights from Senior By Design about interior design, senior living communities, and design trends.',
  url: '/blog',
  type: 'website',
});

export default async function Blog() {
  const posts = await getBlogPosts();

  return (
    <>
      <JSONLDSchema schema={BreadcrumbSchema([
        { name: 'Home', url: '/' },
        { name: 'Blog', url: '/blog' },
      ])} />
      <section className={styles.blogHero}>
        <div className={styles.blogHeroImage}>
          <Image
            src="/images/Blog/Blog Header.webp"
            alt="Blog"
            fill
            className={styles.heroImage}
            priority
          />
          <h1>Blog</h1>
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
                        <Image
                          src={post.featuredImage}
                          alt={post.title}
                          width={600}
                          height={400}
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
    </>
  );
}

