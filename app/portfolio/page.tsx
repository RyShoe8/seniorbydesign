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
});

export default async function Portfolio() {
  const categories = await getPortfolioCategories();
  const projectsData = await getProjects();
  // Convert MongoDB ObjectId to string for client component
  const projects = projectsData.map(p => ({
    ...p,
    _id: p._id?.toString(),
  }));

  const portfolioTypes = [
    { slug: 'active-adult-55', name: 'Active Adult 55+' },
    { slug: 'senior-living', name: 'Senior Living' },
    { slug: 'remodels', name: 'Remodels' },
    { slug: 'office-remodels', name: 'Office Remodels' },
    { slug: 'memory-support', name: 'Memory Support' },
    { slug: 'model-units', name: 'Model units' },
    { slug: 'multifamily', name: 'Multifamily' },
  ];

  // Map portfolio types to categories, ensuring we use category data when available
  const displayCategories = portfolioTypes.map((type) => {
    const category = categories.find((c) => c.slug === type.slug);
    return {
      ...type,
      category, // Include the full category object
    };
  });

  return (
    <>
      <JSONLDSchema schema={BreadcrumbSchema([
        { name: 'Home', url: '/' },
        { name: 'Portfolio', url: '/portfolio' },
      ])} />
      <section className={styles.portfolioHero}>
        <div className={styles.portfolioHeroImage}>
          <Image
            src="/images/Portfolio/Portfolio Header.webp"
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
            {displayCategories.map((item) => {
              const category = item.category;
              // Handle both old format (string[]) and new format (PortfolioImage[])
              const firstImage = category?.images?.[0];
              const imageUrl = typeof firstImage === 'string' ? firstImage : firstImage?.url;
              const imageAlt = typeof firstImage === 'string' 
                ? item.name 
                : (firstImage?.altText || firstImage?.displayName || item.name);
              
              return (
                <Link
                  key={item.slug}
                  href={`/portfolio/${item.slug}`}
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
                        <h3>{item.name}</h3>
                      </div>
                    </div>
                  ) : (
                    <div className={styles.categoryPlaceholder}>
                      <h3>{item.name}</h3>
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

