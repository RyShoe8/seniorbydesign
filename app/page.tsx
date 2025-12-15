import { Metadata } from 'next';
import NewsletterCTA from '@/components/NewsletterCTA';
import { getHomepageContent, getPortfolioCategories, getPartners } from './actions';
import Image from 'next/image';

export const metadata: Metadata = {
  title: 'Senior By Design - Soul Warming Interiors',
  description: 'From concept to realization we take great pride in designing luxurious, soul-warming interiors distinctly tailored to the unique characteristics of each community we serve.',
};

export default async function Home() {
  const homepageContent = await getHomepageContent();
  const portfolioCategories = await getPortfolioCategories();
  const partners = await getPartners();

  return (
    <>
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-video-container">
          {homepageContent?.heroVideo ? (
            <video
              autoPlay
              loop
              muted
              playsInline
              className="hero-video"
            >
              <source src={homepageContent.heroVideo} type="video/mp4" />
            </video>
          ) : (
            <div className="hero-placeholder" />
          )}
          <div className="hero-overlay">
            <div className="hero-content">
              <h1 className="hero-headline">
                {homepageContent?.heroHeadline || 'Soul Warming Interiors'}
              </h1>
              <p className="hero-subheadline">
                {homepageContent?.heroSubheadline || 
                  'From concept to realization we take great pride in designing luxurious, soul-warming interiors distinctly tailored to the unique characteristics of each community we serve.'}
              </p>
              <a href="#our-work" className="btn">Explore Our Work</a>
            </div>
          </div>
        </div>
      </section>

      {/* Our Work Section */}
      <section id="our-work" className="our-work-section section-padding">
        <div className="container">
          <h2 className="section-heading">Our Work</h2>
          <div className="portfolio-carousel">
            {portfolioCategories.slice(0, 6).map((category) => (
              <div key={category._id?.toString()} className="portfolio-card">
                {category.images[0] && (
                  <Image
                    src={category.images[0]}
                    alt={category.name}
                    width={400}
                    height={300}
                    className="portfolio-image"
                  />
                )}
                <h3>{category.name}</h3>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      {homepageContent?.testimonials && homepageContent.testimonials.length > 0 && (
        <section className="testimonials-section section-padding bg-warm-grey">
          <div className="container">
            <h2 className="section-heading text-center">Words from our clients</h2>
            <div className="testimonials-grid">
              {homepageContent.testimonials.map((testimonial, index) => (
                <div key={index} className="testimonial-card">
                  <p className="testimonial-text">"{testimonial.review}"</p>
                  <div className="testimonial-author">
                    <p className="testimonial-name">{testimonial.name}</p>
                    <p className="testimonial-position">
                      {testimonial.position}, {testimonial.company}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Newsletter CTA */}
      <NewsletterCTA />

      {/* Partners Section */}
      {partners.length > 0 && (
        <section className="partners-section section-padding">
          <div className="container">
            <h2 className="section-heading text-center">You Are In Good Hands</h2>
            <div className="partners-grid">
              {partners.map((partner) => (
                <div key={partner._id?.toString()} className="partner-logo">
                  {partner.url ? (
                    <a href={partner.url} target="_blank" rel="noopener noreferrer">
                      <Image
                        src={partner.logo}
                        alt={partner.name}
                        width={150}
                        height={100}
                      />
                    </a>
                  ) : (
                    <Image
                      src={partner.logo}
                      alt={partner.name}
                      width={150}
                      height={100}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      <style jsx>{`
        .hero-section {
          position: relative;
          height: 100vh;
          min-height: 600px;
          overflow: hidden;
        }

        .hero-video-container {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
        }

        .hero-video {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .hero-placeholder {
          width: 100%;
          height: 100%;
          background: linear-gradient(135deg, var(--warm-grey-1) 0%, var(--warm-grey-3) 100%);
        }

        .hero-overlay {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(89, 56, 37, 0.4);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .hero-content {
          text-align: center;
          color: #fff;
          max-width: 800px;
          padding: 0 var(--container-padding);
        }

        .hero-headline {
          font-size: 75px;
          color: #fff;
          margin-bottom: var(--spacing-md);
        }

        .hero-subheadline {
          font-size: 24px;
          margin-bottom: var(--spacing-lg);
          line-height: 1.6;
        }

        .our-work-section {
          background: #fff;
        }

        .section-heading {
          text-align: center;
          margin-bottom: var(--spacing-lg);
        }

        .portfolio-carousel {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: var(--spacing-md);
          overflow-x: auto;
          padding-bottom: var(--spacing-sm);
        }

        .portfolio-card {
          background: #fff;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          transition: transform 0.3s ease;
        }

        .portfolio-card:hover {
          transform: translateY(-5px);
        }

        .portfolio-image {
          width: 100%;
          height: 250px;
          object-fit: cover;
        }

        .portfolio-card h3 {
          padding: var(--spacing-sm);
          font-size: 24px;
          text-align: center;
        }

        .testimonials-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: var(--spacing-md);
        }

        .testimonial-card {
          background: #fff;
          padding: var(--spacing-md);
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .testimonial-text {
          font-size: 19px;
          font-style: italic;
          margin-bottom: var(--spacing-sm);
          color: var(--sbd-brown);
        }

        .testimonial-author {
          border-top: 1px solid var(--warm-grey-3);
          padding-top: var(--spacing-sm);
        }

        .testimonial-name {
          font-weight: 600;
          color: var(--sbd-brown);
        }

        .testimonial-position {
          font-size: 16px;
          color: var(--warm-grey-3);
        }

        .partners-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: var(--spacing-lg);
          align-items: center;
          justify-items: center;
        }

        .partner-logo {
          opacity: 0.7;
          transition: opacity 0.3s ease;
        }

        .partner-logo:hover {
          opacity: 1;
        }

        @media (max-width: 768px) {
          .hero-headline {
            font-size: 48px;
          }

          .hero-subheadline {
            font-size: 20px;
          }

          .portfolio-carousel {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </>
  );
}
