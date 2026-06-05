import Link from 'next/link';
import { SBD_ABOUT_BOILERPLATE } from '@/lib/geo-entity';
import styles from './AboutSbdBoilerplate.module.css';

export default function AboutSbdBoilerplate() {
  return (
    <aside className={styles.boilerplate} aria-label="About Senior By Design">
      <div className="container">
        <h2 className={styles.heading}>About Senior By Design</h2>
        <p className={styles.text}>{SBD_ABOUT_BOILERPLATE}</p>
        <p className={styles.links}>
          <Link href="/senior-living-design-firm">Learn about the firm</Link>
          <span aria-hidden="true"> · </span>
          <Link href="/contact">Contact Senior By Design</Link>
        </p>
      </div>
    </aside>
  );
}
