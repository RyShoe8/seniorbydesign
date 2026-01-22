import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getBlogPost } from '../../actions';
import Image from 'next/image';
import { generateSEOMetadata, JSONLDSchema, ArticleSchema, BreadcrumbSchema } from '@/components/SEO';
import styles from './page.module.css';

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
            <h1>{post.title}</h1>
          </div>
        </section>

        <div className="blog-post-header section-padding">
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
          </div>
        </div>

        <div className="blog-post-content section-padding">
          <div className="container">
            <div className={styles.blogPostBody}>
              {post.body.split('\n\n').map((paragraph, i) => (
                <p key={i}>{paragraph}</p>
              ))}
            </div>
          </div>
        </div>
      </article>
    </>
  );
}

