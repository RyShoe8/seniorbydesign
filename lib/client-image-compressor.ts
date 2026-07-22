/**
 * Client-Side Image Compression Engine
 * Accepts image files up to 25MB+, resizes large dimensions (max 2400px),
 * and compresses quality so output file size is <= targetMaxKB (default 500KB)
 * while preserving maximum visual quality.
 */

export interface CompressionResult {
  file: File;
  originalSize: number;
  compressedSize: number;
  width: number;
  height: number;
  compressionRatio: string;
}

export async function compressImageFile(
  file: File,
  targetMaxKB: number = 500,
  maxDimension: number = 2400
): Promise<CompressionResult> {
  const targetMaxBytes = targetMaxKB * 1024;
  const originalSize = file.size;

  // Don't compress non-image files or SVGs
  if (!file.type.startsWith('image/') || file.type.includes('svg')) {
    return {
      file,
      originalSize,
      compressedSize: originalSize,
      width: 0,
      height: 0,
      compressionRatio: '0%',
    };
  }

  // If file is already smaller than targetMaxBytes and small in dimensions, pass-through
  if (originalSize <= targetMaxBytes && file.type === 'image/jpeg') {
    return {
      file,
      originalSize,
      compressedSize: originalSize,
      width: 0,
      height: 0,
      compressionRatio: '0%',
    };
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = async () => {
      URL.revokeObjectURL(objectUrl);

      let width = img.width;
      let height = img.height;

      // Scale down dimensions if greater than maxDimension
      if (width > maxDimension || height > maxDimension) {
        if (width > height) {
          height = Math.round((height * maxDimension) / width);
          width = maxDimension;
        } else {
          width = Math.round((width * maxDimension) / height);
          height = maxDimension;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        return resolve({
          file,
          originalSize,
          compressedSize: originalSize,
          width: img.width,
          height: img.height,
          compressionRatio: '0%',
        });
      }

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, width, height);

      // Quality iteration loop to get under targetMaxBytes
      let quality = 0.88;
      let blob: Blob | null = null;
      let attempts = 0;

      while (attempts < 6) {
        blob = await new Promise<Blob | null>((res) =>
          canvas.toBlob(res, 'image/jpeg', quality)
        );

        if (!blob) break;

        if (blob.size <= targetMaxBytes || quality <= 0.55) {
          break;
        }

        // Adjust quality based on current size ratio
        const sizeRatio = targetMaxBytes / blob.size;
        quality = Math.max(0.55, quality * Math.min(0.85, Math.sqrt(sizeRatio)));
        attempts++;
      }

      if (!blob) {
        return resolve({
          file,
          originalSize,
          compressedSize: originalSize,
          width,
          height,
          compressionRatio: '0%',
        });
      }

      // Format clean filename with .jpg extension
      const baseName = file.name.replace(/\.[^/.]+$/, '');
      const compressedFile = new File([blob], `${baseName}.jpg`, {
        type: 'image/jpeg',
        lastModified: Date.now(),
      });

      const savings = Math.max(0, originalSize - blob.size);
      const compressionRatio = `${Math.round((savings / originalSize) * 100)}%`;

      resolve({
        file: compressedFile,
        originalSize,
        compressedSize: blob.size,
        width,
        height,
        compressionRatio,
      });
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve({
        file,
        originalSize,
        compressedSize: originalSize,
        width: 0,
        height: 0,
        compressionRatio: '0%',
      });
    };

    img.src = objectUrl;
  });
}
