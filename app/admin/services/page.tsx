'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';

interface Service {
  _id?: string;
  slug: string;
  title: string;
  heroImage?: string;
  body: string;
  images: string[];
}

export default function ServicesManagement() {
  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [uploadingHero, setUploadingHero] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [heroImageUrl, setHeroImageUrl] = useState<string>('');
  const [additionalImages, setAdditionalImages] = useState<string[]>([]);

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      const response = await fetch('/api/admin/services');
      const data = await response.json();
      setServices(data);
    } catch (error) {
          } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this service?')) return;
    
    try {
      const response = await fetch(`/api/admin/services/${id}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        fetchServices();
      }
    } catch (error) {
          }
  };

  const handleEdit = (service: Service) => {
    setEditingService(service);
    setHeroImageUrl(service.heroImage || '');
    setAdditionalImages(service.images || []);
    setShowForm(true);
  };

  const handleHeroImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingHero(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', 'services');
    formData.append('spaceType', 'service-hero');
    const slugInput = document.getElementById('slug') as HTMLInputElement | null;
    if (slugInput?.value) formData.append('projectSlug', slugInput.value);

    try {
      const response = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        setHeroImageUrl(data.url);
      } else {
        alert('Failed to upload hero image');
      }
    } catch (error) {
            alert('Error uploading hero image');
    } finally {
      setUploadingHero(false);
    }
  };

  const handleAdditionalImagesUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadingImages(true);
    const uploadedUrls: string[] = [];

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const formData = new FormData();
        formData.append('file', file);
        formData.append('folder', 'services');
    formData.append('spaceType', 'service-hero');
    const slugInput = document.getElementById('slug') as HTMLInputElement | null;
    if (slugInput?.value) formData.append('projectSlug', slugInput.value);

        const response = await fetch('/api/admin/upload', {
          method: 'POST',
          body: formData,
        });

        if (response.ok) {
          const data = await response.json();
          uploadedUrls.push(data.url);
        }
      }

      setAdditionalImages([...uploadedUrls, ...additionalImages]);
    } catch (error) {
            alert('Error uploading images');
    } finally {
      setUploadingImages(false);
      // Reset the input
      e.target.value = '';
    }
  };

  const removeAdditionalImage = (index: number) => {
    setAdditionalImages(additionalImages.filter((_, i) => i !== index));
  };

  const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    // Use uploaded hero image
    const finalHeroImage = heroImageUrl || '';

    const data = {
      slug: formData.get('slug') as string,
      title: formData.get('title') as string,
      heroImage: finalHeroImage,
      body: formData.get('body') as string,
      images: additionalImages,
    };

    try {
      const url = editingService?._id 
        ? `/api/admin/services/${editingService._id}`
        : '/api/admin/services';
      
      const response = await fetch(url, {
        method: editingService?._id ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        fetchServices();
        setShowForm(false);
        setEditingService(null);
        setHeroImageUrl('');
        setAdditionalImages([]);
        (e.target as HTMLFormElement).reset();
      }
    } catch (error) {
            alert('Error saving service');
    }
  };

  return (
    <div className="admin-page">
      <div className="admin-header">
        <h1>Services Management</h1>
        <button 
          onClick={() => { 
            setShowForm(true); 
            setEditingService(null);
            setHeroImageUrl('');
            setAdditionalImages([]);
          }} 
          className="btn"
        >
          Add Service
        </button>
      </div>

      {showForm && (
        <div className="admin-form-modal">
          <div className="admin-form-content">
            <h2>{editingService ? 'Edit' : 'Add'} Service</h2>
            <form onSubmit={handleFormSubmit}>
              <div className="form-group">
                <label htmlFor="title">Service Title *</label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  required
                  defaultValue={editingService?.title || ''}
                />
              </div>
              <div className="form-group">
                <label htmlFor="slug">Slug *</label>
                <input
                  type="text"
                  id="slug"
                  name="slug"
                  required
                  defaultValue={editingService?.slug || ''}
                  placeholder="interior-environments-and-design"
                />
              </div>
              <div className="form-group">
                <label htmlFor="heroImageUpload">Hero Image</label>
                <input
                  type="file"
                  id="heroImageUpload"
                  name="heroImageUpload"
                  accept="image/*"
                  onChange={handleHeroImageUpload}
                  disabled={uploadingHero}
                />
                {uploadingHero && <p className="upload-status">Uploading...</p>}
                {heroImageUrl && (
                  <div className="image-preview">
                    <div style={{ position: 'relative', width: '300px', height: '200px' }}>
                      <Image 
                        src={heroImageUrl} 
                        alt="Hero preview" 
                        fill
                        style={{ objectFit: 'cover', borderRadius: '4px' }}
                        unoptimized={heroImageUrl.startsWith('https://')}
                      />
                    </div>
                    <button
                      type="button"
                      className="btn-small btn-danger"
                      onClick={() => setHeroImageUrl('')}
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>
              <div className="form-group">
                <label htmlFor="body">Body Content *</label>
                <textarea
                  id="body"
                  name="body"
                  rows={10}
                  required
                  defaultValue={editingService?.body || ''}
                />
              </div>
              <div className="form-group">
                <label htmlFor="imagesUpload">Additional Images</label>
                <input
                  type="file"
                  id="imagesUpload"
                  name="imagesUpload"
                  accept="image/*"
                  multiple
                  onChange={handleAdditionalImagesUpload}
                  disabled={uploadingImages}
                />
                {uploadingImages && <p className="upload-status">Uploading...</p>}
                {additionalImages.length > 0 && (
                  <div className="uploaded-images">
                    <p>Uploaded Images:</p>
                    <div className="images-grid">
                      {additionalImages.map((url, index) => (
                        <div key={index} className="image-item">
                          <div style={{ position: 'relative', width: '80px', height: '80px' }}>
                            <Image 
                              src={url} 
                              alt={`Upload ${index + 1}`} 
                              fill
                              style={{ objectFit: 'cover', borderRadius: '4px' }}
                              unoptimized={url.startsWith('https://')}
                            />
                          </div>
                          <button
                            type="button"
                            className="btn-small btn-danger"
                            onClick={() => removeAdditionalImage(index)}
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <div className="form-actions">
                <button type="submit" className="btn">Save</button>
                <button 
                  type="button" 
                  className="btn-secondary" 
                  onClick={() => { 
                    setShowForm(false); 
                    setEditingService(null);
                    setHeroImageUrl('');
                    setAdditionalImages([]);
                  }}
                >
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
        <>
          <div className="admin-table-container">
            <table className="admin-table admin-table-desktop">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Slug</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {services.map((service) => (
                  <tr key={service._id}>
                    <td>{service.title}</td>
                    <td>{service.slug}</td>
                    <td>
                      <button onClick={() => handleEdit(service)} className="btn-small">Edit</button>
                      <button onClick={() => service._id && handleDelete(service._id)} className="btn-small btn-danger">
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <div className="services-cards-mobile">
            {services.map((service) => (
              <div key={service._id} className="service-card">
                <div className="service-card-content">
                  <div className="service-card-field">
                    <span className="service-card-label">Title:</span>
                    <span className="service-card-value">{service.title}</span>
                  </div>
                  <div className="service-card-field">
                    <span className="service-card-label">Slug:</span>
                    <span className="service-card-value">{service.slug}</span>
                  </div>
                </div>
                <div className="service-card-actions">
                  <button onClick={() => handleEdit(service)} className="btn btn-small">Edit</button>
                  <button onClick={() => service._id && handleDelete(service._id)} className="btn btn-small btn-danger">
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
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

        @media (max-width: 768px) {
          .admin-form-content {
            width: 95%;
            padding: var(--spacing-md);
            max-height: 95vh;
          }

          .form-group input,
          .form-group textarea {
            min-height: 44px;
            font-size: 16px;
          }

          .form-actions {
            flex-direction: column;
          }

          .form-actions .btn {
            width: 100%;
          }
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

        .btn:hover {
          background-color: var(--sbd-brown);
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

        .admin-table-container {
          background: #fff;
          border-radius: 8px;
          padding: var(--spacing-md);
          overflow-x: auto;
        }

        @media (max-width: 768px) {
          .admin-table-container {
            padding: var(--spacing-xs);
            border-radius: 4px;
          }

          .service-card {
            padding: var(--spacing-xs);
          }

          .service-card-content {
            margin-bottom: var(--spacing-xs);
          }

          .service-card-field {
            margin-bottom: var(--spacing-xs);
          }

          .service-card-label {
            margin-bottom: 0.125rem;
          }
        }

        .admin-table-desktop {
          width: 100%;
          border-collapse: collapse;
        }

        .services-cards-mobile {
          display: none;
        }

        .admin-table-desktop th,
        .admin-table-desktop td {
          padding: var(--spacing-sm);
          text-align: left;
          border-bottom: 1px solid var(--warm-grey-1);
        }

        .admin-table-desktop th {
          font-weight: 600;
          color: var(--sbd-brown);
        }

        .service-card {
          background: #fff;
          border: 1px solid var(--warm-grey-1);
          border-radius: 8px;
          padding: var(--spacing-md);
          margin-bottom: var(--spacing-md);
        }

        .service-card:last-child {
          margin-bottom: 0;
        }

        .service-card-content {
          margin-bottom: var(--spacing-md);
        }

        .service-card-field {
          display: flex;
          flex-direction: column;
          margin-bottom: var(--spacing-sm);
        }

        .service-card-field:last-child {
          margin-bottom: 0;
        }

        .service-card-label {
          font-weight: 600;
          color: var(--sbd-brown);
          font-size: 14px;
          margin-bottom: 0.25rem;
        }

        .service-card-value {
          color: var(--warm-grey-3);
          font-size: 16px;
        }

        .service-card-actions {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-sm);
        }

        .btn-small {
          padding: 0.75rem 1rem;
          font-size: 16px;
          min-height: 44px;
          width: 100%;
        }

        .btn-danger {
          background: #dc3545;
          color: #fff;
        }

        .btn-danger:hover {
          background: #c82333;
        }

        @media (max-width: 768px) {
          .admin-table-desktop {
            display: none;
          }

          .services-cards-mobile {
            display: block;
          }
        }

        .upload-status {
          color: var(--sbd-gold);
          font-size: 14px;
          margin-top: 0.5rem;
        }

        .image-preview {
          margin-top: 1rem;
          padding: 1rem;
          background: var(--warm-grey-1);
          border-radius: 4px;
        }

        .preview-image {
          max-width: 100%;
          max-height: 200px;
          display: block;
          margin-bottom: 0.5rem;
          border-radius: 4px;
        }

        .preview-image-small {
          max-width: 100%;
          max-height: 100px;
          display: block;
          border-radius: 4px;
        }

        .uploaded-images {
          margin-top: 1rem;
        }

        .images-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
          gap: 1rem;
          margin-top: 0.5rem;
        }

        .image-item {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          padding: 0.5rem;
          background: var(--warm-grey-1);
          border-radius: 4px;
        }

        .image-item button {
          width: 100%;
        }
      `}</style>
    </div>
  );
}
