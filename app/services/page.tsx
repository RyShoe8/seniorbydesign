import { Metadata } from 'next';
import Link from 'next/link';
import { getServices } from '../actions';
import Image from 'next/image';

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
      <section className="services-hero section-padding">
        <div className="container">
          <h1>Services</h1>
        </div>
      </section>

      <section className="services-content section-padding">
        <div className="container">
          {servicePromotions.map((promo) => {
            const service = services.find((s) => s.slug === promo.slug);
            return (
              <div key={promo.slug} className="service-promo">
                <div className="service-header">
                  <h2>{promo.title}</h2>
                  <p>{promo.description || service?.body}</p>
                </div>

                <div className="service-content-grid">
                  <div className="service-bullets">
                    <div className="bullets-column">
                      <ul>
                        {promo.bullets.left.map((bullet, i) => (
                          <li key={i}>{bullet}</li>
                        ))}
                      </ul>
                    </div>
                    <div className="bullets-column">
                      <ul>
                        {promo.bullets.right.map((bullet, i) => (
                          <li key={i}>{bullet}</li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {promo.images > 0 && (
                    <div className={`service-images images-${promo.images}`}>
                      {Array.from({ length: promo.images }).map((_, i) => (
                        <div key={i} className="service-image-placeholder">
                          Image {i + 1}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="service-cta">
                  <Link href={`/services/${promo.slug}`} className="btn">
                    Learn More
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <style jsx>{`
        .services-hero {
          background: linear-gradient(135deg, var(--warm-grey-1) 0%, var(--warm-grey-3) 100%);
          text-align: center;
        }

        .service-promo {
          margin-bottom: var(--spacing-2xl);
          padding-bottom: var(--spacing-xl);
          border-bottom: 2px solid var(--warm-grey-1);
        }

        .service-promo:last-child {
          border-bottom: none;
        }

        .service-header {
          margin-bottom: var(--spacing-lg);
        }

        .service-header h2 {
          margin-bottom: var(--spacing-sm);
        }

        .service-content-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: var(--spacing-lg);
          margin-bottom: var(--spacing-md);
        }

        .service-bullets {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: var(--spacing-md);
        }

        .bullets-column ul {
          list-style: none;
        }

        .bullets-column li {
          padding: 0.5rem 0;
          padding-left: 1.5rem;
          position: relative;
        }

        .bullets-column li:before {
          content: '•';
          position: absolute;
          left: 0;
          color: var(--sbd-gold);
          font-weight: bold;
        }

        .service-images {
          display: grid;
          gap: var(--spacing-md);
        }

        .images-1 {
          grid-template-columns: 1fr;
        }

        .images-2 {
          grid-template-columns: 1fr 1fr;
        }

        .service-image-placeholder {
          width: 100%;
          height: 300px;
          background: var(--warm-grey-1);
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--warm-grey-3);
          border-radius: 8px;
        }

        .service-cta {
          text-align: center;
        }

        @media (max-width: 768px) {
          .service-bullets {
            grid-template-columns: 1fr;
          }

          .images-2 {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}

