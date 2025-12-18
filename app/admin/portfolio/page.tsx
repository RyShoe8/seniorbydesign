'use client';

import { useState, useEffect } from 'react';
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

export default function PortfolioManagement() {
  const [categories, setCategories] = useState<PortfolioCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingCategory, setEditingCategory] = useState<PortfolioCategory | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [portfolioImages, setPortfolioImages] = useState<PortfolioImage[]>([]);
  const [currentImageDisplayName, setCurrentImageDisplayName] = useState('');
  const [currentImageAltText, setCurrentImageAltText] = useState('');

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/admin/portfolio');
      const data = await response.json();
      // Handle backward compatibility: convert string[] to PortfolioImage[]
      const normalizedData = data.map((cat: any) => {
        let normalizedImages: PortfolioImage[] = [];
        if (Array.isArray(cat.images) && cat.images.length > 0) {
          if (typeof cat.images[0] === 'string') {
            // Old format: string[]
            normalizedImages = (cat.images as string[]).map((url: string) => ({ url, displayName: '', altText: '' }));
          } else {
            // New format: PortfolioImage[]
            normalizedImages = cat.images as PortfolioImage[];
          }
        }
        return {
          ...cat,
          images: normalizedImages
        };
      });
      setCategories(normalizedData);
    } catch (error) {
      console.error('Error fetching categories:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this category?')) return;
    
    try {
      const response = await fetch(`/api/admin/portfolio/${id}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        fetchCategories();
      }
    } catch (error) {
      console.error('Error deleting category:', error);
    }
  };

  const handleEdit = (category: PortfolioCategory) => {
    setEditingCategory(category);
    // Handle backward compatibility
    let normalizedImages: PortfolioImage[] = [];
    if (Array.isArray(category.images) && category.images.length > 0) {
      if (typeof category.images[0] === 'string') {
        // Old format: string[]
        normalizedImages = (category.images as string[]).map((url: string) => ({ url, displayName: '', altText: '' }));
      } else {
        // New format: PortfolioImage[]
        normalizedImages = category.images as PortfolioImage[];
      }
    }
    setPortfolioImages(normalizedImages);
    setShowForm(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!currentImageDisplayName.trim() || !currentImageAltText.trim()) {
      alert('Please enter both Image Name and Alt Text before uploading');
      return;
    }

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
          displayName: currentImageDisplayName.trim(),
          altText: currentImageAltText.trim(),
        };
        setPortfolioImages([...portfolioImages, newImage]);
        setCurrentImageDisplayName('');
        setCurrentImageAltText('');
        // Reset file input
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

  const removeImage = (index: number) => {
    setPortfolioImages(portfolioImages.filter((_, i) => i !== index));
  };

  const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    if (portfolioImages.length === 0) {
      alert('Please add at least one image');
      return;
    }

    const data = {
      slug: formData.get('slug') as string,
      name: formData.get('name') as string,
      images: portfolioImages,
    };

    try {
      const url = editingCategory?._id 
        ? `/api/admin/portfolio/${editingCategory._id}`
        : '/api/admin/portfolio';
      
      const response = await fetch(url, {
        method: editingCategory?._id ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        fetchCategories();
        setShowForm(false);
        setEditingCategory(null);
        setPortfolioImages([]);
        setCurrentImageDisplayName('');
        setCurrentImageAltText('');
        (e.target as HTMLFormElement).reset();
      }
    } catch (error) {
      console.error('Error saving category:', error);
    }
  };

  return (
    <div className="admin-page">
      <div className="admin-header">
        <h1>Portfolio Management</h1>
        <button onClick={() => { 
          setShowForm(true); 
          setEditingCategory(null);
          setPortfolioImages([]);
          setCurrentImageDisplayName('');
          setCurrentImageAltText('');
        }} className="btn">
          Add Category
        </button>
      </div>

      {showForm && (
        <div className="admin-form-modal">
          <div className="admin-form-content">
            <h2>{editingCategory ? 'Edit' : 'Add'} Portfolio Category</h2>
            <form onSubmit={handleFormSubmit}>
              <div className="form-group">
                <label htmlFor="name">Category Name *</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  required
                  defaultValue={editingCategory?.name || ''}
                />
              </div>
              <div className="form-group">
                <label htmlFor="slug">Slug *</label>
                <input
                  type="text"
                  id="slug"
                  name="slug"
                  required
                  defaultValue={editingCategory?.slug || ''}
                  placeholder="active-adult-55"
                />
              </div>
              <div className="form-group">
                <label>Images *</label>
                <div className="image-upload-section">
                  <div className="image-upload-form">
                    <div className="form-group" style={{ marginBottom: '0.5rem' }}>
                      <label htmlFor="imageDisplayName">Image Name *</label>
                      <input
                        type="text"
                        id="imageDisplayName"
                        value={currentImageDisplayName}
                        onChange={(e) => setCurrentImageDisplayName(e.target.value)}
                        placeholder="Image display name"
                        required
                      />
                    </div>
                    <div className="form-group" style={{ marginBottom: '0.5rem' }}>
                      <label htmlFor="imageAltText">Alt Text *</label>
                      <input
                        type="text"
                        id="imageAltText"
                        value={currentImageAltText}
                        onChange={(e) => setCurrentImageAltText(e.target.value)}
                        placeholder="Image description for accessibility"
                        required
                      />
                    </div>
                    <div className="form-group">
                      <input
                        type="file"
                        id="imageUpload"
                        accept="image/*"
                        onChange={handleImageUpload}
                        disabled={uploadingImage || !currentImageDisplayName.trim() || !currentImageAltText.trim()}
                      />
                      {uploadingImage && <p className="upload-status">Uploading...</p>}
                    </div>
                  </div>
                  {portfolioImages.length > 0 && (
                    <div className="uploaded-images">
                      <p style={{ marginTop: '1rem', marginBottom: '0.5rem', fontWeight: 600 }}>Uploaded Images:</p>
                      <div className="images-list">
                        {portfolioImages.map((img, index) => (
                          <div key={index} className="image-item">
                            <img src={img.url} alt={img.altText || 'Preview'} className="preview-image-small" />
                            <div className="image-info">
                              <div><strong>Name:</strong> {img.displayName}</div>
                              <div><strong>Alt:</strong> {img.altText}</div>
                            </div>
                            <button
                              type="button"
                              className="btn-small btn-danger"
                              onClick={() => removeImage(index)}
                            >
                              Remove
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div className="form-actions">
                <button type="submit" className="btn">Save</button>
                <button type="button" className="btn-secondary" onClick={() => { 
                  setShowForm(false); 
                  setEditingCategory(null);
                  setPortfolioImages([]);
                  setCurrentImageDisplayName('');
                  setCurrentImageAltText('');
                }}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isLoading ? (
        <p>Loading...</p>
      ) : (
        <div className="admin-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Slug</th>
                <th>Images</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((category) => (
                <tr key={category._id}>
                  <td>{category.name}</td>
                  <td>{category.slug}</td>
                  <td>{category.images?.length || 0}</td>
                  <td>
                    <button onClick={() => handleEdit(category)} className="btn-small">Edit</button>
                    <button onClick={() => category._id && handleDelete(category._id)} className="btn-small btn-danger">
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <style jsx>{`
        .admin-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: var(--spacing-lg);
        }

        .admin-form-modal {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }

        .admin-form-content {
          background: #fff;
          padding: var(--spacing-xl);
          border-radius: 8px;
          max-width: 800px;
          width: 90%;
          max-height: 90vh;
          overflow-y: auto;
        }

        .admin-form-content h2 {
          margin-bottom: var(--spacing-md);
        }

        .form-group {
          margin-bottom: var(--spacing-md);
        }

        .form-group label {
          display: block;
          margin-bottom: 0.5rem;
        }

        .form-group input,
        .form-group textarea {
          width: 100%;
          padding: 0.75rem;
          border: 1px solid var(--warm-grey-3);
          border-radius: 4px;
        }

        .image-upload-section {
          border: 1px solid var(--warm-grey-3);
          border-radius: 4px;
          padding: var(--spacing-md);
          background: var(--warm-grey-1);
        }

        .image-upload-form {
          background: #fff;
          padding: var(--spacing-md);
          border-radius: 4px;
        }

        .upload-status {
          color: var(--sbd-brown);
          margin-top: 0.5rem;
          font-size: 14px;
        }

        .uploaded-images {
          margin-top: var(--spacing-md);
        }

        .images-list {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-sm);
        }

        .image-item {
          display: flex;
          align-items: center;
          gap: var(--spacing-sm);
          padding: var(--spacing-sm);
          background: #fff;
          border-radius: 4px;
          border: 1px solid var(--warm-grey-3);
        }

        .preview-image-small {
          width: 80px;
          height: 80px;
          object-fit: cover;
          border-radius: 4px;
        }

        .image-info {
          flex: 1;
          font-size: 14px;
        }

        .image-info div {
          margin-bottom: 0.25rem;
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
          opacity: 0.6;
          cursor: not-allowed;
        }

        .btn-secondary {
          background-color: transparent;
          border: 2px solid var(--sbd-gold);
          color: var(--sbd-brown);
        }

        .btn-secondary:hover:not(:disabled) {
          background-color: var(--sbd-gold);
          color: #fff;
        }

        .admin-table-container {
          background: #fff;
          border-radius: 8px;
          padding: var(--spacing-md);
          overflow-x: auto;
        }

        .admin-table {
          width: 100%;
          border-collapse: collapse;
        }

        .admin-table th,
        .admin-table td {
          padding: var(--spacing-sm);
          text-align: left;
          border-bottom: 1px solid var(--warm-grey-1);
        }

        .admin-table th {
          font-weight: 600;
          color: var(--sbd-brown);
        }

        .btn-small {
          padding: 0.25rem 0.75rem;
          font-size: 14px;
          margin-right: 0.5rem;
        }

        .btn-danger {
          background: #dc3545;
        }
      `}</style>
    </div>
  );
}
