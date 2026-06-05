import Link from 'next/link';
import type { InternalLink } from '@/lib/internal-links';
import styles from './CrossLinks.module.css';

type Props = {
  links: InternalLink[];
  heading?: string;
};

export default function RelatedServices({
  links,
  heading = 'Related Services',
}: Props) {
  if (links.length === 0) return null;

  return (
    <aside className={styles.section} aria-label="Related services">
      <div className="container">
        <h2 className={styles.heading}>{heading}</h2>
        <ul className={styles.list}>
          {links.map((link) => (
            <li key={link.href} className={styles.item}>
              <Link href={link.href} className={styles.link}>
                <span className={styles.linkBody}>
                  <span className={styles.linkLabel}>{link.label}</span>
                  {link.description ? (
                    <span className={styles.linkDescription}>{link.description}</span>
                  ) : null}
                </span>
                <span className={styles.linkArrow} aria-hidden="true">→</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
}
