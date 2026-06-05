import { Metadata } from 'next';
import Link from 'next/link';
import NewsletterCTA from '@/components/NewsletterCTA';
import WarehouseGallery from '@/components/WarehouseGallery';
import FaqSection from '@/components/FaqSection';
import PageSchema from '@/components/PageSchema';
import HubLinksSection from '@/components/HubLinksSection';
import EntityContactBlock from '@/components/EntityContactBlock';
import SeoImage from '@/components/SeoImage';
import { generateSEOMetadata, BreadcrumbSchema, VideoObjectSchema, FAQPageSchema } from '@/components/SEO';
import {
  FIRM_TITLE,
  FIRM_META_DESCRIPTION,
  FIRM_H1,
  FIRM_INTRO,
  FIRM_ENTITY_LEAD,
  FIRM_COMMUNITIES_SENIOR_LIVING,
  FIRM_HUB_SECTION_HEADING,
} from '@/lib/firm-seo';
import { FIRM_HUB_LINKS, communityLabelLink } from '@/lib/internal-links';
import { HOME_FAQ_HEADING } from '@/lib/home-seo';
import { SENIOR_LIVING_FAQS } from '@/lib/schema/faq-content';
import { firmCultureAlt, heroAlt, STATIC_IMAGES } from '@/lib/image-seo';
import styles from './page.module.css';

export const metadata: Metadata = generateSEOMetadata({
  title: FIRM_TITLE,
  description: FIRM_META_DESCRIPTION,
  url: '/senior-living-design-firm',
  type: 'website',
  keywords: [
    'senior living design firm',
    'senior living interior design firm',
    'top senior living interior design firms',
    'boutique interior design firm',
    'senior living interior design agency',
  ],
});

export default function SeniorLivingDesignFirmPage() {
  return (
    <>
      <PageSchema
        schemas={[
          BreadcrumbSchema([
            { name: 'Home', url: '/' },
            { name: 'Senior Living Design Firm', url: '/senior-living-design-firm' },
          ]),
          VideoObjectSchema({
            name: 'Senior By Design Company Overview',
            description:
              'Learn about Senior By Design and our approach to interior design for senior living communities.',
            embedUrl: 'https://www.youtube.com/embed/eRI9GKC_VmA?si=2JRGGP4UxMDYF2ci',
            uploadDate: '2024-01-01',
          }),
          VideoObjectSchema({
            name: 'Senior By Design Warehouse Tour',
            description: 'Take a tour of our 35,000 square foot warehouse design center.',
            embedUrl: 'https://www.youtube.com/embed/au7HLQnwb6I?si=WFrKFX6ek1TodzJl',
            uploadDate: '2024-01-01',
          }),
          FAQPageSchema(SENIOR_LIVING_FAQS),
        ]}
      />

      <section className={styles.firmHero}>
        <div className={styles.firmHeroImage}>
          <SeoImage
            src={STATIC_IMAGES.firmHero}
            alt={heroAlt('firm')}
            fill
            className={styles.heroImage}
            priority
          />
          <h1>{FIRM_H1}</h1>
        </div>
      </section>

      <section className="firm-section section-padding">
        <div className="container">
          <p id="firm-entity-lead" className={styles.entityLead}>
            {FIRM_ENTITY_LEAD}
          </p>
          <p className={styles.introParagraph}>{FIRM_INTRO}</p>
          <EntityContactBlock variant="full" className={styles.entityContact} />
        </div>
      </section>

      <section className="firm-section section-padding bg-warm-grey">
        <div className="container">
          <div className={styles.twoColumn}>
            <div className={styles.columnContent}>
              <h2>Company Culture</h2>
              <p>
                Senior By Design&apos;s team sources collectible found items, antiques, customized art, and furniture from local craftsmen and international manufacturers that meet the firm&apos;s senior living standards. The firm is not catalog-inspired. Inventory is stored in a 35,000-square-foot Dallas warehouse, allowing competitive pricing on high-quality furnishings.
              </p>
              <p>
                Senior By Design designs communities where residents want to live and professionals want to work—reflecting the family-centered values that inform the firm&apos;s work nationwide.
              </p>
              <p>
                Having designed 300 senior living communities and procured over $30,000,000 in acquisitions, Senior By Design has built a niche in management-, owner-, and resident-focused senior living interiors through flexible, collaborative, and responsive project delivery.
              </p>
            </div>
            <div className={styles.columnImage}>
              <SeoImage
                src={STATIC_IMAGES.firmCulture}
                alt={firmCultureAlt()}
                width={600}
                height={400}
                className={styles.cultureImage}
                priority
                sizes="(max-width: 968px) 100vw, 50vw"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="firm-section section-padding bg-warm-grey">
        <div className="container">
          <p className={styles.largeText}>
            Senior By Design incorporates elegant details that fuse the familiar with the unexpected—from renowned local artists to antiques sourced worldwide.
          </p>
        </div>
      </section>

      <section className="firm-video-section section-padding">
        <div className="container">
          <div className={styles.videoWrapper}>
            <iframe
              width="560"
              height="315"
              src="https://www.youtube.com/embed/eRI9GKC_VmA?si=2JRGGP4UxMDYF2ci"
              title="YouTube video player"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              referrerPolicy="strict-origin-when-cross-origin"
              allowFullScreen
              className={styles.videoIframe}
            />
          </div>
        </div>
      </section>

      <section className="firm-section section-padding">
        <div className="container">
          <h2 className={styles.centeredHeading}>Communities We Serve</h2>
          <ul className={styles.communitiesList}>
            {FIRM_COMMUNITIES_SENIOR_LIVING.map((community) => {
              const link = communityLabelLink(community);
              return (
                <li key={community}>
                  {link ? (
                    <Link href={link.href}>{community}</Link>
                  ) : (
                    community
                  )}
                </li>
              );
            })}
          </ul>
          <div className={styles.twoColumnListCentered}>
            <div className={styles.columnList}>
              <h4>Multifamily &amp; Mixed-Use</h4>
              <ul>
                <li>Single Family for Rent</li>
                <li>High-Rise</li>
                <li>Mid-Rise</li>
                <li>Mixed-Use</li>
                <li>Transit-Oriented</li>
                <li>Garden-Style</li>
                <li>Student Housing</li>
                <li>Affordable Housing</li>
                <li>Model Units</li>
                <li>Redevelopment</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="firm-section section-padding bg-warm-grey">
        <div className="container">
          <div className={styles.centeredContent}>
            <h2 className={styles.centeredHeading}>35,000 sq.ft. Design Center</h2>
            <p className={styles.centeredParagraph}>
              Senior By Design works beyond catalog constraints, fostering relationships with international artisans across Europe, Indonesia, Bali, Mexico, and China to incorporate bespoke pieces in senior living interiors. The firm&apos;s 35,000-square-foot Dallas warehouse stores timeless furnishings for ready availability. The turnkey approach delivers individualized design that is intelligent, elegant, and functional. Every piece of furniture is evaluated from the perspective of senior residents for comfort and long-term wearability.
            </p>
            <ul className={styles.featureListCentered}>
              <li>Saves money not using receivers</li>
              <li>Product always arrives on time</li>
              <li>Packaged with staging photography for easy & precise assembly</li>
              <li>Fine furniture at a great price</li>
              <li>Unique world wide assortment of product</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="firm-video-section section-padding">
        <div className="container">
          <div className={styles.videoWrapper}>
            <iframe
              width="560"
              height="315"
              src="https://www.youtube.com/embed/au7HLQnwb6I?si=WFrKFX6ek1TodzJl"
              title="YouTube video player"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              referrerPolicy="strict-origin-when-cross-origin"
              allowFullScreen
              className={styles.videoIframe}
            />
          </div>
        </div>
      </section>

      <section className="firm-gallery section-padding">
        <div className="container">
          <WarehouseGallery />
        </div>
      </section>

      <FaqSection faqs={SENIOR_LIVING_FAQS} heading={HOME_FAQ_HEADING} />

      <HubLinksSection links={FIRM_HUB_LINKS} heading={FIRM_HUB_SECTION_HEADING} />

      <NewsletterCTA />
    </>
  );
}
