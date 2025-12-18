'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';

interface PortfolioImage {
  url: string;
  displayName: string;
  altText: string;
}

export default function PortfolioDetailPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [images, setImages] = useState<PortfolioImage[]>([]);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [imageAlts, setImageAlts] = useState<string[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [categoryName, setCategoryName] = useState<string>('');

  useEffect(() => {
    const fetchCategory = async () => {
      try {
        const response = await fetch(`/api/portfolio/${slug}`);
        if (response.ok) {
          const category = await response.json();
          setCategoryName(category.name || '');
          
          // Handle both old format (string[]) and new format (PortfolioImage[])
          if (category.images && category.images.length > 0) {
            if (typeof category.images[0] === 'string') {
              // Old format: string[]
              setImageUrls(category.images);
              setImageAlts(category.images.map((_: string, i: number) => `${category.name} image ${i + 1}`));
            } else {
              // New format: PortfolioImage[]
              setImages(category.images);
              setImageUrls(category.images.map((img: PortfolioImage) => img.url));
              setImageAlts(category.images.map((img: PortfolioImage) => img.altText || img.displayName));
            }
          }
        }
      } catch (error) {
        console.error('Error fetching category:', error);
      }
    };
    
    if (slug) {
      fetchCategory();
    }
  }, [slug]);

  const openFullscreen = (index: number) => {
    setCurrentImageIndex(index);
    setIsFullscreen(true);
  };

  const closeFullscreen = () => {
    setIsFullscreen(false);
  };

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % imageUrls.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + imageUrls.length) % imageUrls.length);
  };

  return (
    <>
      <section className="portfolio-detail section-padding">
        <div className="container">
          <div className="back-link-container">
            <Link href="/portfolio" className="back-link">
              ← Back to Portfolio
            </Link>
          </div>

          {imageUrls.length > 0 ? (
            <div className="portfolio-gallery">
              <div className="gallery-thumbnails">
                {imageUrls.map((imageUrl, index) => (
                  <div
                    key={index}
                    className="thumbnail"
                    onClick={() => openFullscreen(index)}
                  >
                    <Image
                      src={imageUrl}
                      alt={imageAlts[index] || `Portfolio image ${index + 1}`}
                      width={200}
                      height={150}
                    />
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="no-images">
              <p>No images available for this portfolio category.</p>
            </div>
          )}
        </div>
      </section>

      {isFullscreen && imageUrls.length > 0 && (
        <div className="fullscreen-overlay" onClick={closeFullscreen}>
          <button className="close-btn" onClick={closeFullscreen}>
            ×
          </button>
          <button className="nav-btn prev-btn" onClick={(e) => { e.stopPropagation(); prevImage(); }}>
            ‹
          </button>
          <div className="fullscreen-image" onClick={(e) => e.stopPropagation()}>
            <Image
              src={imageUrls[currentImageIndex]}
              alt={imageAlts[currentImageIndex] || `Portfolio image ${currentImageIndex + 1}`}
              width={1200}
              height={800}
            />
          </div>
          <button className="nav-btn next-btn" onClick={(e) => { e.stopPropagation(); nextImage(); }}>
            ›
          </button>
        </div>
      )}

      <style jsx>{`
        .back-link-container {
          margin-bottom: var(--spacing-lg);
        }

        .back-link {
          color: var(--sbd-brown);
          font-weight: 500;
        }

        .portfolio-gallery {
          width: 100%;
        }

        .gallery-thumbnails {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
          gap: var(--spacing-md);
        }

        .thumbnail {
          cursor: pointer;
          border-radius: 8px;
          overflow: hidden;
          transition: transform 0.3s ease;
        }

        .thumbnail:hover {
          transform: scale(1.05);
        }

        .thumbnail img {
          width: 100%;
          height: auto;
        }

        .no-images {
          text-align: center;
          padding: var(--spacing-xl);
          color: var(--warm-grey-3);
        }

        .fullscreen-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.95);
          z-index: 9999;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
        }

        .close-btn {
          position: absolute;
          top: 2rem;
          right: 2rem;
          background: none;
          border: none;
          color: #fff;
          font-size: 48px;
          cursor: pointer;
          z-index: 10000;
          width: 50px;
          height: 50px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .nav-btn {
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          background: rgba(255, 255, 255, 0.2);
          border: none;
          color: #fff;
          font-size: 48px;
          cursor: pointer;
          width: 60px;
          height: 60px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          transition: background 0.3s ease;
        }

        .nav-btn:hover {
          background: rgba(255, 255, 255, 0.3);
        }

        .prev-btn {
          left: 2rem;
        }

        .next-btn {
          right: 2rem;
        }

        .fullscreen-image {
          max-width: 90%;
          max-height: 90%;
          cursor: default;
        }

        .fullscreen-image img {
          width: 100%;
          height: auto;
          max-height: 90vh;
          object-fit: contain;
        }

        @media (max-width: 768px) {
          .gallery-thumbnails {
            grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
          }

          .nav-btn {
            width: 40px;
            height: 40px;
            font-size: 32px;
          }

          .prev-btn {
            left: 1rem;
          }

          .next-btn {
            right: 1rem;
          }
        }
      `}</style>
    </>
  );
}




