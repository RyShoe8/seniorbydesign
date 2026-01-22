import { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import NewsletterCTA from '@/components/NewsletterCTA';
import TestimonialsCarousel from '@/components/TestimonialsCarousel';
import PortfolioCarousel from '@/components/PortfolioCarousel';
import { getHomepageContent, getPortfolioCategories, getPartners } from './actions';
import { generateSEOMetadata } from '@/components/SEO';
import styles from './page.module.css';

export const metadata: Metadata = generateSEOMetadata({
  title: 'Senior By Design - Soul Warming Interiors',
  description: 'From concept to realization we take great pride in designing luxurious, soul-warming interiors distinctly tailored to the unique characteristics of each community we serve.',
  url: '/',
  type: 'website',
});

export const revalidate = 0; // Always fetch fresh data

export default async function Home() {
  const homepageContent = await getHomepageContent();
  const portfolioCategories = await getPortfolioCategories();
  const partners = await getPartners();
  

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
              <Link href="/portfolio" className="btn">Explore Our Portfolio</Link>
            </div>
          </div>
        </div>
      </section>

      {/* Our Portfolio Section */}
      <section id="our-portfolio" className={`${styles.ourWorkSection} section-padding`}>
        <div className="container">
          <h2 className={styles.sectionHeading}>Our Portfolio</h2>
        </div>
        <PortfolioCarousel categories={portfolioCategories.slice(0, 6).map(cat => ({
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
