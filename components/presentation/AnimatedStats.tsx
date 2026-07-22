'use client';

import { useEffect, useRef, useState } from 'react';
import type { DGStat } from '@/lib/design-guide-models';
import styles from './AnimatedStats.module.css';

interface AnimatedStatsProps {
  stats: DGStat[];
  className?: string;
}

function easeOutExpo(t: number): number {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
}

function AnimatedCounter({ value, suffix }: { value: string; suffix?: string }) {
  const [display, setDisplay] = useState('0');
  const ref = useRef<HTMLSpanElement>(null);
  const hasAnimated = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const prefersReducedMotion =
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion) {
      setDisplay(value);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated.current) {
          hasAnimated.current = true;
          observer.unobserve(el);

          const numericValue = parseInt(value.replace(/[^0-9]/g, ''), 10);
          if (isNaN(numericValue)) {
            setDisplay(value);
            return;
          }

          const duration = 2000;
          const start = performance.now();

          const animate = (now: number) => {
            const elapsed = now - start;
            const progress = Math.min(elapsed / duration, 1);
            const easedProgress = easeOutExpo(progress);
            const current = Math.floor(numericValue * easedProgress);

            setDisplay(current.toLocaleString());

            if (progress < 1) {
              requestAnimationFrame(animate);
            } else {
              setDisplay(numericValue.toLocaleString());
            }
          };

          requestAnimationFrame(animate);
        }
      },
      { threshold: 0.3 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [value]);

  return (
    <span ref={ref} className={styles.counterValue}>
      {display}{suffix || ''}
    </span>
  );
}

export default function AnimatedStats({ stats, className }: AnimatedStatsProps) {
  return (
    <div className={`${styles.statsGrid} ${className || ''}`}>
      {stats.map((stat, i) => (
        <div
          key={i}
          className={styles.statCard}
          style={{ animationDelay: `${i * 150}ms` } as React.CSSProperties}
        >
          <AnimatedCounter value={stat.value} suffix={stat.suffix} />
          <span className={styles.statLabel}>{stat.label}</span>
        </div>
      ))}
    </div>
  );
}
