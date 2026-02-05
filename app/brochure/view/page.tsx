'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import * as pdfjsLib from 'pdfjs-dist';
import styles from './page.module.css';

// Set up PDF.js worker
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
}

interface PageSize {
  width: number;
  height: number;
  scale: number;
}

export default function BrochureViewer() {
  const router = useRouter();
  const [pdfDoc, setPdfDoc] = useState<pdfjsLib.PDFDocumentProxy | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pageSize, setPageSize] = useState<PageSize>({ width: 0, height: 0, scale: 1 });
  const [isMobile, setIsMobile] = useState(false);
  
  const leftCanvasRef = useRef<HTMLCanvasElement>(null);
  const rightCanvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Check if mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 769);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Calculate page size based on viewport
  const calculatePageSize = useCallback(() => {
    if (!pdfDoc || !containerRef.current) return;

    const container = containerRef.current;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const isMobileView = viewportWidth < 769;

    if (isMobileView) {
      // Mobile: Single page fills entire viewport
      const page = pdfDoc.getPage(1);
      page.then((p) => {
        const viewport = p.getViewport({ scale: 1 });
        const scale = Math.min(
          viewportWidth / viewport.width,
          viewportHeight / viewport.height
        );
        setPageSize({
          width: viewport.width * scale,
          height: viewport.height * scale,
          scale,
        });
      });
    } else {
      // Desktop: Two pages side-by-side
      const padding = 40;
      const gap = 20;
      const containerWidth = viewportWidth - padding * 2;
      const containerHeight = viewportHeight - padding * 2;
      const pageWidth = (containerWidth - gap) / 2;
      const pageHeight = containerHeight;

      const page = pdfDoc.getPage(1);
      page.then((p) => {
        const viewport = p.getViewport({ scale: 1 });
        const scale = Math.min(
          pageWidth / viewport.width,
          pageHeight / viewport.height
        );
        setPageSize({
          width: viewport.width * scale,
          height: viewport.height * scale,
          scale,
        });
      });
    }
  }, [pdfDoc]);

  // Load PDF
  useEffect(() => {
    const loadPDF = async () => {
      try {
        setLoading(true);
        setError(null);
        const loadingTask = pdfjsLib.getDocument('/files/SBD Interactive Brochure.pdf');
        const pdf = await loadingTask.promise;
        setPdfDoc(pdf);
        setTotalPages(pdf.numPages);
      } catch (err) {
        console.error('Error loading PDF:', err);
        setError('Failed to load PDF. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    loadPDF();
  }, []);

  // Recalculate page size when PDF loads or window resizes
  useEffect(() => {
    if (pdfDoc) {
      calculatePageSize();
      window.addEventListener('resize', calculatePageSize);
      return () => window.removeEventListener('resize', calculatePageSize);
    }
  }, [pdfDoc, calculatePageSize]);

  // Render page to canvas
  const renderPage = useCallback(async (pageNum: number, canvas: HTMLCanvasElement) => {
    if (!pdfDoc || !canvas) return;

    try {
      const page = await pdfDoc.getPage(pageNum);
      const viewport = page.getViewport({ scale: pageSize.scale });
      
      canvas.width = viewport.width;
      canvas.height = viewport.height;

      const context = canvas.getContext('2d');
      if (!context) return;

      const renderContext = {
        canvasContext: context,
        viewport: viewport,
      };

      await page.render(renderContext).promise;
    } catch (err) {
      console.error('Error rendering page:', err);
    }
  }, [pdfDoc, pageSize.scale]);

  // Render pages when current page or page size changes
  useEffect(() => {
    if (!pdfDoc || pageSize.width === 0) return;

    if (isMobile) {
      // Mobile: Render single page
      if (leftCanvasRef.current) {
        renderPage(currentPage, leftCanvasRef.current);
      }
    } else {
      // Desktop: Render two pages side-by-side
      if (leftCanvasRef.current) {
        renderPage(currentPage, leftCanvasRef.current);
      }
      if (rightCanvasRef.current && currentPage < totalPages) {
        renderPage(currentPage + 1, rightCanvasRef.current);
      }
    }
  }, [pdfDoc, currentPage, pageSize, isMobile, totalPages, renderPage]);

  // Navigation handlers
  const goToPage = useCallback((pageNum: number) => {
    if (pageNum >= 1 && pageNum <= totalPages) {
      setCurrentPage(pageNum);
    }
  }, [totalPages]);

  const nextPage = useCallback(() => {
    if (isMobile) {
      goToPage(currentPage + 1);
    } else {
      // Desktop: Move forward by 2 pages (show next pair)
      const nextStartPage = currentPage + 2;
      goToPage(Math.min(nextStartPage, totalPages));
    }
  }, [currentPage, totalPages, isMobile, goToPage]);

  const prevPage = useCallback(() => {
    if (isMobile) {
      goToPage(currentPage - 1);
    } else {
      // Desktop: Move back by 2 pages (show previous pair)
      const prevStartPage = Math.max(currentPage - 2, 1);
      goToPage(prevStartPage);
    }
  }, [currentPage, isMobile, goToPage]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        router.back();
      } else if (e.key === 'ArrowLeft') {
        prevPage();
      } else if (e.key === 'ArrowRight') {
        nextPage();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [router, prevPage, nextPage]);

  // Prevent body scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  const handleClose = () => {
    router.back();
  };

  if (loading) {
    return (
      <div className={styles.viewerContainer}>
        <div className={styles.loadingContainer}>
          <div className={styles.loader}></div>
          <p className={styles.loadingText}>Loading brochure...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.viewerContainer}>
        <div className={styles.errorContainer}>
          <p className={styles.errorText}>{error}</p>
          <button className={styles.retryButton} onClick={() => window.location.reload()}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  const canGoPrev = currentPage > 1;
  const canGoNext = isMobile 
    ? currentPage < totalPages 
    : currentPage + 1 < totalPages;

  return (
    <div className={styles.viewerContainer} ref={containerRef}>
      <button className={styles.closeButton} onClick={handleClose} aria-label="Close PDF viewer">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

      <div className={styles.pagesContainer}>
        {isMobile ? (
          <div className={styles.pageWrapper}>
            <canvas ref={leftCanvasRef} className={styles.pageCanvas} />
          </div>
        ) : (
          <>
            <div className={styles.pageWrapper}>
              <canvas ref={leftCanvasRef} className={styles.pageCanvas} />
            </div>
            {currentPage < totalPages && (
              <div className={styles.pageWrapper}>
                <canvas ref={rightCanvasRef} className={styles.pageCanvas} />
              </div>
            )}
          </>
        )}
      </div>

      <div className={styles.navigation}>
        <button
          className={`${styles.navButton} ${styles.navButtonPrev}`}
          onClick={prevPage}
          disabled={!canGoPrev}
          aria-label="Previous page"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>

        <div className={styles.pageIndicator}>
          {isMobile ? (
            <span>{currentPage} / {totalPages}</span>
          ) : (
            <span>
              {currentPage}-{Math.min(currentPage + 1, totalPages)} / {totalPages}
            </span>
          )}
        </div>

        <button
          className={`${styles.navButton} ${styles.navButtonNext}`}
          onClick={nextPage}
          disabled={!canGoNext}
          aria-label="Next page"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>
    </div>
  );
}
