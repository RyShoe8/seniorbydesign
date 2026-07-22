'use client';

import { useEffect, useRef, useState } from 'react';
import type { DGProcessStep } from '@/lib/design-guide-models';
import styles from './ProcessTimeline.module.css';

interface ProcessTimelineProps {
  steps: DGProcessStep[];
  className?: string;
}

export default function ProcessTimeline({ steps, className }: ProcessTimelineProps) {
  const [activeStep, setActiveStep] = useState(-1);
  const stepsRef = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const prefersReducedMotion =
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion) {
      setActiveStep(steps.length - 1);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const index = Number((entry.target as HTMLElement).dataset.index);
            setActiveStep((prev) => Math.max(prev, index));
          }
        });
      },
      { threshold: 0.4, rootMargin: '0px 0px -20% 0px' }
    );

    stepsRef.current.forEach((el) => {
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [steps.length]);

  return (
    <div className={`${styles.timeline} ${className || ''}`}>
      {/* Vertical progress line */}
      <div className={styles.progressTrack}>
        <div
          className={styles.progressFill}
          style={{
            height: activeStep >= 0
              ? `${((activeStep + 1) / steps.length) * 100}%`
              : '0%',
          }}
        />
      </div>

      {steps.map((step, i) => {
        const isActive = i <= activeStep;
        return (
          <div
            key={i}
            ref={(el) => { stepsRef.current[i] = el; }}
            data-index={i}
            className={`${styles.step} ${isActive ? styles.active : ''}`}
          >
            <div className={styles.marker}>
              <div className={styles.markerDot}>
                <span className={styles.markerIcon}>{step.icon}</span>
              </div>
            </div>
            <div className={styles.content}>
              <span className={styles.phase}>{step.phase}</span>
              <h3 className={styles.title}>{step.title}</h3>
              <p className={styles.description}>{step.description}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
