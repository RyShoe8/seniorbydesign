import Link from 'next/link';
import type { InternalLink } from '@/lib/internal-links';
import styles from './CrossLinks.module.css';

type Props = {
  links: InternalLink[];
  heading?: string;
};

export default function SeeOurWork({ links, heading = 'See Our Work' }: Props) {
  if (links.length === 0) return null;

  return (
    <aside className={styles.section} aria-label="See our work">
      <div className="container">
        <h2 className={styles.heading}>{heading}</h2>
        <div className={styles.cardGrid}>
          {links.map((link) => (
            <Link key={link.href} href={link.href} className={styles.card}>
              <span className={styles.cardLabel}>{link.label}</span>
              <span className={styles.cardArrow} aria-hidden="true">→</span>
            </Link>
          ))}
        </div>
      </div>
    </aside>
  );
}
