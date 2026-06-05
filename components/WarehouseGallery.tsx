'use client';

import { useState } from 'react';
import SeoImage from '@/components/SeoImage';
import ImageLightbox from './ImageLightbox';
import { STATIC_IMAGES, warehouseAlt } from '@/lib/image-seo';
import styles from '../app/senior-living-design-firm/page.module.css';

const warehouseImages = [2, 3, 4, 5, 6].map((i) => ({
  src: STATIC_IMAGES.warehouse(i),
  alt: warehouseAlt(i),
}));

export default function WarehouseGallery() {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedAlt, setSelectedAlt] = useState<string>('');

  const openLightbox = (src: string, alt: string) => {
    setSelectedImage(src);
    setSelectedAlt(alt);
  };

  const closeLightbox = () => {
    setSelectedImage(null);
    setSelectedAlt('');
  };

  return (
    <>
      <div className={styles.galleryGrid}>
        {warehouseImages.map((image, index) => (
          <div
            key={index}
            className={styles.galleryItem}
            onClick={() => openLightbox(image.src, image.alt)}
            style={{ cursor: 'pointer' }}
          >
            <SeoImage
              src={image.src}
              alt={image.alt}
              fill
              className={styles.galleryImage}
              sizes="(max-width: 768px) 100vw, (max-width: 968px) 50vw, 50vw"
            />
          </div>
        ))}
      </div>

      {selectedImage && (
        <ImageLightbox
          isOpen={!!selectedImage}
          imageSrc={selectedImage}
          imageAlt={selectedAlt}
          onClose={closeLightbox}
        />
      )}
    </>
  );
}
