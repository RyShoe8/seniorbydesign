import { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import NewsletterCTA from '@/components/NewsletterCTA';
import RelatedServices from '@/components/RelatedServices';
import SeeOurWork from '@/components/SeeOurWork';
import { getService } from '../../actions';
import SeoImage from '@/components/SeoImage';
import { serviceHeroAlt } from '@/lib/image-seo';
import PageSchema from '@/components/PageSchema';
import { generateSEOMetadata, ServiceSchema, BreadcrumbSchema } from '@/components/SEO';
import { normalizeServiceSlug } from '@/lib/service-slug';
import { metaDescriptionForServiceBody, serviceBodyPlainTextForSchema } from '@/lib/blog-seo';
import { servicePageTitle, servicePageH1, servicePageIntro } from '@/lib/services-seo';
import { serviceGeoLead } from '@/lib/geo-entity';
import {
  portfolioLinksForService,
  relatedServiceLinksForService,
} from '@/lib/internal-links';
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
    title: servicePageTitle(service.title, pathSlug),
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

export const revalidate = 0;

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
  const pageH1 = servicePageH1(service.title, pathSlug);
  const intro = servicePageIntro(pathSlug);
  const geoLead = serviceGeoLead(pathSlug);

  return (
    <>
      <PageSchema
        schemas={[
          ServiceSchema({
            name: pageH1,
            description: schemaDescription,
            url: `/services/${pathSlug}`,
            image: service.heroImage,
          }),
          BreadcrumbSchema([
            { name: 'Home', url: '/' },
            { name: 'Services', url: '/services' },
            { name: pageH1, url: `/services/${pathSlug}` },
          ]),
        ]}
      />
      <section className={styles.serviceHero}>
        <div className={styles.serviceHeroImage}>
          {service.heroImage ? (
            <SeoImage
              src={service.heroImage}
              alt={serviceHeroAlt(pageH1)}
              fill
              className={styles.heroImage}
              priority
            />
          ) : (
            <div className={styles.heroPlaceholder} />
          )}
          <h1>{pageH1}</h1>
        </div>
      </section>

      <section className="service-content section-padding">
        <div className="container">
          <div className={styles.serviceBody}>
            <p id="service-entity-lead" className={styles.serviceGeoLead}>
              {geoLead}
            </p>
            {intro ? <p className={styles.serviceIntro}>{intro}</p> : null}
            {service.body.split('\n\n').map((paragraph, i) => (
              <p key={i}>{paragraph}</p>
            ))}
          </div>

          {service.images && service.images.length > 0 && (
            <div className={styles.serviceGallery}>
              {service.images.map((image, i) => (
                <div key={i} className={styles.galleryItem}>
                  <SeoImage
                    src={image}
                    alt={serviceHeroAlt(`${pageH1} gallery image ${i + 1}`)}
                    width={800}
                    height={600}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <SeeOurWork links={portfolioLinksForService(pathSlug)} />
      <RelatedServices links={relatedServiceLinksForService(pathSlug)} heading="Related Services" />

      <NewsletterCTA />
    </>
  );
}
