'use client';

import { useState, useCallback } from 'react';
import Image from 'next/image';
import styles from './PresentationGallery.module.css';

interface GalleryImage {
  src: string;
  alt: string;
  category?: string;
  caption?: string;
}

interface PresentationGalleryProps {
  images: GalleryImage[];
  className?: string;
}

export default function PresentationGallery({ images, className }: PresentationGalleryProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const categories = ['All', ...Array.from(new Set(images.map((img) => img.category).filter(Boolean))) as string[]];

  const filtered = selectedCategory === 'All'
    ? images
    : images.filter((img) => img.category === selectedCategory);

  const openLightbox = useCallback((i: number) => setLightboxIndex(i), []);
  const closeLightbox = useCallback(() => setLightboxIndex(null), []);

  const navigateLightbox = useCallback(
    (dir: 1 | -1) => {
      if (lightboxIndex === null) return;
      const next = lightboxIndex + dir;
      if (next >= 0 && next < filtered.length) setLightboxIndex(next);
    },
    [lightboxIndex, filtered.length]
  );

  const INITIAL_LIMIT = 8;
  const [displayCount, setDisplayCount] = useState<number>(INITIAL_LIMIT);

  const displayedItems = filtered.slice(0, displayCount);
  const hasMore = filtered.length > displayCount;

  const handleLoadMore = () => {
    setDisplayCount((prev) => Math.min(prev + 8, filtered.length));
  };

  return (
    <>
      {/* Category filter */}
      {categories.length > 2 && (
        <div className={styles.filters}>
          {categories.map((cat) => (
            <button
              key={cat}
              className={`${styles.filterBtn} ${selectedCategory === cat ? styles.filterActive : ''}`}
              onClick={() => {
                setSelectedCategory(cat);
                setDisplayCount(INITIAL_LIMIT);
              }}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {/* Masonry grid */}
      <div className={`${styles.grid} ${className || ''}`}>
        {displayedItems.map((img, i) => (
          <button
            key={`${img.src}-${i}`}
            className={styles.item}
            onClick={() => openLightbox(i)}
            aria-label={`View ${img.alt}`}
          >
            <Image
              src={img.src}
              alt={img.alt}
              fill
              className={styles.image}
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              loading="lazy"
            />
            <div className={styles.itemOverlay}>
              {img.caption && <span className={styles.caption}>{img.caption}</span>}
            </div>
          </button>
        ))}
      </div>

      {hasMore && (
        <div className={styles.loadMoreWrap}>
          <button className={styles.loadMoreBtn} onClick={handleLoadMore} type="button">
            <span>Load More Projects ({filtered.length - displayCount} remaining)</span>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      )}

      {/* Lightbox */}
      {lightboxIndex !== null && filtered[lightboxIndex] && (
        <div
          className={styles.lightbox}
          onClick={closeLightbox}
          role="dialog"
          aria-modal="true"
          aria-label="Image viewer"
        >
          <button className={styles.lightboxClose} onClick={closeLightbox} aria-label="Close">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
              <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>

          {lightboxIndex > 0 && (
            <button
              className={`${styles.lightboxNav} ${styles.lightboxPrev}`}
              onClick={(e) => { e.stopPropagation(); navigateLightbox(-1); }}
              aria-label="Previous image"
            >
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>
          )}

          <div className={styles.lightboxImageWrap} onClick={(e) => e.stopPropagation()}>
            <Image
              src={filtered[lightboxIndex].src}
              alt={filtered[lightboxIndex].alt}
              fill
              className={styles.lightboxImage}
              sizes="90vw"
              priority
            />
          </div>

          {lightboxIndex < filtered.length - 1 && (
            <button
              className={`${styles.lightboxNav} ${styles.lightboxNext}`}
              onClick={(e) => { e.stopPropagation(); navigateLightbox(1); }}
              aria-label="Next image"
            >
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>
          )}

          <div className={styles.lightboxCaption}>
            {filtered[lightboxIndex].caption || filtered[lightboxIndex].alt}
          </div>
        </div>
      )}
    </>
  );
}
