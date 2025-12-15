import Link from 'next/link';
import styles from './NewsletterCTA.module.css';

export default function NewsletterCTA() {
  return (
    <section className={styles.newsletterCta}>
      <div className={styles.newsletterCtaContainer}>
        <h3 className={styles.newsletterCtaHeading}>Join our family and receive our monthly newsletter.</h3>
        <p className={styles.newsletterCtaText}>
          Download our digital brochure or have a physical copy sent to you.
        </p>
        <Link href="/newsletter-and-brochure" className="btn">
          Get Started
        </Link>
      </div>
    </section>
  );
}

