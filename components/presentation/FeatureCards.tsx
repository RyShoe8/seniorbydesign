'use client';

import type { DGWhyUsCard } from '@/lib/design-guide-models';
import SectionReveal from './SectionReveal';
import styles from './FeatureCards.module.css';

interface FeatureCardsProps {
  cards: DGWhyUsCard[];
  className?: string;
}

export default function FeatureCards({ cards, className }: FeatureCardsProps) {
  return (
    <div className={`${styles.grid} ${className || ''}`}>
      {cards.map((card, i) => (
        <SectionReveal key={i} direction="up" delay={i * 100} duration={600}>
          <div className={styles.card}>
            <div className={styles.iconWrap}>
              <span className={styles.icon}>{card.icon}</span>
            </div>
            <h3 className={styles.title}>{card.title}</h3>
            <p className={styles.description}>{card.description}</p>
          </div>
        </SectionReveal>
      ))}
    </div>
  );
}
