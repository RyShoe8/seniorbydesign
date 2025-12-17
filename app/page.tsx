import { Metadata } from 'next';
import NewsletterCTA from '@/components/NewsletterCTA';
import TestimonialsCarousel from '@/components/TestimonialsCarousel';
import { getHomepageContent, getPortfolioCategories, getPartners } from './actions';
import Image from 'next/image';
import styles from './page.module.css';

export const metadata: Metadata = {
  title: 'Senior By Design - Soul Warming Interiors',
  description: 'From concept to realization we take great pride in designing luxurious, soul-warming interiors distinctly tailored to the unique characteristics of each community we serve.',
};

export const revalidate = 0; // Always fetch fresh data

export default async function Home() {
  const homepageContent = await getHomepageContent();
  const portfolioCategories = await getPortfolioCategories();
  const partners = await getPartners();
  
  // Debug logging
  console.log('Homepage partners count:', partners?.length || 0);
  if (partners && partners.length > 0) {
    console.log('First partner:', partners[0]);
  }

  return (
    <>
      {/* Hero Section */}
      <section className={styles.heroSection}>
        <div className={styles.heroVideoContainer}>
          <video
            autoPlay
            loop
            muted
            playsInline
            className={styles.heroVideo}
          >
            <source src="/videos/hero-video.mp4" type="video/mp4" />
          </video>
          <div className={styles.heroOverlay}>
            <div className={styles.heroContent}>
              <h1 className={styles.heroHeadline}>
                Soul Warming Interiors
              </h1>
              <p className={styles.heroSubheadline}>
                From concept to realization we take great pride in designing luxurious, soul-warming interiors distinctly tailored to the unique characteristics of each community we serve.
              </p>
              <a href="#our-work" className="btn">Explore Our Work</a>
            </div>
          </div>
        </div>
      </section>

      {/* Our Work Section */}
      <section id="our-work" className={`${styles.ourWorkSection} section-padding`}>
        <div className="container">
          <h2 className={styles.sectionHeading}>Our Work</h2>
          <div className={styles.portfolioCarousel}>
            {portfolioCategories.slice(0, 6).map((category) => (
              <div key={category._id?.toString()} className={styles.portfolioCard}>
                {category.images[0] && (
                  <Image
                    src={category.images[0]}
                    alt={category.name}
                    width={400}
                    height={300}
                    className={styles.portfolioImage}
                  />
                )}
                <h3>{category.name}</h3>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Words From Our Clients Section */}
      {homepageContent?.testimonials && Array.isArray(homepageContent.testimonials) && homepageContent.testimonials.length > 0 && (
        <section className="testimonials-section section-padding bg-warm-grey">
          <div className="container">
            <h2 className={`${styles.sectionHeading} text-center`}>Words From Our Clients</h2>
            <TestimonialsCarousel testimonials={homepageContent.testimonials} />
          </div>
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
                          width={150}
                          height={100}
                          unoptimized={logoUrl.startsWith('http')}
                        />
                      </a>
                    ) : (
                      <Image
                        src={logoUrl}
                        alt={altText}
                        width={150}
                        height={100}
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
