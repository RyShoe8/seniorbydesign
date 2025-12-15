import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import NewsletterCTA from '@/components/NewsletterCTA';
import { getService } from '../../actions';
import Image from 'next/image';

type Props = {
  params: { slug: string };
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const service = await getService(params.slug);
  
  if (!service) {
    return {
      title: 'Service Not Found',
    };
  }

  return {
    title: `${service.title} - Senior By Design`,
    description: service.body.substring(0, 160),
  };
}

export default async function ServicePage({ params }: Props) {
  const service = await getService(params.slug);

  if (!service) {
    notFound();
  }

  return (
    <>
      <section className="service-hero section-padding">
        <div className="container">
          {service.heroImage && (
            <div className="service-hero-image">
              <Image
                src={service.heroImage}
                alt={service.title}
                width={1200}
                height={400}
                className="hero-img"
              />
            </div>
          )}
          <h1>{service.title}</h1>
        </div>
      </section>

      <section className="service-content section-padding">
        <div className="container">
          <div className="service-body">
            {service.body.split('\n\n').map((paragraph, i) => (
              <p key={i}>{paragraph}</p>
            ))}
          </div>

          {service.images && service.images.length > 0 && (
            <div className="service-gallery">
              {service.images.map((image, i) => (
                <div key={i} className="gallery-item">
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

      <style jsx>{`
        .service-hero {
          background: var(--warm-grey-1);
        }

        .service-hero-image {
          margin-bottom: var(--spacing-md);
          border-radius: 8px;
          overflow: hidden;
        }

        .hero-img {
          width: 100%;
          height: auto;
        }

        .service-body {
          max-width: 800px;
          margin: 0 auto var(--spacing-xl);
        }

        .service-body p {
          margin-bottom: var(--spacing-md);
          font-size: 19px;
          line-height: 1.8;
        }

        .service-gallery {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: var(--spacing-md);
        }

        .gallery-item {
          border-radius: 8px;
          overflow: hidden;
        }

        .gallery-item img {
          width: 100%;
          height: auto;
        }
      `}</style>
    </>
  );
}

