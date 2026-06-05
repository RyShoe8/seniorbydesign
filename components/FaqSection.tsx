import type { FaqItem } from '@/lib/schema/faq-content';
import styles from './FaqSection.module.css';

type FaqSectionProps = {
  faqs: FaqItem[];
  heading?: string;
};

export default function FaqSection({
  faqs,
  heading = 'Frequently Asked Questions',
}: FaqSectionProps) {
  return (
    <section className={`${styles.faqSection} section-padding bg-warm-grey`} aria-labelledby="faq-heading">
      <div className="container">
        <h2 id="faq-heading" className={styles.faqHeading}>
          {heading}
        </h2>
        <div className={styles.faqList}>
          {faqs.map((faq) => (
            <details key={faq.question} className={styles.faqItem}>
              <summary className={styles.faqQuestion}>{faq.question}</summary>
              <p className={styles.faqAnswer}>{faq.answer}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
