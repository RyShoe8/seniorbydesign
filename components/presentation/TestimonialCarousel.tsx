'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Image from 'next/image';
import type { DGTestimonial } from '@/lib/design-guide-models';
import styles from './TestimonialCarousel.module.css';

interface TestimonialCarouselProps {
  testimonials: DGTestimonial[];
  autoAdvance?: number; // ms, 0 to disable
  className?: string;
}

export default function TestimonialCarousel({
  testimonials,
  autoAdvance = 6000,
  className,
}: TestimonialCarouselProps) {
  const [current, setCurrent] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval>>();

  const count = testimonials.length;

  const goTo = useCallback((i: number) => {
    setCurrent(((i % count) + count) % count);
  }, [count]);

  // Auto-advance
  useEffect(() => {
    if (autoAdvance <= 0 || isPaused || count <= 1) return;

    timerRef.current = setInterval(() => {
      setCurrent((prev) => (prev + 1) % count);
    }, autoAdvance);

    return () => clearInterval(timerRef.current);
  }, [autoAdvance, isPaused, count]);

  const item = testimonials[current];
  if (!item) return null;

  // Stars renderer
  const renderStars = (rating: number) => (
    <div className={styles.stars} aria-label={`${rating} out of 5 stars`}>
      {Array.from({ length: 5 }, (_, i) => (
        <svg
          key={i}
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill={i < rating ? 'var(--sbd-gold, #cbac6d)' : 'none'}
          stroke={i < rating ? 'var(--sbd-gold, #cbac6d)' : 'rgba(203,172,109,0.3)'}
          strokeWidth="2"
        >
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      ))}
    </div>
  );

  return (
    <div
      className={`${styles.wrapper} ${className || ''}`}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className={styles.quoteCard}>
        <svg className={styles.quoteIcon} width="48" height="48" viewBox="0 0 24 24" fill="none">
          <path
            d="M10 11H6.101c.001-.243.041-.482.1-.72C6.803 7.948 8.797 6.4 10 6V3c-4.146.717-7 4.075-7 8.5V21h10V11h-3zm11 0h-3.899c.001-.243.041-.482.1-.72C17.803 7.948 19.797 6.4 21 6V3c-4.146.717-7 4.075-7 8.5V21h10V11h-3z"
            fill="rgba(203, 172, 109, 0.12)"
          />
        </svg>

        <blockquote className={styles.quote}>
          &ldquo;{item.quote}&rdquo;
        </blockquote>

        {item.rating && renderStars(item.rating)}

        <div className={styles.attribution}>
          {item.image?.src && (
            <div className={styles.avatar}>
              <Image
                src={item.image.src}
                alt={item.image.alt || item.name}
                width={56}
                height={56}
                className={styles.avatarImage}
              />
            </div>
          )}
          <div>
            <span className={styles.name}>{item.name}</span>
            {item.title && <span className={styles.title}>{item.title}</span>}
          </div>
        </div>
      </div>

      {/* Dot navigation */}
      {count > 1 && (
        <div className={styles.dots}>
          {testimonials.map((_, i) => (
            <button
              key={i}
              className={`${styles.dot} ${i === current ? styles.dotActive : ''}`}
              onClick={() => goTo(i)}
              aria-label={`View testimonial ${i + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
