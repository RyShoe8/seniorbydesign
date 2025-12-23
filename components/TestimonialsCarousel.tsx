'use client';

import { useRef, useState, useEffect } from 'react';
import styles from './TestimonialsCarousel.module.css';

interface Testimonial {
  review: string;
  name: string;
  position: string;
  company: string;
}

interface TestimonialsCarouselProps {
  testimonials: Testimonial[];
}

export default function TestimonialsCarousel({ testimonials }: TestimonialsCarouselProps) {
  const carouselRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

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
  }, [testimonials]);

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
          {testimonials.map((testimonial, index) => (
            testimonial && testimonial.review ? (
              <div key={index} className={styles.testimonialCard}>
                <p className={styles.testimonialText}>&ldquo;{testimonial.review}&rdquo;</p>
                <div className={styles.testimonialAuthor}>
                  <p className={styles.testimonialName}>{testimonial.name || ''}</p>
                  <p className={styles.testimonialPosition}>
                    {testimonial.position || ''}{testimonial.position && testimonial.company ? ', ' : ''}{testimonial.company || ''}
                  </p>
                </div>
              </div>
            ) : null
          ))}
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


