import { Metadata } from 'next';
import Link from 'next/link';
import { getServices } from '../actions';
import NewsletterCTA from '@/components/NewsletterCTA';
import PageSchema from '@/components/PageSchema';
import SeoImage from '@/components/SeoImage';
import { generateSEOMetadata, BreadcrumbSchema, IndexItemListSchema } from '@/components/SEO';
import { normalizeServiceSlug } from '@/lib/service-slug';
import {
  SERVICES_INDEX_H1,
  SERVICES_INDEX_TITLE,
  SERVICES_INDEX_META,
  SERVICES_INDEX_INTRO,
  SERVICE_PROMOTION_COPY,
  SERVICES_WHO_WE_DESIGN_FOR,
} from '@/lib/services-seo';
import { communityLabelLink } from '@/lib/internal-links';
import { heroAlt, STATIC_IMAGES, serviceHeroAlt } from '@/lib/image-seo';
import styles from './page.module.css';

export const metadata: Metadata = generateSEOMetadata({
  title: SERVICES_INDEX_TITLE,
  description: SERVICES_INDEX_META,
  url: '/services',
  type: 'website',
  keywords: [
    'senior living interior design services',
    'assisted living interior design',
    'independent living interior design',
    'senior living commercial design',
    'FF&E services',
  ],
});

export const revalidate = 0;

function promotionDescription(slug: string, fallback: string): string {
  const copy = SERVICE_PROMOTION_COPY.find(
    (p) => normalizeServiceSlug(p.slug) === normalizeServiceSlug(slug)
  );
  return copy?.description ?? fallback;
}

export default async function Services() {
  const services = await getServices();

  const servicePromotions = [
    {
      slug: 'interior-environments-and-design',
      title: 'Interior Environments & Design',
      description:
        'We provide commercial interior design experience including working with all aspects of senior living communities, medical facilities from doctors offices to large hospitals, public spaces, offices, restaurants, hotels and churches.',
      bullets: {
        left: [
          'Surveying & Space Assessment',
          'Interior Programming',
          'Renovation & FF&E Budgeting',
          'Construction Supervision',
          'Casework Design',
          'Material Finish Selection',
          'Palette Specification',
        ],
        right: [
          'Space Planning',
          'Drawing Documentation',
          'Furniture Selection & Specification',
          'Interior Detailing',
          'Signage Design',
          'Branding Integration',
          'Equipment Coordination',
        ],
      },
      images: 1,
    },
    {
      slug: 'procurement-and-installation',
      title: 'Procurement & Installation',
      description:
        'We offer the best and most cost effective interior design while providing all the memories and features of homes. We believe in thoughtful design that will create a "return on investment."',
      bullets: {
        left: ['Inventory Survey', 'Purchasing Management', 'Pre-Installation Warehousing'],
        right: [
          'Installation',
          'Art-work Selection, Purchase, and Installation',
          'Accessory Selection, Purchase, and Installation',
        ],
      },
      images: 1,
    },
    {
      slug: 'overall-design-and-development',
      title: 'Overall Design & Development',
      description:
        'Our design and dedicated procurement teams re-imagine environments to create a better way of living. No two projects are alike. We have designed 175+ senior living communities and procured over $100M in acquisitions.',
      bullets: {
        left: [
          'Project Management',
          'Project Coordination with Owners, Architects, & Contractors',
          'Contract & Construction Administration',
        ],
        right: ['Scheduling', 'Specifications', 'Budgeting', 'Quality Control'],
      },
      images: 1,
    },
    {
      slug: 'ffe-services',
      title: 'FF&E Services',
      description:
        'At Senior by Design, FF&E is far more than sourcing furniture it is a highly curated, hands-on process rooted in performance, comfort, and design integrity.',
      bullets: {
        left: [
          "Review of scope of the project with Owner's objectives and determine agreed FF&E budget criteria and furniture preferences.",
          'Prepare preliminary furniture layouts for all areas.',
        ],
        right: [
          'Prepare preliminary budget figures for all areas based on the preliminary furniture layout',
          'Upon approval of preliminary furniture layouts and budget, procure and deliver furniture, art, and accessories in preparation for installation.',
        ],
      },
      images: 1,
    },
  ];

  const itemListEntries = services
    .filter((s) => s.slug && s.title)
    .map((s) => ({
      name: s.title,
      urlPath: `/services/${normalizeServiceSlug(s.slug)}`,
    }));

  return (
    <>
      <PageSchema
        schemas={[
          BreadcrumbSchema([
            { name: 'Home', url: '/' },
            { name: 'Services', url: '/services' },
          ]),
          ...(itemListEntries.length > 0
            ? [
                IndexItemListSchema({
                  name: 'Senior By Design services',
                  description:
                    'Interior design and delivery services for senior living and multifamily.',
                  items: itemListEntries,
                }),
              ]
            : []),
        ]}
      />
      <div className="services-page">
        <section className={styles.servicesHero}>
          <div className={styles.servicesHeroImage}>
            <SeoImage
              src={STATIC_IMAGES.servicesHero}
              alt={heroAlt('services-index')}
              fill
              className={styles.heroImage}
              priority
            />
            <h1>{SERVICES_INDEX_H1}</h1>
          </div>
        </section>

        <section className="services-intro section-padding bg-warm-grey">
          <div className="container">
            <p className={styles.servicesIntro}>{SERVICES_INDEX_INTRO}</p>
          </div>
        </section>

        <section className="services-content section-padding">
          <div className="container">
            {servicePromotions.map((promo) => {
              const service = services.find(
                (s) => s.slug && normalizeServiceSlug(s.slug) === normalizeServiceSlug(promo.slug)
              );

              const displaySlug = normalizeServiceSlug(service?.slug || promo.slug);
              const description = promotionDescription(displaySlug, promo.description);

              return (
                <div key={displaySlug} className={styles.servicePromo}>
                  <div className={styles.serviceHeader}>
                    <h2>{promo.title}</h2>
                    <p>{description}</p>
                  </div>

                  <div className={styles.serviceContentGrid}>
                    <div className={styles.serviceBullets}>
                      <div className={styles.bulletsColumn}>
                        <ul>
                          {promo.bullets.left.map((bullet, i) => (
                            <li key={i}>{bullet}</li>
                          ))}
                        </ul>
                      </div>
                      <div className={styles.bulletsColumn}>
                        <ul>
                          {promo.bullets.right.map((bullet, i) => (
                            <li key={i}>{bullet}</li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    {promo.images > 0 &&
                      service?.heroImage &&
                      typeof service.heroImage === 'string' &&
                      service.heroImage.trim().length > 0 && (
                        <div className={styles.images1}>
                          <div className={styles.serviceImage}>
                            <SeoImage
                              src={service.heroImage}
                              alt={serviceHeroAlt(service.title || promo.title)}
                              width={800}
                              height={600}
                              className={styles.serviceImageImg}
                            />
                          </div>
                        </div>
                      )}
                  </div>

                  <div className={styles.serviceCta}>
                    <Link href={`/services/${encodeURIComponent(displaySlug)}`} className="btn">
                      Learn More
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className={`${styles.whoWeDesignFor} section-padding bg-warm-grey`}>
          <div className="container">
            <h2 className={styles.whoWeDesignForHeading}>Who We Design For</h2>
            <ul className={styles.whoWeDesignForList}>
              {SERVICES_WHO_WE_DESIGN_FOR.map((item) => {
                const link = communityLabelLink(item);
                return (
                  <li key={item}>
                    {link ? <Link href={link.href}>{item}</Link> : item}
                  </li>
                );
              })}
            </ul>
          </div>
        </section>
      </div>
      <NewsletterCTA />
    </>
  );
}
