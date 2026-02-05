'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styles from './page.module.css';

export default function BrochureViewer() {
  const router = useRouter();

  useEffect(() => {
    // Prevent body scroll when viewer is open
    document.body.style.overflow = 'hidden';

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        router.back();
      }
    };

    window.addEventListener('keydown', handleEscape);

    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleEscape);
    };
  }, [router]);

  const handleClose = () => {
    router.back();
  };

  return (
    <div className={styles.viewerContainer}>
      <button className={styles.closeButton} onClick={handleClose} aria-label="Close PDF viewer">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
      <iframe
        src="/files/SBD Interactive Brochure.pdf"
        className={styles.pdfFrame}
        title="Senior By Design Brochure"
        allow="fullscreen"
      />
    </div>
  );
}
