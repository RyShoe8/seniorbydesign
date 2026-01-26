import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import NewsletterCTA from '@/components/NewsletterCTA';
import { getService } from '../../actions';
import Image from 'next/image';
import { generateSEOMetadata, JSONLDSchema, ServiceSchema, BreadcrumbSchema } from '@/components/SEO';
import styles from './page.module.css';

type Props = {
  params: { slug: string };
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  // Decode the slug to handle URL-encoded characters like & in FF&E
  const decodedSlug = decodeURIComponent(params.slug);
  const service = await getService(decodedSlug);
  
  if (!service) {
    return {
      title: 'Service Not Found',
    };
  }

  return generateSEOMetadata({
    title: `${service.title} - Senior By Design`,
    description: service.body.substring(0, 160),
    url: `/services/${service.slug}`,
    image: service.heroImage,
    type: 'website',
    keywords: [
      'interior design services',
      service.title.toLowerCase(),
      'senior living design',
      'commercial interior design',
    ],
  });
}

export default async function ServicePage({ params }: Props) {
  // Decode the slug to handle URL-encoded characters like & in FF&E
  const decodedSlug = decodeURIComponent(params.slug);
  const service = await getService(decodedSlug);

  if (!service) {
    notFound();
  }

  return (
    <>
      <JSONLDSchema schema={ServiceSchema({
        name: service.title,
        description: service.body.substring(0, 200),
        url: `/services/${service.slug}`,
        image: service.heroImage,
      })} />
      <JSONLDSchema schema={BreadcrumbSchema([
        { name: 'Home', url: '/' },
        { name: 'Services', url: '/services' },
        { name: service.title, url: `/services/${service.slug}` },
      ])} />
      <section className={styles.serviceHero}>
        <div className={styles.serviceHeroImage}>
          {service.heroImage ? (
            <Image
              src={service.heroImage}
              alt={service.title}
              fill
              className={styles.heroImage}
              priority
            />
          ) : (
            <div className={styles.heroPlaceholder} />
          )}
          <h1>{service.title}</h1>
        </div>
      </section>

      <section className="service-content section-padding">
        <div className="container">
          <div className={styles.serviceBody}>
            {service.body.split('\n\n').map((paragraph, i) => (
              <p key={i}>{paragraph}</p>
            ))}
          </div>

          {service.images && service.images.length > 0 && (
            <div className={styles.serviceGallery}>
              {service.images.map((image, i) => (
                <div key={i} className={styles.galleryItem}>
                  <Image
                    src={image}
                    alt={`${service.title} - Image ${i + 1}`}
                    width={800}
                    height={600}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <NewsletterCTA />
    </>
  );
}

