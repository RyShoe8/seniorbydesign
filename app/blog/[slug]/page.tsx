import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getBlogPost } from '../../actions';
import Image from 'next/image';

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
            <Link href="/blog" className="back-link">
              ← Back to Blog
            </Link>
            {post.featuredImage && (
              <div className="blog-post-image">
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
              <p className="blog-post-date">
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
            <div className="blog-post-body">
              {post.body.split('\n\n').map((paragraph, i) => (
                <p key={i}>{paragraph}</p>
              ))}
            </div>
          </div>
        </div>
      </article>

      <style jsx>{`
        .back-link {
          display: inline-block;
          margin-bottom: var(--spacing-md);
          color: var(--sbd-brown);
          font-weight: 500;
        }

        .blog-post-image {
          margin-bottom: var(--spacing-lg);
          border-radius: 8px;
          overflow: hidden;
        }

        .blog-post-image img {
          width: 100%;
          height: auto;
        }

        .blog-post-date {
          color: var(--sbd-gold);
          font-size: 18px;
          margin-bottom: var(--spacing-md);
        }

        .blog-post-body {
          max-width: 800px;
          margin: 0 auto;
        }

        .blog-post-body p {
          margin-bottom: var(--spacing-md);
          font-size: 19px;
          line-height: 1.8;
        }
      `}</style>
    </>
  );
}

