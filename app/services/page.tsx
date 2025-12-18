import { Metadata } from 'next';
import Link from 'next/link';
import { getServices } from '../actions';
import Image from 'next/image';
import styles from './page.module.css';

export const metadata: Metadata = {
  title: 'Services - Senior By Design',
  description: 'Commercial interior design experience including working with all aspects of senior living communities, medical facilities, public spaces, offices, restaurants, hotels and churches.',
};

export default async function Services() {
  const services = await getServices();

  const servicePromotions = [
    {
      slug: 'interior-environments-and-design',
      title: 'Interior Environments & Design',
      description: 'We provide commercial interior design experience including working with all aspects of senior living communities, medical facilities from doctors offices to large hospitals, public spaces, offices, restaurants, hotels and churches.',
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
      images: 2,
    },
    {
      slug: 'procurement-and-installation',
      title: 'Procurement & Installation',
      description: 'We offer the best and most cost effective interior design while providing all the memories and features of homes. We believe in thoughtful design that will create a "return on investment."',
      bullets: {
        left: [
          'Inventory Survey',
          'Purchasing Management',
          'Pre-Installation Warehousing',
        ],
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
      title: 'Overall design & DEVELOPMENT',
      description: 'Our design and dedicated procurement teams re-imagine environments to create a better way of living. No two projects are alike. We have designed 175+ senior living communities and procured over $100M in acquisitions.',
      bullets: {
        left: [
          'Project Management',
          'Project Coordination with Owners, Architects, & Contractors',
          'Contract & Construction Administration',
        ],
        right: [
          'Scheduling',
          'Specifications',
          'Budgeting',
          'Quality Control',
        ],
      },
      images: 1,
    },
    {
      slug: 'ff-e-services',
      title: 'FF&E Services',
      description: '',
      bullets: {
        left: [
          'Review of scope of the project with Owner\'s objectives and determine agreed FF&E budget criteria and furniture preferences.',
          'Prepare preliminary furniture layouts for all areas.',
        ],
        right: [
          'Prepare preliminary budget figures for all areas based on the preliminary furniture layout',
          'Upon approval of preliminary furniture layouts and budget, procure and deliver furniture, art, and accessories in preparation for installation.',
        ],
      },
      images: 0,
    },
  ];

  return (
    <div className="services-page">
      <section className={styles.servicesHero}>
        <div className={styles.servicesHeroImage}>
          <Image
            src="/images/Services/Services Header.webp"
            alt="Services"
            fill
            className={styles.heroImage}
            priority
          />
          <h1>Services</h1>
        </div>
      </section>

      <section className="services-content section-padding">
        <div className="container">
          {servicePromotions.map((promo) => {
            const service = services.find((s) => s.slug === promo.slug);
            return (
              <div key={promo.slug} className={styles.servicePromo}>
                <div className={styles.serviceHeader}>
                  <h2>{promo.title}</h2>
                  <p>{promo.description || service?.body}</p>
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

                  {promo.images > 0 && (
                    <div className={promo.images === 1 ? styles.images1 : styles.images2}>
                      {Array.from({ length: promo.images }).map((_, i) => (
                        <div key={i} className={styles.serviceImagePlaceholder}>
                          Image {i + 1}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className={styles.serviceCta}>
                  <Link href={`/services/${promo.slug}`} className="btn">
                    Learn More
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}

