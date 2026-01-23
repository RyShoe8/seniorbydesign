import { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import NewsletterCTA from '@/components/NewsletterCTA';
import TestimonialsCarousel from '@/components/TestimonialsCarousel';
import PortfolioCarousel from '@/components/PortfolioCarousel';
import { getHomepageContent, getPortfolioCategories, getPartners } from './actions';
import { generateSEOMetadata, JSONLDSchema, BreadcrumbSchema } from '@/components/SEO';
import styles from './page.module.css';

export const metadata: Metadata = generateSEOMetadata({
  title: 'Senior By Design - Soul Warming Interiors',
  description: 'From concept to realization we take great pride in designing luxurious, soul-warming interiors distinctly tailored to the unique characteristics of each community we serve.',
  url: '/',
  type: 'website',
  keywords: [
    'senior living interior design',
    'commercial interior design',
    'multifamily design',
    'interior design services',
    'senior living communities',
    'FF&E services',
    'space planning',
    'furniture procurement',
  ],
});

export const revalidate = 0; // Always fetch fresh data

export default async function Home() {
  const homepageContent = await getHomepageContent();
  const portfolioCategories = await getPortfolioCategories();
  const partners = await getPartners();
  
  // Define desired order for homepage carousel (Remodels in 2nd position)
  const homepageOrder = [
    'Senior Living',
    'Remodels',
    'Active Adult 55+',
    'Office Remodels',
    'Memory Support',
    'Model units',
    'Multifamily',
  ];

  // Sort categories for homepage carousel
  const sortedPortfolioCategories = [...portfolioCategories].sort((a, b) => {
    const aIndex = homepageOrder.findIndex(name => 
      a.name?.toLowerCase() === name.toLowerCase()
    );
    const bIndex = homepageOrder.findIndex(name => 
      b.name?.toLowerCase() === name.toLowerCase()
    );
    
    // If both are in desired order, sort by their position
    if (aIndex !== -1 && bIndex !== -1) {
      return aIndex - bIndex;
    }
    // If only one is in desired order, it comes first
    if (aIndex !== -1) return -1;
    if (bIndex !== -1) return 1;
    // If neither is in desired order, sort alphabetically
    return (a.name || '').localeCompare(b.name || '');
  });

  return (
    <>
      <JSONLDSchema schema={BreadcrumbSchema([
        { name: 'Home', url: '/' },
      ])} />
      {/* Hero Section */}
      <section className={styles.heroSection}>
        <div className={styles.heroImageContainer}>
          <Image
            src="/images/The Team/The Team Hero.jpg"
            alt="Soul Warming Interiors"
            fill
            className={styles.heroImage}
            priority
            quality={100}
            unoptimized={true}
          />
          <div className={styles.heroOverlay}>
            <div className={styles.heroContent}>
              <h1 className={styles.heroHeadline}>
                Soul Warming Interiors
              </h1>
              <p className={styles.heroSubheadline}>
                From concept to realization we take great pride in designing luxurious, soul-warming interiors distinctly tailored to the unique characteristics of each community we serve.
              </p>
              <Link href="/portfolio" className={styles.heroButton}>Explore Our Portfolio</Link>
            </div>
          </div>
        </div>
      </section>

      {/* Who We Are Section */}
      <section className="who-we-are-section section-padding bg-warm-grey">
        <div className="container">
          <h2 className={styles.sectionHeading}>Who We Are</h2>
          <div className={styles.whoWeAreContent}>
            <p>
              Our team scours markets around the world to hand-select collectible found items, antiques, customized art, and furniture from local craftsmen and multi-national manufacturers that fulfill our stringent senior living requirements. We are not a catalog-inspired design firm. These items are stored in our 35,000 square foot warehouse allowing us to offer these high-quality furnishings at a minimal cost.
            </p>
          </div>
        </div>
      </section>

      {/* Our Portfolio Section */}
      <section id="our-portfolio" className={`${styles.ourWorkSection} section-padding`}>
        <div className="container">
          <h2 className={styles.sectionHeading}>Our Portfolio</h2>
        </div>
        <PortfolioCarousel categories={sortedPortfolioCategories.map(cat => ({
          ...cat,
          _id: cat._id?.toString()
        }))} />
      </section>

      {/* Words From Our Clients Section */}
      {homepageContent?.testimonials && Array.isArray(homepageContent.testimonials) && homepageContent.testimonials.length > 0 && (
        <section className="testimonials-section section-padding bg-warm-grey">
          <div className="container">
            <h2 className={`${styles.sectionHeading} text-center`}>Words From Our Clients</h2>
          </div>
          <TestimonialsCarousel testimonials={homepageContent.testimonials} />
        </section>
      )}

      {/* You're In Good Hands Section */}
      <section className="partners-section section-padding">
        <div className="container">
          <h2 className={`${styles.sectionHeading} text-center`}>You&apos;re In Good Hands</h2>
          {partners && Array.isArray(partners) && partners.length > 0 ? (
            <div className={styles.partnersGrid}>
              {partners.map((partner) => {
                if (!partner || !partner.logo) return null;
                const logoUrl = partner.logo;
                const altText = partner.altText || partner.displayName || partner.name || 'Partner logo';
                
                return (
                  <div key={partner._id?.toString()} className={styles.partnerLogo}>
                    {partner.url ? (
                      <a href={partner.url} target="_blank" rel="noopener noreferrer">
                        <Image
                          src={logoUrl}
                          alt={altText}
                          width={320}
                          height={180}
                          style={{ maxWidth: '320px', maxHeight: '180px', width: 'auto', height: 'auto', objectFit: 'contain' }}
                          unoptimized={logoUrl.startsWith('http')}
                        />
                      </a>
                    ) : (
                      <Image
                        src={logoUrl}
                        alt={altText}
                        width={320}
                        height={180}
                        style={{ maxWidth: '320px', maxHeight: '180px', width: 'auto', height: 'auto', objectFit: 'contain' }}
                        unoptimized={logoUrl.startsWith('http')}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-center" style={{ color: 'var(--warm-grey-3)', padding: 'var(--spacing-lg)' }}>
              No partners added yet. Add partner logos in the admin panel.
            </p>
          )}
        </div>
      </section>

      {/* Newsletter CTA */}
      <NewsletterCTA />
    </>
  );
}
