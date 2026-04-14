import { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import NewsletterCTA from '@/components/NewsletterCTA';
import { getService } from '../../actions';
import Image from 'next/image';
import { generateSEOMetadata, JSONLDSchema, ServiceSchema, BreadcrumbSchema } from '@/components/SEO';
import { normalizeServiceSlug } from '@/lib/service-slug';
import { metaDescriptionForServiceBody, serviceBodyPlainTextForSchema } from '@/lib/blog-seo';
import styles from './page.module.css';

type Props = {
  params: { slug: string };
};

function canonicalPathSlug(serviceSlug: string) {
  return normalizeServiceSlug(serviceSlug);
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const decodedSlug = decodeURIComponent(params.slug);
  const service = await getService(decodedSlug);

  if (!service) {
    return {
      title: 'Service Not Found',
    };
  }

  const pathSlug = canonicalPathSlug(service.slug);

  return generateSEOMetadata({
    title: `${service.title} - Senior By Design`,
    description: metaDescriptionForServiceBody(service.body),
    url: `/services/${pathSlug}`,
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

export const revalidate = 0; // Always fetch fresh data

export default async function ServicePage({ params }: Props) {
  const decodedSlug = decodeURIComponent(params.slug);
  const service = await getService(decodedSlug);

  if (!service) {
    notFound();
  }

  const pathSlug = canonicalPathSlug(service.slug);
  if (decodedSlug !== pathSlug) {
    redirect(`/services/${encodeURIComponent(pathSlug)}`);
  }

  const schemaDescription = serviceBodyPlainTextForSchema(service.body, 800);

  return (
    <>
      <JSONLDSchema
        schema={ServiceSchema({
          name: service.title,
          description: schemaDescription,
          url: `/services/${pathSlug}`,
          image: service.heroImage,
        })}
      />
      <JSONLDSchema
        schema={BreadcrumbSchema([
          { name: 'Home', url: '/' },
          { name: 'Services', url: '/services' },
          { name: service.title, url: `/services/${pathSlug}` },
        ])}
      />
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
                  <Image src={image} alt={`${service.title} - Image ${i + 1}`} width={800} height={600} />
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
