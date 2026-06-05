import Link from 'next/link';
import type { HubLink } from '@/lib/internal-links';
import styles from './CrossLinks.module.css';

type Props = {
  links: HubLink[];
  heading: string;
  className?: string;
  bgClass?: string;
};

export default function HubLinksSection({ links, heading, className, bgClass = 'bg-warm-grey' }: Props) {
  if (links.length === 0) return null;

  return (
    <section className={`section-padding ${bgClass} ${className ?? ''}`.trim()}>
      <div className="container">
        <h2 className={styles.heading}>{heading}</h2>
        <div className={styles.hubGrid}>
          {links.map((link) => (
            <Link key={link.href} href={link.href} className={styles.hubCard}>
              <span className={styles.hubLabel}>{link.label}</span>
              <span className={styles.hubDescription}>{link.description}</span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
