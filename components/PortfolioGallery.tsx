'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import SeoImage from '@/components/SeoImage';
import Link from 'next/link';
import { getPortfolioImageUrl } from '@/lib/image-utils';

interface PortfolioImage {
  url: string;
  displayName: string;
  altText: string;
}

interface Props {
  images: PortfolioImage[];
  categoryName: string;
}

function portfolioImageUnoptimized(url: string): boolean {
  const resolved = getPortfolioImageUrl(url);
  return resolved.startsWith('http') || resolved.startsWith('/api/image-proxy');
}

const SWIPE_THRESHOLD_PX = 50;
const SWIPE_HORIZONTAL_RATIO = 1.25;

export default function PortfolioGallery({ images, categoryName }: Props) {
  const imageUrls = images.map((img) => img.url);
  const imageAlts = images.map((img) => img.altText || img.displayName);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [failedImageIndices, setFailedImageIndices] = useState<Set<number>>(new Set());

  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const touchLockHorizontalRef = useRef(false);
  const swipeAreaRef = useRef<HTMLDivElement>(null);

  const openFullscreen = (index: number) => {
    setCurrentImageIndex(index);
    setIsFullscreen(true);
  };

  const closeFullscreen = useCallback(() => {
    setIsFullscreen(false);
  }, []);

  const nextImage = useCallback(() => {
    setCurrentImageIndex((prev) => (prev + 1) % imageUrls.length);
  }, [imageUrls.length]);

  const prevImage = useCallback(() => {
    setCurrentImageIndex((prev) => (prev - 1 + imageUrls.length) % imageUrls.length);
  }, [imageUrls.length]);

  useEffect(() => {
    if (!isFullscreen) return;

    document.body.style.overflow = 'hidden';

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeFullscreen();
      }
    };

    window.addEventListener('keydown', handleEscape);

    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleEscape);
    };
  }, [isFullscreen, closeFullscreen]);

  useEffect(() => {
    if (!isFullscreen) return;
    const el = swipeAreaRef.current;
    if (!el) return;

    const handleStart = (e: TouchEvent) => {
      if (e.touches.length !== 1) return;
      const t = e.touches[0];
      touchStartRef.current = { x: t.clientX, y: t.clientY };
      touchLockHorizontalRef.current = false;
    };

    const handleMove = (e: TouchEvent) => {
      if (!touchStartRef.current || e.touches.length !== 1) return;
      const t = e.touches[0];
      const dx = t.clientX - touchStartRef.current.x;
      const dy = t.clientY - touchStartRef.current.y;

      if (!touchLockHorizontalRef.current) {
        const ax = Math.abs(dx);
        const ay = Math.abs(dy);
        if (ax > 10 && ax > ay * SWIPE_HORIZONTAL_RATIO) {
          touchLockHorizontalRef.current = true;
        } else if (ay > 10 && ay > ax) {
          touchStartRef.current = null;
          return;
        }
      }

      if (touchLockHorizontalRef.current) {
        e.preventDefault();
      }
    };

    const handleEnd = (e: TouchEvent) => {
      const start = touchStartRef.current;
      touchStartRef.current = null;
      touchLockHorizontalRef.current = false;
      if (!start || e.changedTouches.length !== 1) return;

      const t = e.changedTouches[0];
      const dx = t.clientX - start.x;
      const dy = t.clientY - start.y;

      if (Math.abs(dx) < SWIPE_THRESHOLD_PX) return;
      if (Math.abs(dx) < Math.abs(dy) * SWIPE_HORIZONTAL_RATIO) return;

      if (dx < 0) {
        nextImage();
      } else {
        prevImage();
      }
    };

    el.addEventListener('touchstart', handleStart, { passive: true });
    el.addEventListener('touchmove', handleMove, { passive: false });
    el.addEventListener('touchend', handleEnd, { passive: true });
    el.addEventListener('touchcancel', handleEnd, { passive: true });

    return () => {
      el.removeEventListener('touchstart', handleStart);
      el.removeEventListener('touchmove', handleMove);
      el.removeEventListener('touchend', handleEnd);
      el.removeEventListener('touchcancel', handleEnd);
    };
  }, [isFullscreen, nextImage, prevImage]);

  return (
    <>
      <section
        className="portfolio-detail section-padding"
        aria-label={categoryName ? `${categoryName} photo gallery` : 'Portfolio photo gallery'}
      >
        <div className="container">
          <div className="back-link-container">
            <Link href="/portfolio" className="back-link">
              ← Back to Portfolio
            </Link>
          </div>

          {imageUrls.length > 0 ? (
            <div className="portfolio-gallery">
              <div className="gallery-thumbnails">
                {imageUrls.map((imageUrl, index) => {
                  const hasError = failedImageIndices.has(index);
                  const thumbSrc = getPortfolioImageUrl(imageUrl);
                  return (
                    <div
                      key={index}
                      className="thumbnail"
                      onClick={() => !hasError && openFullscreen(index)}
                    >
                      {hasError ? (
                        <div className="thumbnail-placeholder">
                          <span className="placeholder-icon">📷</span>
                          <span>{imageAlts[index] || `Image ${index + 1}`}</span>
                        </div>
                      ) : (
                        <SeoImage
                          src={thumbSrc}
                          alt={imageAlts[index] || `Portfolio image ${index + 1}`}
                          fill
                          style={{ objectFit: 'cover' }}
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 400px"
                          unoptimized={portfolioImageUnoptimized(imageUrl)}
                          onError={() => setFailedImageIndices((prev) => new Set(prev).add(index))}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="no-images">
              <p>No images available for this portfolio category.</p>
            </div>
          )}
        </div>
      </section>

      {isFullscreen && imageUrls.length > 0 && (
        <div className="fullscreen-overlay" onClick={closeFullscreen} role="presentation">
          <div className="fullscreen-toolbar" onClick={(e) => e.stopPropagation()}>
            <div className="fullscreen-toolbar-nav">
              <button
                type="button"
                className="toolbar-nav-btn"
                aria-label="Previous image"
                onClick={prevImage}
              >
                ‹
              </button>
              <button
                type="button"
                className="toolbar-nav-btn"
                aria-label="Next image"
                onClick={nextImage}
              >
                ›
              </button>
            </div>
            <button
              type="button"
              className="toolbar-close-btn"
              aria-label="Close gallery"
              onClick={closeFullscreen}
            >
              ×
            </button>
          </div>

          <div className="fullscreen-stage">
            <div
              ref={swipeAreaRef}
              className="fullscreen-image"
              onClick={(e) => e.stopPropagation()}
            >
              {failedImageIndices.has(currentImageIndex) ? (
                <div className="fullscreen-placeholder">
                  <span className="placeholder-icon">📷</span>
                  <span>{imageAlts[currentImageIndex] || `Image ${currentImageIndex + 1}`}</span>
                </div>
              ) : (
                <div className="fullscreen-image-inner">
                  <SeoImage
                    src={getPortfolioImageUrl(imageUrls[currentImageIndex])}
                    alt={imageAlts[currentImageIndex] || `Portfolio image ${currentImageIndex + 1}`}
                    fill
                    className="fullscreen-img"
                    sizes="100vw"
                    unoptimized={portfolioImageUnoptimized(imageUrls[currentImageIndex])}
                    onError={() =>
                      setFailedImageIndices((prev) => new Set(prev).add(currentImageIndex))
                    }
                    priority
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .back-link-container {
          margin-bottom: var(--spacing-lg);
        }

        .back-link {
          color: var(--sbd-brown);
          font-weight: 500;
        }

        .portfolio-gallery {
          width: 100%;
        }

        .gallery-thumbnails {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
          gap: var(--spacing-lg);
        }

        .thumbnail {
          cursor: pointer;
          border-radius: 8px;
          overflow: hidden;
          transition: transform 0.3s ease;
          aspect-ratio: 1;
          position: relative;
          contain: layout style paint;
        }

        .thumbnail-placeholder,
        .fullscreen-placeholder {
          position: absolute;
          inset: 0;
          background: var(--warm-grey-1);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: var(--spacing-xs);
          color: var(--warm-grey-3);
          font-size: 14px;
        }

        .fullscreen-placeholder {
          position: relative;
          width: 100%;
          min-height: 40vh;
          max-width: 100%;
        }

        .placeholder-icon {
          font-size: 48px;
          opacity: 0.5;
        }

        .thumbnail:hover {
          transform: scale(1.05);
        }

        .thumbnail img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .no-images {
          text-align: center;
          padding: var(--spacing-xl);
          color: var(--warm-grey-3);
        }

        .fullscreen-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.95);
          z-index: 9999;
          display: flex;
          flex-direction: column;
          cursor: pointer;
          overscroll-behavior: none;
          touch-action: none;
          padding-top: env(safe-area-inset-top, 0);
        }

        .fullscreen-toolbar {
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: var(--spacing-md);
          padding: 0.75rem 1rem;
          padding-left: max(1rem, env(safe-area-inset-left, 0));
          padding-right: max(1rem, env(safe-area-inset-right, 0));
          z-index: 10001;
        }

        .fullscreen-toolbar-nav {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .toolbar-nav-btn {
          min-width: 48px;
          min-height: 48px;
          padding: 0 0.75rem;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(255, 255, 255, 0.92);
          border: none;
          border-radius: 10px;
          color: var(--sbd-brown);
          font-size: 1.75rem;
          line-height: 1;
          cursor: pointer;
          transition: background 0.2s ease, transform 0.15s ease;
        }

        .toolbar-nav-btn:hover {
          background: #fff;
        }

        .toolbar-nav-btn:active {
          transform: scale(0.96);
        }

        .toolbar-close-btn {
          min-width: 48px;
          min-height: 48px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(255, 255, 255, 0.92);
          border: none;
          border-radius: 50%;
          color: var(--sbd-brown);
          font-size: 1.75rem;
          line-height: 1;
          cursor: pointer;
          transition: background 0.2s ease, transform 0.15s ease;
        }

        .toolbar-close-btn:hover {
          background: #fff;
        }

        .toolbar-close-btn:active {
          transform: scale(0.96);
        }

        .fullscreen-stage {
          flex: 1;
          min-height: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0 1rem 1.5rem;
          padding-bottom: max(1.5rem, env(safe-area-inset-bottom, 0));
        }

        .fullscreen-image {
          position: relative;
          max-width: 100%;
          max-height: 100%;
          width: min(100%, 1400px);
          height: 100%;
          cursor: default;
          touch-action: none;
        }

        .fullscreen-image-inner {
          position: relative;
          width: 100%;
          height: min(85vh, 100%);
          min-height: 200px;
        }

        :global(.fullscreen-img) {
          object-fit: contain;
        }

        @media (min-width: 769px) {
          .toolbar-nav-btn,
          .toolbar-close-btn {
            min-width: 52px;
            min-height: 52px;
            font-size: 2rem;
          }
        }

        @media (max-width: 768px) {
          .gallery-thumbnails {
            grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
            gap: var(--spacing-md);
          }

          .fullscreen-image-inner {
            height: min(calc(100vh - 8rem), 100%);
          }
        }
      `}</style>
    </>
  );
}
