import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getBlogPost } from '../../actions';
import Image from 'next/image';
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

  return {
    title: `${post.title} - Senior By Design Blog`,
    description: post.excerpt,
  };
}

export default async function BlogPostPage({ params }: Props) {
  const post = await getBlogPost(params.slug);

  if (!post) {
    notFound();
  }

  return (
    <>
      <article className="blog-post">
        <div className="blog-post-header section-padding">
          <div className="container">
            <Link href="/blog" className={styles.backLink}>
              ← Back to Blog
            </Link>
            {post.featuredImage && (
              <div className={styles.blogPostImage}>
                <Image
                  src={post.featuredImage}
                  alt={post.title}
                  width={1200}
                  height={600}
                />
              </div>
            )}
            <h1>{post.title}</h1>
            {post.publishedAt && (
              <p className={styles.blogPostDate}>
                {new Date(post.publishedAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
            )}
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

