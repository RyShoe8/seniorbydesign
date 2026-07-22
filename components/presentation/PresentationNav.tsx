'use client';

import { useEffect, useState } from 'react';
import styles from './PresentationNav.module.css';

interface NavSection {
  id: string;
  label: string;
}

interface PresentationNavProps {
  sections: NavSection[];
}

export default function PresentationNav({ sections }: PresentationNavProps) {
  const [activeSection, setActiveSection] = useState('');
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // Show nav after scrolling past hero
      setVisible(window.scrollY > window.innerHeight * 0.5);
    };

    const observer = new IntersectionObserver(
      (entries) => {
        // Find the most visible section
        const visibleEntries = entries.filter((e) => e.isIntersecting);
        if (visibleEntries.length > 0) {
          const most = visibleEntries.reduce((a, b) =>
            a.intersectionRatio > b.intersectionRatio ? a : b
          );
          setActiveSection(most.target.id);
        }
      },
      { threshold: [0.2, 0.4, 0.6], rootMargin: '-20% 0px -20% 0px' }
    );

    sections.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => {
      observer.disconnect();
      window.removeEventListener('scroll', handleScroll);
    };
  }, [sections]);

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <nav
      className={`${styles.nav} ${visible ? styles.visible : ''}`}
      aria-label="Section navigation"
    >
      {sections.map(({ id, label }) => (
        <button
          key={id}
          className={`${styles.dot} ${activeSection === id ? styles.active : ''}`}
          onClick={() => scrollTo(id)}
          aria-label={`Go to ${label}`}
          title={label}
        >
          <span className={styles.tooltip}>{label}</span>
        </button>
      ))}
    </nav>
  );
}
