'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import type { DGHero } from '@/lib/design-guide-models';
import styles from './PresentationHero.module.css';

interface PresentationHeroProps {
  hero: DGHero;
}

export default function PresentationHero({ hero }: PresentationHeroProps) {
  const [scrollY, setScrollY] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const prefersReducedMotion =
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion) {
      setRevealed(true);
      return;
    }

    // Parallax scroll handler
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };

    // Trigger reveal after a short delay for dramatic effect
    const timer = setTimeout(() => setRevealed(true), 200);

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      clearTimeout(timer);
    };
  }, []);

  const parallaxOffset = scrollY * 0.35;
  const opacityFade = Math.max(1 - scrollY / 800, 0);

  return (
    <section ref={sectionRef} className={styles.hero} id="hero">
      {/* Background image with parallax */}
      <div
        className={styles.bgWrap}
        style={{ transform: `translate3d(0, ${parallaxOffset}px, 0)` }}
      >
        <Image
          src={hero.backgroundImage.src}
          alt={hero.backgroundImage.alt}
          fill
          className={styles.bgImage}
          priority
          quality={90}
          sizes="100vw"
        />
        <div className={styles.bgOverlay} />
      </div>

      {/* Content */}
      <div
        className={styles.content}
        style={{ opacity: opacityFade }}
      >
        {/* Logo */}
        <div className={`${styles.logoWrap} ${revealed ? styles.revealed : ''}`}>
          <Image
            src="/images/senior-living-logo-design-sbd.webp"
            alt="Senior By Design logo"
            width={220}
            height={70}
            className={styles.logo}
            priority
          />
        </div>

        {/* Headline */}
        <h1 className={`${styles.headline} ${revealed ? styles.revealed : ''}`}>
          {(hero.headline || '').split(/\r?\n/).map((line, i) => (
            <span
              key={i}
              className={styles.headlineLine}
              style={{ animationDelay: `${400 + i * 200}ms` }}
            >
              {line}
            </span>
          ))}
        </h1>

        {/* Subheadline */}
        <p className={`${styles.subheadline} ${revealed ? styles.revealed : ''}`}>
          {hero.subheadline}
        </p>

        {/* CTA buttons */}
        <div className={`${styles.ctas} ${revealed ? styles.revealed : ''}`}>
          <a href={hero.ctaPrimary.href} className={styles.ctaPrimary}>
            {hero.ctaPrimary.label}
          </a>
          <button
            onClick={() => window.print()}
            className={styles.ctaSecondary}
            type="button"
          >
            {hero.ctaSecondary.label}
          </button>
        </div>

        {/* Scroll indicator */}
        <div className={`${styles.scrollIndicator} ${revealed ? styles.revealed : ''}`}>
          <div className={styles.scrollLine} />
        </div>
      </div>
    </section>
  );
}
