import {
  formatAddressLines,
  formatPhoneDisplay,
  formatPhoneTel,
  formatStudioLines,
  getWarehouseLabel,
  ORG_EMAIL,
  ORG_NAME,
} from '@/lib/geo-entity';
import styles from './EntityContactBlock.module.css';

type Props = {
  variant?: 'compact' | 'full';
  className?: string;
};

export default function EntityContactBlock({ variant = 'full', className }: Props) {
  const studioLines = formatStudioLines();
  const warehouseLines = formatAddressLines();
  const phone = formatPhoneDisplay();

  return (
    <address
      className={`${styles.block} ${styles[variant]} ${className ?? ''}`.trim()}
      aria-label="Senior By Design contact information"
    >
      <strong className={styles.name}>{ORG_NAME}</strong>

      <span className={styles.sectionLabel}>Design Studios</span>
      {studioLines.map((line) => (
        <span key={line} className={styles.line}>
          {line}
        </span>
      ))}

      <span className={styles.sectionLabel}>{getWarehouseLabel()}</span>
      {warehouseLines.map((line) => (
        <span key={line} className={styles.line}>
          {line}
        </span>
      ))}

      <span className={styles.line}>
        <a href={`tel:${formatPhoneTel()}`}>{phone}</a>
      </span>
      {variant === 'full' ? (
        <span className={styles.line}>
          <a href={`mailto:${ORG_EMAIL}`}>{ORG_EMAIL}</a>
        </span>
      ) : null}
    </address>
  );
}
