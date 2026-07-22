'use client';

import { useRef, useState, useEffect } from 'react';
import Link from 'next/link';
import SeoImage from '@/components/SeoImage';
import { getPortfolioImageUrl } from '@/lib/image-utils';
import { ensureImageAlt, portfolioAltText } from '@/lib/image-seo';
import { portfolioCategoryDisplayLabel } from '@/lib/portfolio-seo';
import styles from './PortfolioCarousel.module.css';

interface PortfolioImage {
  url: string;
  displayName: string;
  altText: string;
}

interface PortfolioCategory {
  _id?: string;
  slug: string;
  name: string;
  images?: PortfolioImage[] | string[];
}

interface PortfolioCarouselProps {
  categories: PortfolioCategory[];
}

export default function PortfolioCarousel({ categories }: PortfolioCarouselProps) {
  const carouselRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set());

  const updateScrollButtons = () => {
    if (!carouselRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = carouselRef.current;
    setCanScrollLeft(scrollLeft > 0);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
  };

  useEffect(() => {
    const carousel = carouselRef.current;
    if (!carousel) return;

    updateScrollButtons();
    carousel.addEventListener('scroll', updateScrollButtons);
    window.addEventListener('resize', updateScrollButtons);

    return () => {
      carousel.removeEventListener('scroll', updateScrollButtons);
      window.removeEventListener('resize', updateScrollButtons);
    };
  }, [categories]);

  const scroll = (direction: 'left' | 'right') => {
    if (!carouselRef.current) return;
    
    const track = carouselRef.current.querySelector(`.${styles.carouselTrack}`) as HTMLElement;
    if (!track || track.children.length === 0) return;
    
    const firstCard = track.children[0] as HTMLElement;
    const cardWidth = firstCard.getBoundingClientRect().width;
    const gap = parseInt(getComputedStyle(track).gap) || 32;
    const scrollAmount = cardWidth + gap;
    
    carouselRef.current.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    });
  };

  return (
    <div className={styles.carouselWrapper}>
      <button
        className={`${styles.navButton} ${styles.navButtonLeft} ${!canScrollLeft ? styles.navButtonDisabled : ''}`}
        onClick={() => scroll('left')}
        aria-label="Scroll left"
        disabled={!canScrollLeft}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
      
      <div className={styles.carousel} ref={carouselRef}>
        <div className={styles.carouselTrack}>
          {categories.map((category) => {
            // Handle both old format (string[]) and new format (PortfolioImage[])
            const firstImage = category.images?.[0];
            const displayName = portfolioCategoryDisplayLabel(category.slug, category.name);
            const imageUrl = typeof firstImage === 'string' ? firstImage : firstImage?.url;
            const imageAlt =
              typeof firstImage === 'string'
                ? portfolioAltText({ slug: category.slug, displayName })
                : ensureImageAlt(
                    firstImage?.altText,
                    portfolioAltText({ slug: category.slug, displayName })
                  );
            const cardKey = category._id?.toString() || category.slug;
            const imageFailed = failedImages.has(cardKey);

            return (
              <Link
                key={cardKey}
                href={`/portfolio/${category.slug}`}
                className={styles.portfolioCard}
              >
                {imageUrl && !imageFailed ? (
                  <SeoImage
                    src={getPortfolioImageUrl(imageUrl)}
                    alt={imageAlt}
                    width={400}
                    height={300}
                    className={styles.portfolioImage}
                    unoptimized={
                      imageUrl.startsWith('http') ||
                      getPortfolioImageUrl(imageUrl).startsWith('/api/image-proxy')
                    }
                    onError={() => setFailedImages((prev) => new Set(prev).add(cardKey))}
                  />
                ) : (
                  <div className={styles.imagePlaceholder}>
                    <span className={styles.placeholderIcon}>📷</span>
                    <span>{displayName}</span>
                  </div>
                )}
                <h3>{displayName}</h3>
              </Link>
            );
          })}
        </div>
      </div>

      <button
        className={`${styles.navButton} ${styles.navButtonRight} ${!canScrollRight ? styles.navButtonDisabled : ''}`}
        onClick={() => scroll('right')}
        aria-label="Scroll right"
        disabled={!canScrollRight}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
    </div>
  );
}
