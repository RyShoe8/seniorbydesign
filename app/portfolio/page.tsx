import { Metadata } from 'next';
import Link from 'next/link';
import { getPortfolioCategories, getProjects } from '../actions';
import PortfolioMap from '@/components/PortfolioMap';
import styles from './page.module.css';

export const metadata: Metadata = {
  title: 'Portfolio - Senior By Design',
  description: 'Explore our portfolio of senior living communities and design projects across the United States.',
};

export default async function Portfolio() {
  const categories = await getPortfolioCategories();
  const projects = await getProjects();

  const portfolioTypes = [
    { slug: 'active-adult-55', name: 'Active Adult 55+' },
    { slug: 'senior-living', name: 'Senior Living' },
    { slug: 'remodels', name: 'Remodels' },
    { slug: 'office-remodels', name: 'Office Remodels' },
    { slug: 'memory-support', name: 'Memory Support' },
    { slug: 'model-units', name: 'Model units' },
    { slug: 'multifamily', name: 'Multifamily' },
  ];

  return (
    <>
      <section className={`${styles.portfolioHero} section-padding`}>
        <div className="container">
          <div className={styles.heroImagePlaceholder}>
            <h1>Our Portfolio</h1>
          </div>
          <p className={styles.heroText}>
            Explore our extensive portfolio of beautifully designed senior living communities and spaces across the United States.
          </p>
        </div>
      </section>

      <section className="portfolio-map-section section-padding bg-warm-grey">
        <div className="container">
          <h2>Project Locations</h2>
          <PortfolioMap projects={projects} />
        </div>
      </section>

      <section className="portfolio-categories section-padding">
        <div className="container">
          <div className={styles.portfolioGrid}>
            {portfolioTypes.map((type) => {
              const category = categories.find((c) => c.slug === type.slug);
              return (
                <Link
                  key={type.slug}
                  href={`/portfolio/${type.slug}`}
                  className={styles.portfolioCategoryCard}
                >
                  {category?.images[0] ? (
                    <div className={styles.categoryImageWrapper}>
                      <img
                        src={category.images[0]}
                        alt={type.name}
                        className={styles.categoryImage}
                      />
                      <div className={styles.categoryOverlay}>
                        <h3>{type.name}</h3>
                      </div>
                    </div>
                  ) : (
                    <div className={styles.categoryPlaceholder}>
                      <h3>{type.name}</h3>
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

