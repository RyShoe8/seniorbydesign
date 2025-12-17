import { Metadata } from 'next';
import NewsletterCTA from '@/components/NewsletterCTA';
import WarehouseGallery from '@/components/WarehouseGallery';
import Image from 'next/image';
import styles from './page.module.css';

export const metadata: Metadata = {
  title: 'The Firm - Senior By Design',
  description: 'We are not a catalog-inspired design firm. Our team scours markets around the world to hand-select collectible found items, antiques, customized art, and furniture.',
};

export default function TheFirm() {
  return (
    <>
      {/* Header Image */}
      <section className={styles.firmHero}>
        <div className={styles.firmHeroImage}>
          <Image
            src="/images/The Firm/The Firm Header.webp"
            alt="The Firm"
            fill
            className={styles.heroImage}
            priority
          />
          <h1>The Firm</h1>
        </div>
      </section>

      {/* Company Culture */}
      <section className="firm-section section-padding">
        <div className="container">
          <div className={styles.twoColumn}>
            <div className={styles.columnContent}>
              <h2>Company Culture</h2>
              <p>
                We are not a catalog-inspired design firm. Our team scours markets around the world to hand-select collectible found items, antiques, customized art, and furniture from local craftsmen and multi-national manufacturers that fulfill our stringent senior living requirements. These items are stored in our 35,000 square foot warehouse allowing us to offer these high-quality furnishings at a minimal cost.
              </p>
              <p>
                It&apos;s our great love of family that inspires all of our designs, and our aim is to reflect that genuine respect and love by making each community a place where residents love to live, and professionals love to work.
              </p>
              <p>
                Having designed 300 senior living communities and procured over $30,000,000 in acquisitions, SBD has created an unparalleled niche in designing interior and exterior senior living that is management, owner, and resident-focused through being flexible, collaborative and responsive.
              </p>
            </div>
            <div className={styles.columnImage}>
              <Image
                src="/images/The Firm/Culture.webp"
                alt="Company Culture"
                width={600}
                height={400}
                className={styles.cultureImage}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Single Column Section */}
      <section className="firm-section section-padding bg-warm-grey">
        <div className="container">
          <p className={styles.largeText}>
            We embrace a flair for elegant, eye catching details that playfully fuse the familiar with the unexpected, from incorporating renowned local artists to exotic antiques sourced from all corners of the world.
          </p>
        </div>
      </section>

      {/* Embedded Video */}
      <section className="firm-video-section section-padding">
        <div className="container">
          <div className={styles.videoWrapper}>
            <div className={styles.videoPlaceholder}>Video Placeholder</div>
          </div>
        </div>
      </section>

      {/* Communities We Serve */}
      <section className="firm-section section-padding">
        <div className="container">
          <h2 className={styles.centeredHeading}>Communities We Serve</h2>
          <div className={styles.twoColumnListCentered}>
            <div className={styles.columnList}>
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
            <div className={styles.columnList}>
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
          <div className={styles.centeredContent}>
            <h2 className={styles.centeredHeading}>35,000 sq.ft. Design Center</h2>
            <p className={styles.centeredParagraph}>
              Working beyond the constraints of catalogs gives us the opportunity to foster longstanding relationships with international artisans across Europe, Indonesia, Bali, Mexico, and China, so we can incorporate bespoke pieces that transform otherwise ordinary spaces. Our 35,000 square foot warehouse enables us to source and store readily available, timeless pieces. Our turnkey approach results in individualized design that is intelligent, elegant, unique and functional. We consider every piece of furniture from the perspective of our senior residents to ensure that our spaces are not only beautiful, but also maintain the highest standards for both comfort and long-term wearability.
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

      {/* Embedded Video */}
      <section className="firm-video-section section-padding">
        <div className="container">
          <div className={styles.videoWrapper}>
            <div className={styles.videoPlaceholder}>Video Placeholder</div>
          </div>
        </div>
      </section>

      {/* Image Gallery */}
      <section className="firm-gallery section-padding">
        <div className="container">
          <WarehouseGallery />
        </div>
      </section>

      <NewsletterCTA />
    </>
  );
}

