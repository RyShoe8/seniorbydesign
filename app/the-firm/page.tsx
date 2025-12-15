import { Metadata } from 'next';
import NewsletterCTA from '@/components/NewsletterCTA';
import Image from 'next/image';

export const metadata: Metadata = {
  title: 'The Firm - Senior By Design',
  description: 'We are not a catalog-inspired design firm. Our team scours markets around the world to hand-select collectible found items, antiques, customized art, and furniture.',
};

export default function TheFirm() {
  return (
    <>
      {/* Header Image */}
      <section className="firm-hero">
        <div className="firm-hero-image">
          <h1>The Firm</h1>
        </div>
      </section>

      {/* Company Culture */}
      <section className="firm-section section-padding">
        <div className="container">
          <div className="two-column">
            <div className="column-content">
              <h2>Company Culture</h2>
              <p>
                We are not a catalog-inspired design firm. Our team scours markets around the world to hand-select collectible found items, antiques, customized art, and furniture from local craftsmen and multi-national manufacturers that fulfill our stringent senior living requirements. These items are stored in our 35,000 square foot warehouse allowing us to offer these high-quality furnishings at a minimal cost.
              </p>
              <p>
                It's our great love of family that inspires all of our designs, and our aim is to reflect that genuine respect and love by making each community a place where residents love to live, and professionals love to work.
              </p>
              <p>
                Having designed 300 senior living communities and procured over $30,000,000 in acquisitions, SBD has created an unparalleled niche in designing interior and exterior senior living that is management, owner, and resident-focused through being flexible, collaborative and responsive.
              </p>
            </div>
            <div className="column-image">
              <div className="placeholder-image">Image Placeholder</div>
            </div>
          </div>
        </div>
      </section>

      {/* Single Column Section */}
      <section className="firm-section section-padding bg-warm-grey">
        <div className="container">
          <p className="large-text">
            We embrace a flair for elegant, eye catching details that playfully fuse the familiar with the unexpected, from incorporating renowned local artists to exotic antiques sourced from all corners of the world.
          </p>
        </div>
      </section>

      {/* Embedded Video */}
      <section className="firm-video-section section-padding">
        <div className="container">
          <div className="video-wrapper">
            <div className="video-placeholder">Video Placeholder</div>
          </div>
        </div>
      </section>

      {/* Communities We Serve */}
      <section className="firm-section section-padding">
        <div className="container">
          <h2>Communities We Serve</h2>
          <div className="two-column-list">
            <div className="column-list">
              <h4>Senior Living</h4>
              <ul>
                <li>Independent Living</li>
                <li>Assisted Living</li>
                <li>Memory Care</li>
                <li>Active Adult 55+</li>
                <li>Skilled Nursing</li>
                <li>Rehabilitation Centers</li>
                <li>Affordable Housing</li>
                <li>Sales Centers</li>
                <li>Model Units</li>
                <li>Redevelopment</li>
              </ul>
            </div>
            <div className="column-list">
              <h4>Multi Family</h4>
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

      {/* 35,000 sq.ft. Design Center */}
      <section className="firm-section section-padding bg-warm-grey">
        <div className="container">
          <h2>35,000 sq.ft. Design Center</h2>
          <p>
            Working beyond the constraints of catalogs gives us the opportunity to foster longstanding relationships with international artisans across Europe, Indonesia, Bali, Mexico, and China, so we can incorporate bespoke pieces that transform otherwise ordinary spaces. Our 35,000 square foot warehouse enables us to source and store readily available, timeless pieces. Our turnkey approach results in individualized design that is intelligent, elegant, unique and functional. We consider every piece of furniture from the perspective of our senior residents to ensure that our spaces are not only beautiful, but also maintain the highest standards for both comfort and long-term wearability.
          </p>
          <ul className="feature-list">
            <li>Saves money not using receivers</li>
            <li>Product always arrives on time</li>
            <li>Packaged with staging photography for easy & precise assembly</li>
            <li>Fine furniture at a great price</li>
            <li>Unique world wide assortment of product</li>
          </ul>
        </div>
      </section>

      {/* Embedded Video */}
      <section className="firm-video-section section-padding">
        <div className="container">
          <div className="video-wrapper">
            <div className="video-placeholder">Video Placeholder</div>
          </div>
        </div>
      </section>

      {/* Image Gallery */}
      <section className="firm-gallery section-padding">
        <div className="container">
          <div className="gallery-grid">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="gallery-item">
                <div className="placeholder-image">Image {i}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <NewsletterCTA />

      <style jsx>{`
        .firm-hero {
          height: 400px;
          background: linear-gradient(135deg, var(--warm-grey-1) 0%, var(--warm-grey-3) 100%);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .firm-hero-image h1 {
          color: var(--sbd-brown);
          font-size: 75px;
        }

        .two-column {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: var(--spacing-xl);
          align-items: center;
        }

        .column-content h2 {
          margin-bottom: var(--spacing-md);
        }

        .column-content p {
          margin-bottom: var(--spacing-sm);
        }

        .column-image {
          width: 100%;
        }

        .placeholder-image {
          width: 100%;
          height: 400px;
          background: var(--warm-grey-1);
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--warm-grey-3);
          border-radius: 8px;
        }

        .large-text {
          font-size: 24px;
          line-height: 1.8;
          text-align: center;
        }

        .video-wrapper {
          position: relative;
          width: 100%;
          padding-bottom: 56.25%;
          background: var(--warm-grey-1);
          border-radius: 8px;
        }

        .video-placeholder {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--warm-grey-3);
        }

        .two-column-list {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: var(--spacing-xl);
        }

        .column-list h4 {
          margin-bottom: var(--spacing-sm);
          color: var(--sbd-gold);
        }

        .column-list ul {
          list-style: none;
        }

        .column-list li {
          padding: 0.5rem 0;
          border-bottom: 1px solid var(--warm-grey-1);
        }

        .feature-list {
          margin-top: var(--spacing-md);
          list-style: none;
        }

        .feature-list li {
          padding: 0.75rem 0;
          padding-left: 2rem;
          position: relative;
        }

        .feature-list li:before {
          content: '✓';
          position: absolute;
          left: 0;
          color: var(--sbd-gold);
          font-weight: bold;
        }

        .gallery-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: var(--spacing-md);
        }

        .gallery-item .placeholder-image {
          height: 300px;
        }

        @media (max-width: 968px) {
          .two-column,
          .two-column-list {
            grid-template-columns: 1fr;
          }

          .gallery-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 768px) {
          .firm-hero-image h1 {
            font-size: 48px;
          }

          .gallery-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </>
  );
}

