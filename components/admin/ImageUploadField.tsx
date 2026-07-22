'use client';

import { useState } from 'react';
import Image from 'next/image';
import { compressImageFile } from '@/lib/client-image-compressor';

interface ImageUploadFieldProps {
  label?: string;
  value: string;
  onChange: (url: string) => void;
  altValue?: string;
  onAltChange?: (alt: string) => void;
  folder?: string;
  placeholder?: string;
  className?: string;
}

export default function ImageUploadField({
  label,
  value,
  onChange,
  altValue,
  onAltChange,
  folder = 'design-guide',
  placeholder = 'https://... or click Upload Image',
  className,
}: ImageUploadFieldProps) {
  const [isCompressing, setIsCompressing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setErrorMsg('');
    setStatusMsg('');

    try {
      // 1. Compress image client-side (max 500KB, max 2400px)
      setIsCompressing(true);
      const origMB = (selectedFile.size / (1024 * 1024)).toFixed(1);
      setStatusMsg(`Compressing image (${origMB} MB)...`);

      const result = await compressImageFile(selectedFile, 500, 2400);
      const compKB = Math.round(result.compressedSize / 1024);
      setStatusMsg(`Uploading compressed image (${compKB} KB, saved ${result.compressionRatio})...`);

      setIsCompressing(false);
      setIsUploading(true);

      // 2. Upload compressed file to /api/admin/upload
      const formData = new FormData();
      formData.append('file', result.file);
      formData.append('folder', folder);
      if (altValue) formData.append('altText', altValue);

      const response = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({ error: 'Upload failed' }));
        throw new Error(err.error || 'Upload failed');
      }

      const data = await response.json();
      if (data.url) {
        onChange(data.url);
        if (data.altText && onAltChange) {
          onAltChange(data.altText);
        }
        setStatusMsg('Image uploaded and updated!');
        setTimeout(() => setStatusMsg(''), 4000);
      }
    } catch (err: any) {
      console.error('Image upload error:', err);
      setErrorMsg(err.message || 'Failed to process and upload image.');
    } finally {
      setIsCompressing(false);
      setIsUploading(false);
      // Reset input
      e.target.value = '';
    }
  };

  return (
    <div style={{ marginBottom: '1rem' }} className={className}>
      {label && (
        <label style={{ display: 'block', marginBottom: '0.35rem', fontWeight: 600, fontSize: '0.85rem', color: 'var(--sbd-brown)' }}>
          {label}
        </label>
      )}

      <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
        {/* Thumbnail Preview */}
        {value ? (
          <div style={{ position: 'relative', width: '80px', height: '60px', borderRadius: '6px', overflow: 'hidden', border: '1px solid var(--warm-grey-1)', flexShrink: 0, background: '#f5f5f5' }}>
            <Image
              src={value}
              alt={altValue || 'Thumbnail'}
              fill
              style={{ objectFit: 'cover' }}
              sizes="80px"
              unoptimized={value.startsWith('data:') || value.startsWith('/files')}
            />
          </div>
        ) : (
          <div style={{ width: '80px', height: '60px', borderRadius: '6px', border: '1px dashed var(--warm-grey-3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', color: 'var(--text-muted)', flexShrink: 0 }}>
            No image
          </div>
        )}

        {/* Inputs & Upload button */}
        <div style={{ flex: 1, minWidth: '220px', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <input
              type="text"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder={placeholder}
              style={{ flex: 1, padding: '0.5rem 0.75rem', fontSize: '14px', border: '1px solid var(--warm-grey-3)', borderRadius: '4px', fontFamily: 'inherit' }}
            />

            <label style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0.5rem 1rem',
              background: 'var(--sbd-gold)',
              color: '#fff',
              borderRadius: '4px',
              cursor: isCompressing || isUploading ? 'not-allowed' : 'pointer',
              fontWeight: 600,
              fontSize: '13px',
              whiteSpace: 'nowrap',
              opacity: isCompressing || isUploading ? 0.7 : 1,
              transition: 'opacity 200ms ease',
              margin: 0,
            }}>
              {isCompressing ? 'Compressing...' : isUploading ? 'Uploading...' : 'Upload Image'}
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                disabled={isCompressing || isUploading}
                style={{ display: 'none' }}
              />
            </label>
          </div>

          {/* Alt text field if requested */}
          {onAltChange !== undefined && (
            <input
              type="text"
              value={altValue || ''}
              onChange={(e) => onAltChange(e.target.value)}
              placeholder="Image Alt Text (SEO)"
              style={{ width: '100%', padding: '0.4rem 0.75rem', fontSize: '13px', border: '1px solid var(--warm-grey-1)', borderRadius: '4px', color: 'var(--text-muted)' }}
            />
          )}

          {/* Status feedback */}
          {statusMsg && (
            <div style={{ fontSize: '12px', color: '#155724', background: '#d4edda', padding: '0.25rem 0.5rem', borderRadius: '4px' }}>
              {statusMsg}
            </div>
          )}

          {errorMsg && (
            <div style={{ fontSize: '12px', color: '#721c24', background: '#f8d7da', padding: '0.25rem 0.5rem', borderRadius: '4px' }}>
              {errorMsg}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
