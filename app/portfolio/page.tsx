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

  // Debug: Log all categories to see what's in the database
  console.log('All portfolio categories:', categories.map(c => ({ slug: c.slug, name: c.name, hasImages: !!c.images?.length })));

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
  // First, try exact slug match, then try case-insensitive match, then try name match
  const displayCategories = portfolioTypes.map((type) => {
    let category = categories.find((c) => c.slug === type.slug);
    
    // If no exact match, try case-insensitive slug match
    if (!category) {
      category = categories.find((c) => c.slug?.toLowerCase() === type.slug.toLowerCase());
    }
    
    // If still no match, try matching by name (case-insensitive)
    if (!category) {
      category = categories.find((c) => c.name?.toLowerCase() === type.name.toLowerCase());
    }
    
    // Debug: Log if category not found
    if (!category) {
      console.log(`Category not found for: ${type.slug} (${type.name})`);
    } else {
      console.log(`Found category: ${category.slug} (${category.name}), has images: ${!!category.images?.length}`);
    }
    
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
            {displayCategories.map((item) => {
              const category = item.category;
              // Use the category's slug if available, otherwise fall back to the hardcoded slug
              const linkSlug = category?.slug || item.slug;
              // Use the category's name if available, otherwise fall back to the hardcoded name
              const displayName = category?.name || item.name;
              
              // Handle both old format (string[]) and new format (PortfolioImage[])
              const firstImage = category?.images?.[0];
              const imageUrl = typeof firstImage === 'string' ? firstImage : firstImage?.url;
              const imageAlt = typeof firstImage === 'string' 
                ? displayName 
                : (firstImage?.altText || firstImage?.displayName || displayName);
              
              return (
                <Link
                  key={item.slug}
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

