import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { getPortfolioCategories, getProjects } from '../actions';
import PortfolioMap from '@/components/PortfolioMap';
import { generateSEOMetadata, JSONLDSchema, BreadcrumbSchema } from '@/components/SEO';
import styles from './page.module.css';

export const metadata: Metadata = generateSEOMetadata({
  title: 'Portfolio - Senior By Design',
  description: 'Explore our portfolio of senior living communities and design projects across the United States.',
  url: '/portfolio',
  type: 'website',
  keywords: [
    'senior living portfolio',
    'interior design portfolio',
    'senior living communities',
    'multifamily design portfolio',
    'commercial design projects',
  ],
});

export const revalidate = 0; // Always fetch fresh data

export default async function Portfolio() {
  const categories = await getPortfolioCategories();
  const projectsData = await getProjects();
  // Convert MongoDB ObjectId to string for client component
  const projects = projectsData.map(p => ({
    ...p,
    _id: p._id?.toString(),
  }));

  // Categories are now sorted by order field in database via getPortfolioCategories()

  return (
    <>
      <JSONLDSchema schema={BreadcrumbSchema([
        { name: 'Home', url: '/' },
        { name: 'Portfolio', url: '/portfolio' },
      ])} />
      <section className={styles.portfolioHero}>
        <div className={styles.portfolioHeroImage}>
          <Image
            src="/images/Portfolio/portfolio hero.jpg"
            alt="Our Portfolio"
            fill
            className={styles.heroImage}
            priority
          />
          <h1>Our Portfolio</h1>
        </div>
      </section>

      <section className="portfolio-map-section section-padding bg-warm-grey">
        <div className="container">
          <h2>Project Locations</h2>
          <PortfolioMap projects={projects.map(p => ({ ...p, _id: p._id?.toString() }))} />
        </div>
      </section>

      <section className="portfolio-categories section-padding">
        <div className="container">
          <div className={styles.portfolioGrid}>
            {categories.map((category) => {
              const displayName = category.name || '';
              const linkSlug = category.slug || '';
              
              // Handle both old format (string[]) and new format (PortfolioImage[])
              const firstImage = category.images?.[0];
              const imageUrl = typeof firstImage === 'string' ? firstImage : firstImage?.url;
              const imageAlt = typeof firstImage === 'string' 
                ? displayName 
                : (firstImage?.altText || firstImage?.displayName || displayName);
              
              return (
                <Link
                  key={category._id?.toString() || category.slug || displayName}
                  href={`/portfolio/${linkSlug}`}
                  className={styles.portfolioCategoryCard}
                >
                  {imageUrl ? (
                    <div className={styles.categoryImageWrapper}>
                      <Image
                        src={imageUrl}
                        alt={imageAlt}
                        fill
                        className={styles.categoryImage}
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 400px"
                        unoptimized={imageUrl.startsWith('http')}
                      />
                      <div className={styles.categoryOverlay}>
                        <h3>{displayName}</h3>
                      </div>
                    </div>
                  ) : (
                    <div className={styles.categoryPlaceholder}>
                      <h3>{displayName}</h3>
                    </div>
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      </section>
    </>
  );
}

