import { Metadata } from 'next';
import SeoImage from '@/components/SeoImage';
import Link from 'next/link';
import NewsletterCTA from '@/components/NewsletterCTA';
import TestimonialsCarousel from '@/components/TestimonialsCarousel';
import PortfolioCarousel from '@/components/PortfolioCarousel';
import PartnersTabs from '@/components/PartnersTabs';
import FaqSection from '@/components/FaqSection';
import PageSchema from '@/components/PageSchema';
import HubLinksSection from '@/components/HubLinksSection';
import { getHomepageContent, getPortfolioCategories, getPartners } from './actions';
import { generateSEOMetadata, BreadcrumbSchema, FAQPageSchema } from '@/components/SEO';
import { SENIOR_LIVING_FAQS } from '@/lib/schema/faq-content';
import {
  HOME_TITLE,
  HOME_META_DESCRIPTION,
  HOME_H1,
  HOME_HERO_INTRO,
  HOME_WHO_WE_ARE,
  HOME_WHAT_MAKES_DIFFERENT,
  HOME_FAQ_HEADING,
  HOME_SERVICE_TEASERS,
  HOME_HUB_SECTION_HEADING,
} from '@/lib/home-seo';
import { HUB_LINKS } from '@/lib/internal-links';
import { heroAlt, STATIC_IMAGES } from '@/lib/image-seo';
import styles from './page.module.css';

export const metadata: Metadata = generateSEOMetadata({
  title: HOME_TITLE,
  description: HOME_META_DESCRIPTION,
  url: '/',
  type: 'website',
  keywords: [
    'senior living interior design',
    'senior living design firm',
    'FF&E services',
    'independent living',
    'assisted living',
    'memory care',
    'boutique interior design firm',
  ],
});

export const revalidate = 0;

export default async function Home() {
  const homepageContent = await getHomepageContent();
  const portfolioCategories = await getPortfolioCategories();
  const partners = await getPartners();

  return (
    <>
      <PageSchema
        schemas={[
          BreadcrumbSchema([{ name: 'Home', url: '/' }]),
          FAQPageSchema(SENIOR_LIVING_FAQS),
        ]}
      />
      <section className={styles.heroSection}>
        <div className={styles.heroImageContainer}>
          <SeoImage
            src={STATIC_IMAGES.teamHero}
            alt={heroAlt('home')}
            fill
            className={styles.heroImage}
            priority
            quality={100}
            unoptimized={true}
          />
          <div className={styles.heroOverlay}>
            <div className={styles.heroContent}>
              <h1 className={styles.heroHeadline}>{HOME_H1}</h1>
              <p className={styles.heroSubheadline}>{HOME_HERO_INTRO}</p>
              <Link href="/portfolio" className={styles.heroButton}>
                Explore Our Portfolio
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="who-we-are-section section-padding bg-warm-grey reveal-on-scroll">
        <div className="container">
          <h2 className={styles.sectionHeading}>Who We Are</h2>
          <div className={styles.whoWeAreContent}>
            <p>{HOME_WHO_WE_ARE}</p>
          </div>
        </div>
      </section>

      <section className={`${styles.servicesTeaserSection} section-padding reveal-on-scroll`}>
        <div className="container">
          <h2 className={styles.sectionHeading}>Our Senior Living Design Services</h2>
          <div className={styles.servicesTeaserGrid}>
            {HOME_SERVICE_TEASERS.map((service) => (
              <Link
                key={service.slug}
                href={`/services/${service.slug}`}
                className={styles.serviceTeaserCard}
              >
                <h3 className={styles.serviceTeaserTitle}>{service.title}</h3>
                <p className={styles.serviceTeaserDescription}>{service.description}</p>
                <span className={styles.serviceTeaserLink}>Learn more</span>
              </Link>
            ))}
          </div>
          <div className={styles.servicesTeaserCta}>
            <Link href="/services" className="btn">
              View All Services
            </Link>
          </div>
        </div>
      </section>

      <section id="our-portfolio" className={`${styles.ourWorkSection} section-padding reveal-on-scroll`}>
        <div className="container">
          <h2 className={styles.sectionHeading}>Senior Living Portfolio</h2>
        </div>
        <PortfolioCarousel
          categories={portfolioCategories.map((cat) => ({
            ...cat,
            _id: cat._id?.toString(),
          }))}
        />
        <div className={`container ${styles.portfolioCta}`}>
          <Link href="/portfolio" className="btn">
            View All Portfolio
          </Link>
        </div>
      </section>

      <HubLinksSection links={HUB_LINKS} heading={HOME_HUB_SECTION_HEADING} />

      <section className="section-padding reveal-on-scroll">
        <div className="container">
          <h2 className={styles.sectionHeading}>What Makes SBD Different</h2>
          <div className={styles.whoWeAreContent}>
            <p>{HOME_WHAT_MAKES_DIFFERENT}</p>
          </div>
        </div>
      </section>

      {homepageContent?.testimonials &&
        Array.isArray(homepageContent.testimonials) &&
        homepageContent.testimonials.length > 0 && (
          <section className="testimonials-section section-padding bg-warm-grey">
            <div className="container">
              <h2 className={`${styles.sectionHeading} text-center`}>Words From Our Clients</h2>
            </div>
            <TestimonialsCarousel testimonials={homepageContent.testimonials} />
          </section>
        )}

      <section className="partners-section section-padding">
        <div className="container">
          <h2 className={`${styles.sectionHeading} text-center`}>You&apos;re In Good Hands</h2>
          {partners && Array.isArray(partners) && partners.length > 0 ? (
            <PartnersTabs
              partners={partners.map((partner) => ({
                ...partner,
                _id: partner._id?.toString(),
              }))}
            />
          ) : (
            <p
              className="text-center"
              style={{ color: 'var(--warm-grey-3)', padding: 'var(--spacing-lg)' }}
            >
              No partners added yet. Add partner logos in the admin panel.
            </p>
          )}
        </div>
      </section>

      <FaqSection faqs={SENIOR_LIVING_FAQS} heading={HOME_FAQ_HEADING} />

      <NewsletterCTA />
    </>
  );
}
