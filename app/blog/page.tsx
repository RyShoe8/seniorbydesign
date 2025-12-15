import { Metadata } from 'next';
import Link from 'next/link';
import { getBlogPosts } from '../actions';
import Image from 'next/image';

export const metadata: Metadata = {
  title: 'Blog - Senior By Design',
  description: 'Latest news and insights from Senior By Design',
};

export default async function Blog() {
  const posts = await getBlogPosts();

  return (
    <>
      <section className="blog-hero section-padding">
        <div className="container">
          <h1>Blog</h1>
        </div>
      </section>

      <section className="blog-content section-padding">
        <div className="container">
          {posts.length > 0 ? (
            <div className="blog-grid">
              {posts.map((post) => (
                <article key={post._id?.toString()} className="blog-card">
                  <Link href={`/blog/${post.slug}`}>
                    {post.featuredImage && (
                      <div className="blog-image">
                        <Image
                          src={post.featuredImage}
                          alt={post.title}
                          width={600}
                          height={400}
                        />
                      </div>
                    )}
                    <div className="blog-content-wrapper">
                      <h2>{post.title}</h2>
                      <p className="blog-excerpt">{post.excerpt}</p>
                      {post.publishedAt && (
                        <p className="blog-date">
                          {new Date(post.publishedAt).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </Link>
                </article>
              ))}
            </div>
          ) : (
            <div className="no-posts">
              <p>No blog posts available yet.</p>
            </div>
          )}
        </div>
      </section>

      <style jsx>{`
        .blog-hero {
          background: linear-gradient(135deg, var(--warm-grey-1) 0%, var(--warm-grey-3) 100%);
          text-align: center;
        }

        .blog-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
          gap: var(--spacing-lg);
        }

        .blog-card {
          background: #fff;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          transition: transform 0.3s ease;
        }

        .blog-card:hover {
          transform: translateY(-5px);
        }

        .blog-image {
          width: 100%;
          height: 250px;
          overflow: hidden;
        }

        .blog-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .blog-content-wrapper {
          padding: var(--spacing-md);
        }

        .blog-content-wrapper h2 {
          margin-bottom: var(--spacing-sm);
        }

        .blog-excerpt {
          color: var(--warm-grey-3);
          margin-bottom: var(--spacing-sm);
        }

        .blog-date {
          font-size: 14px;
          color: var(--sbd-gold);
        }

        .no-posts {
          text-align: center;
          padding: var(--spacing-xl);
          color: var(--warm-grey-3);
        }

        @media (max-width: 768px) {
          .blog-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </>
  );
}

