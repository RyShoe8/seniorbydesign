'use client';

import { useState } from 'react';
import SeoImage from '@/components/v2/SeoImage';
import { getPortfolioImageUrl } from '@/lib/image-utils';
import styles from './PortfolioCategoryImage.module.css';

interface PortfolioCategoryImageProps {
  src: string;
  alt: string;
  displayName: string;
  /** Set false when the page prints the name beneath the photo instead of over it. */
  showTitle?: boolean;
}

export default function PortfolioCategoryImage({ src, alt, displayName, showTitle = true }: PortfolioCategoryImageProps) {
  const [hasError, setHasError] = useState(false);
  const imageSrc = getPortfolioImageUrl(src);

  if (hasError && !showTitle) {
    return <div className={styles.placeholder} aria-hidden="true" />;
  }

  if (hasError) {
    return (
      <>
        <div className={styles.placeholder}>
          <span className={styles.placeholderIcon}>📷</span>
          <span>{displayName}</span>
        </div>
        <div className={styles.overlay}>
          <h3>{displayName}</h3>
        </div>
      </>
    );
  }

  return (
    <>
      <SeoImage
        src={imageSrc}
        alt={alt}
        fill
        className={styles.categoryImage}
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 400px"
        unoptimized={src.startsWith('http') || imageSrc.startsWith('/api/image-proxy')}
        onError={() => setHasError(true)}
      />
      {showTitle && (
        <div className={styles.overlay}>
          <h3>{displayName}</h3>
        </div>
      )}
    </>
  );
}
