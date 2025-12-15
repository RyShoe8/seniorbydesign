import Link from 'next/link';

export default function NewsletterCTA() {
  return (
    <section className="newsletter-cta">
      <div className="newsletter-cta-container">
        <h3 className="newsletter-cta-heading">Join our family and receive our monthly newsletter.</h3>
        <p className="newsletter-cta-text">
          Download our digital brochure or have a physical copy sent to you.
        </p>
        <Link href="/newsletter-and-brochure" className="btn">
          Get Started
        </Link>
      </div>

      <style jsx>{`
        .newsletter-cta {
          background-color: var(--warm-grey-1);
          padding: var(--spacing-xl) 0;
          text-align: center;
        }

        .newsletter-cta-container {
          max-width: var(--container-max-width);
          margin: 0 auto;
          padding: 0 var(--container-padding);
        }

        .newsletter-cta-heading {
          font-size: 42px;
          color: var(--sbd-brown);
          margin-bottom: var(--spacing-sm);
        }

        .newsletter-cta-text {
          font-size: 19px;
          color: var(--sbd-brown);
          margin-bottom: var(--spacing-md);
        }

        @media (max-width: 768px) {
          .newsletter-cta-heading {
            font-size: 32px;
          }
        }
      `}</style>
    </section>
  );
}

