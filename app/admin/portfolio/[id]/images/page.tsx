'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';

interface PortfolioImage {
  url: string;
  displayName: string;
  altText: string;
}

interface PortfolioCategory {
  _id?: string;
  slug: string;
  name: string;
  images: PortfolioImage[];
}

export default function PortfolioImageManagement() {
  const params = useParams();
  const router = useRouter();
  const categoryId = params.id as string;
  
  const [category, setCategory] = useState<PortfolioCategory | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [currentImageDisplayName, setCurrentImageDisplayName] = useState('');
  const [currentImageAltText, setCurrentImageAltText] = useState('');
  const [editingImage, setEditingImage] = useState<PortfolioImage | null>(null);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  const fetchCategory = async () => {
    try {
      const response = await fetch(`/api/admin/portfolio/${categoryId}`);
      if (response.ok) {
        const data = await response.json();
        // Handle backward compatibility
        let normalizedImages: PortfolioImage[] = [];
        if (Array.isArray(data.images) && data.images.length > 0) {
          if (typeof data.images[0] === 'string') {
            normalizedImages = (data.images as string[]).map((url: string) => ({ url, displayName: '', altText: '' }));
          } else {
            normalizedImages = data.images as PortfolioImage[];
          }
        }
        setCategory({ ...data, images: normalizedImages });
      }
    } catch (error) {
      console.error('Error fetching category:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !category) return;

    setUploadingImage(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', 'portfolio');

    try {
      const response = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        const newImage: PortfolioImage = {
          url: data.url,
          displayName: currentImageDisplayName.trim() || file.name.replace(/\.[^/.]+$/, ''),
          altText: currentImageAltText.trim(),
        };
        
        const updatedImages = [...category.images, newImage];
        await updateCategoryImages(updatedImages);
        
        setCurrentImageDisplayName('');
        setCurrentImageAltText('');
        e.target.value = '';
      } else {
        alert('Failed to upload image');
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Error uploading image');
    } finally {
      setUploadingImage(false);
    }
  };

  const updateCategoryImages = async (images: PortfolioImage[]) => {
    if (!category) return;
    
    try {
      const response = await fetch(`/api/admin/portfolio/${categoryId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug: category.slug,
          name: category.name,
          images: images,
        }),
      });

      if (response.ok) {
        setCategory({ ...category, images });
        setEditingImage(null);
        setEditingIndex(null);
      } else {
        alert('Failed to update images');
      }
    } catch (error) {
      console.error('Error updating images:', error);
      alert('Error updating images');
    }
  };

  const handleDeleteImage = async (index: number) => {
    if (!category || !confirm('Are you sure you want to delete this image?')) return;
    
    const updatedImages = category.images.filter((_, i) => i !== index);
    await updateCategoryImages(updatedImages);
  };

  const handleUpdateImage = async () => {
    if (!category || editingIndex === null || !editingImage) return;
    
    const updatedImages = [...category.images];
    updatedImages[editingIndex] = editingImage;
    await updateCategoryImages(updatedImages);
  };

  const handleMoveImage = async (index: number, direction: 'up' | 'down') => {
    if (!category) return;
    
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= category.images.length) return;
    
    const updatedImages = [...category.images];
    [updatedImages[index], updatedImages[newIndex]] = [updatedImages[newIndex], updatedImages[index]];
    await updateCategoryImages(updatedImages);
  };

  if (isLoading) {
    return <div className="admin-page"><p>Loading...</p></div>;
  }

  if (!category) {
    return <div className="admin-page"><p>Category not found</p></div>;
  }

  return (
    <div className="admin-page">
      <div className="admin-header">
        <div>
          <Link href="/admin/portfolio" className="back-link">← Back to Portfolio</Link>
          <h1>Manage Images: {category.name}</h1>
        </div>
      </div>

      <div className="image-management-section">
        <div className="upload-section">
          <h2>Upload New Image</h2>
          <div className="upload-form">
            <div className="form-group">
              <label htmlFor="imageDisplayName">Image Name</label>
              <input
                type="text"
                id="imageDisplayName"
                value={currentImageDisplayName}
                onChange={(e) => setCurrentImageDisplayName(e.target.value)}
                placeholder="Image display name"
              />
            </div>
            <div className="form-group">
              <label htmlFor="imageAltText">Alt Text</label>
              <input
                type="text"
                id="imageAltText"
                value={currentImageAltText}
                onChange={(e) => setCurrentImageAltText(e.target.value)}
                placeholder="Image description for accessibility"
              />
            </div>
            <div className="form-group">
              <input
                type="file"
                id="imageUpload"
                accept="image/*"
                onChange={handleImageUpload}
                disabled={uploadingImage}
              />
              {uploadingImage && <p className="upload-status">Uploading...</p>}
            </div>
          </div>
        </div>

        <div className="images-grid-section">
          <h2>Images ({category.images.length})</h2>
          {category.images.length === 0 ? (
            <p className="empty-state">No images yet. Upload your first image above.</p>
          ) : (
            <div className="images-grid">
              {category.images.map((img, index) => (
                <div key={index} className="image-card">
                  <div className="image-preview">
                    <Image
                      src={img.url}
                      alt={img.altText || img.displayName || 'Portfolio image'}
                      width={300}
                      height={200}
                      className="preview-image"
                      unoptimized={img.url.startsWith('http')}
                    />
                    <div className="image-order">
                      <span>#{index + 1}</span>
                    </div>
                  </div>
                  
                  {editingIndex === index ? (
                    <div className="image-edit-form">
                      <div className="form-group">
                        <label>Display Name</label>
                        <input
                          type="text"
                          value={editingImage?.displayName || ''}
                          onChange={(e) => setEditingImage({ ...editingImage!, displayName: e.target.value })}
                        />
                      </div>
                      <div className="form-group">
                        <label>Alt Text</label>
                        <textarea
                          value={editingImage?.altText || ''}
                          onChange={(e) => setEditingImage({ ...editingImage!, altText: e.target.value })}
                          rows={3}
                        />
                      </div>
                      <div className="form-actions">
                        <button onClick={handleUpdateImage} className="btn">Save</button>
                        <button onClick={() => { setEditingImage(null); setEditingIndex(null); }} className="btn-secondary">
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="image-info">
                      <h3>{img.displayName || 'Untitled Image'}</h3>
                      <p className="image-alt">{img.altText || <em>No alt text</em>}</p>
                      <div className="image-actions">
                        <button onClick={() => handleMoveImage(index, 'up')} disabled={index === 0} className="btn-small">
                          ↑ Move Up
                        </button>
                        <button onClick={() => handleMoveImage(index, 'down')} disabled={index === category.images.length - 1} className="btn-small">
                          ↓ Move Down
                        </button>
                        <button onClick={() => { setEditingImage({ ...img }); setEditingIndex(index); }} className="btn-small">
                          Edit
                        </button>
                        <button onClick={() => handleDeleteImage(index)} className="btn-small btn-danger">
                          Delete
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .admin-header {
          margin-bottom: var(--spacing-lg);
        }

        .back-link {
          display: inline-block;
          margin-bottom: var(--spacing-sm);
          color: var(--sbd-brown);
          text-decoration: none;
          font-weight: 500;
        }

        .back-link:hover {
          color: var(--sbd-gold);
        }

        .image-management-section {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-xl);
        }

        .upload-section {
          background: #fff;
          padding: var(--spacing-lg);
          border-radius: 8px;
          border: 1px solid var(--warm-grey-3);
        }

        .upload-section h2 {
          margin-bottom: var(--spacing-md);
        }

        .upload-form {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: var(--spacing-md);
        }

        .form-group {
          margin-bottom: var(--spacing-md);
        }

        .form-group label {
          display: block;
          margin-bottom: 0.5rem;
          font-weight: 500;
        }

        .form-group input,
        .form-group textarea {
          width: 100%;
          padding: 0.75rem;
          border: 1px solid var(--warm-grey-3);
          border-radius: 4px;
          font-family: inherit;
        }

        .upload-status {
          color: var(--sbd-brown);
          margin-top: 0.5rem;
        }

        .images-grid-section h2 {
          margin-bottom: var(--spacing-md);
        }

        .empty-state {
          text-align: center;
          color: var(--warm-grey-3);
          padding: var(--spacing-xl);
        }

        .images-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
          gap: var(--spacing-lg);
        }

        .image-card {
          background: #fff;
          border: 1px solid var(--warm-grey-3);
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .image-preview {
          position: relative;
          width: 100%;
          height: 250px;
          background: var(--warm-grey-1);
          overflow: hidden;
        }

        .preview-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .image-order {
          position: absolute;
          top: 0.5rem;
          right: 0.5rem;
          background: rgba(0, 0, 0, 0.7);
          color: #fff;
          padding: 0.25rem 0.75rem;
          border-radius: 4px;
          font-weight: 600;
        }

        .image-info {
          padding: var(--spacing-md);
        }

        .image-info h3 {
          font-size: 18px;
          font-weight: 600;
          color: var(--sbd-brown);
          margin-bottom: var(--spacing-xs);
        }

        .image-alt {
          font-size: 14px;
          color: var(--warm-grey-3);
          margin-bottom: var(--spacing-md);
          min-height: 40px;
        }

        .image-alt em {
          font-style: italic;
        }

        .image-actions {
          display: flex;
          flex-wrap: wrap;
          gap: var(--spacing-xs);
        }

        .image-edit-form {
          padding: var(--spacing-md);
        }

        .form-actions {
          display: flex;
          gap: var(--spacing-sm);
          margin-top: var(--spacing-md);
        }

        .btn {
          padding: 0.75rem 1.5rem;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 16px;
          font-weight: 500;
          transition: all 0.3s ease;
          background-color: var(--sbd-gold);
          color: #fff;
        }

        .btn:hover:not(:disabled) {
          background-color: var(--sbd-brown);
        }

        .btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .btn-secondary {
          background-color: transparent;
          border: 2px solid var(--sbd-gold);
          color: var(--sbd-brown);
        }

        .btn-secondary:hover {
          background-color: var(--sbd-gold);
          color: #fff;
        }

        .btn-small {
          padding: 0.5rem 1rem;
          font-size: 14px;
        }

        .btn-danger {
          background: #dc3545;
        }

        .btn-danger:hover:not(:disabled) {
          background: #c82333;
        }

        @media (max-width: 768px) {
          .upload-form {
            grid-template-columns: 1fr;
          }

          .images-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
