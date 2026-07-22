'use client';

import { useState } from 'react';
import styles from './PDFExportButton.module.css';

interface PDFExportButtonProps {
  className?: string;
  label?: string;
}

export default function PDFExportButton({
  className,
  label = 'Download PDF',
}: PDFExportButtonProps) {
  const [downloading, setDownloading] = useState(false);

  const handleDownload = () => {
    window.print();
  };

  return (
    <button
      className={`${styles.btn} ${className || ''}`}
      onClick={handleDownload}
      disabled={downloading}
      aria-label={label}
    >
      <svg
        className={styles.icon}
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
      >
        <path
          d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      {downloading ? 'Downloading...' : label}
    </button>
  );
}
