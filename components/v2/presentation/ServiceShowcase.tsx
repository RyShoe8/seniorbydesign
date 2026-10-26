'use client';

import { useState } from 'react';
import Image from 'next/image';
import type { DGService } from '@/lib/design-guide-models';
import SectionReveal from './SectionReveal';
import styles from './ServiceShowcase.module.css';

interface ServiceShowcaseProps {
  services: DGService[];
  className?: string;
}

export default function ServiceShowcase({ services, className }: ServiceShowcaseProps) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const toggle = (i: number) => {
    setExpandedIndex(expandedIndex === i ? null : i);
  };

  return (
    <div className={`${styles.grid} ${className || ''}`}>
      {services
        .sort((a, b) => a.order - b.order)
        .map((service, i) => {
          const isExpanded = expandedIndex === i;
          return (
            <SectionReveal key={i} direction="up" delay={i * 120} duration={600}>
              <div
                className={`${styles.card} ${isExpanded ? styles.expanded : ''}`}
                onClick={() => toggle(i)}
                role="button"
                tabIndex={0}
                aria-expanded={isExpanded}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    toggle(i);
                  }
                }}
              >
                <div className={styles.imageWrap}>
                  <Image
                    src={service.image.src}
                    alt={service.image.alt}
                    fill
                    className={styles.image}
                    sizes="(max-width: 768px) 100vw, 50vw"
                    loading="lazy"
                  />
                  <div className={styles.imageOverlay} />
                </div>

                <div className={styles.content}>
                  <div className={styles.header}>
                    <span className={styles.number}>
                      {String(service.order).padStart(2, '0')}
                    </span>
                    <h3 className={styles.title}>{service.title}</h3>
                  </div>
                  <p className={styles.description}>{service.description}</p>

                  <div
                    className={styles.details}
                    style={{
                      maxHeight: isExpanded ? '500px' : '0',
                      opacity: isExpanded ? 1 : 0,
                    }}
                  >
                    <p className={styles.detailsText}>{service.details}</p>
                  </div>

                  <button className={styles.expandBtn} aria-label={isExpanded ? 'Show less' : 'Learn more'}>
                    <span className={styles.expandText}>
                      {isExpanded ? 'Show Less' : 'Learn More'}
                    </span>
                    <svg
                      className={`${styles.expandIcon} ${isExpanded ? styles.rotated : ''}`}
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M6 9l6 6 6-6"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            </SectionReveal>
          );
        })}
    </div>
  );
}
