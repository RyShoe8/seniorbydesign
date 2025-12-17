'use client';

import { useState, useEffect } from 'react';

interface Testimonial {
  review: string;
  name: string;
  position: string;
  company: string;
}

interface Partner {
  _id?: string;
  name: string;
  logo: string;
  displayName?: string;
  altText?: string;
  url?: string;
  order: number;
}

interface HomepageContent {
  _id?: string;
  portfolioHighlights: string[];
  testimonials: Testimonial[];
}

export default function HomepageManagement() {
  const [content, setContent] = useState<HomepageContent | null>(null);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [editingTestimonial, setEditingTestimonial] = useState<{ index: number; testimonial: Testimonial } | null>(null);
  const [showTestimonialForm, setShowTestimonialForm] = useState(false);
  const [editingPartner, setEditingPartner] = useState<Partner | null>(null);
  const [showPartnerForm, setShowPartnerForm] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string>('');

  useEffect(() => {
    fetchContent();
    fetchPartners();
  }, []);

  const fetchContent = async () => {
    try {
      const response = await fetch('/api/admin/homepage');
      const data = await response.json();
      setContent(data || {
        portfolioHighlights: [],
        testimonials: [],
      });
    } catch (error) {
      console.error('Error fetching homepage content:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPartners = async () => {
    try {
      const response = await fetch('/api/admin/partners');
      const data = await response.json();
      setPartners(data.sort((a: Partner, b: Partner) => a.order - b.order));
    } catch (error) {
      console.error('Error fetching partners:', error);
    }
  };

  const handlePortfolioSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSaving(true);
    const formData = new FormData(e.currentTarget);
    
    const data = {
      portfolioHighlights: (formData.get('portfolioHighlights') as string).split('\n').filter(h => h.trim()),
    };

    try {
      const response = await fetch('/api/admin/homepage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        alert('Portfolio highlights saved successfully!');
        fetchContent();
      }
    } catch (error) {
      console.error('Error saving portfolio highlights:', error);
      alert('Error saving content');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddTestimonial = async (testimonial: Testimonial) => {
    try {
      const response = await fetch('/api/admin/homepage/testimonials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testimonial),
      });

      if (response.ok) {
        fetchContent();
      }
    } catch (error) {
      console.error('Error adding testimonial:', error);
      alert('Error adding testimonial');
    }
  };

  const handleUpdateTestimonial = async (index: number, testimonial: Testimonial) => {
    try {
      const response = await fetch('/api/admin/homepage/testimonials', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ index, ...testimonial }),
      });

      if (response.ok) {
        fetchContent();
      }
    } catch (error) {
      console.error('Error updating testimonial:', error);
      alert('Error updating testimonial');
    }
  };

  const handleDeleteTestimonial = async (index: number) => {
    if (!confirm('Are you sure you want to delete this testimonial?')) return;
    
    try {
      const response = await fetch(`/api/admin/homepage/testimonials?index=${index}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchContent();
      }
    } catch (error) {
      console.error('Error deleting testimonial:', error);
      alert('Error deleting testimonial');
    }
  };

  if (isLoading) {
    return <p>Loading...</p>;
  }

  const handleTestimonialFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const testimonial: Testimonial = {
      review: formData.get('review') as string,
      name: formData.get('name') as string,
      position: formData.get('position') as string,
      company: formData.get('company') as string,
    };

    if (editingTestimonial) {
      await handleUpdateTestimonial(editingTestimonial.index, testimonial);
    } else {
      await handleAddTestimonial(testimonial);
    }

    setShowTestimonialForm(false);
    setEditingTestimonial(null);
    (e.target as HTMLFormElement).reset();
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingLogo(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', 'partners');

    try {
      const response = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        setLogoUrl(data.url);
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Failed to upload logo' }));
        alert(`Failed to upload logo: ${errorData.error || 'Unknown error'}\n\n${errorData.details || ''}\n\n${errorData.instructions || ''}`);
      }
    } catch (error: any) {
      console.error('Error uploading logo:', error);
      alert(`Error uploading logo: ${error.message || 'Unknown error'}`);
    } finally {
      setUploadingLogo(false);
    }
  };

  const handlePartnerFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    // Use logoUrl state if set, otherwise fall back to editingPartner's logo
    const logo = logoUrl || editingPartner?.logo;
    if (!logo) {
      alert('Please upload a logo or provide a logo URL');
      return;
    }

    const partnerData = {
      name: formData.get('displayName') as string,
      logo: logo,
      displayName: formData.get('displayName') as string,
      altText: formData.get('altText') as string,
      url: formData.get('url') as string || '',
      order: parseInt(formData.get('order') as string) || partners.length + 1,
    };

    try {
      const url = editingPartner?._id 
        ? `/api/admin/partners/${editingPartner._id}`
        : '/api/admin/partners';
      
      const response = await fetch(url, {
        method: editingPartner?._id ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(partnerData),
      });

      if (response.ok) {
        fetchPartners();
        setShowPartnerForm(false);
        setEditingPartner(null);
        setLogoUrl('');
        (e.target as HTMLFormElement).reset();
      } else {
        alert('Error saving partner');
      }
    } catch (error) {
      console.error('Error saving partner:', error);
      alert('Error saving partner');
    }
  };

  const handleDeletePartner = async (id: string) => {
    if (!confirm('Are you sure you want to delete this partner?')) return;
    
    try {
      const response = await fetch(`/api/admin/partners/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchPartners();
      } else {
        alert('Error deleting partner');
      }
    } catch (error) {
      console.error('Error deleting partner:', error);
      alert('Error deleting partner');
    }
  };

  return (
    <div className="admin-page">
      <h1>Homepage Content Management</h1>
      
      {/* Portfolio Highlights Section */}
      <form onSubmit={handlePortfolioSubmit} className="admin-form">
        <div className="form-section">
          <h2>Portfolio Highlights</h2>
          <div className="form-group">
            <label htmlFor="portfolioHighlights">Portfolio Category Slugs (one per line)</label>
            <textarea
              id="portfolioHighlights"
              name="portfolioHighlights"
              rows={6}
              defaultValue={content?.portfolioHighlights?.join('\n') || ''}
              placeholder="active-adult-55&#10;senior-living&#10;remodels"
            />
          </div>
          <div className="form-actions">
            <button type="submit" className="btn" disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Save Portfolio Highlights'}
            </button>
          </div>
        </div>
      </form>

      {/* Partners Section */}
      <div className="admin-form">
        <div className="form-section">
          <div className="section-header">
            <h2>Partners - You&apos;re In Good Hands</h2>
            <button 
              type="button" 
              className="btn" 
              onClick={() => {
                setEditingPartner(null);
                setLogoUrl('');
                setShowPartnerForm(true);
              }}
            >
              Add Partner
            </button>
          </div>

          {showPartnerForm && (
            <div className="testimonial-form-box">
              <h3>{editingPartner ? 'Edit' : 'Add'} Partner</h3>
              <form onSubmit={handlePartnerFormSubmit}>
                <div className="form-group">
                  <label htmlFor="logoUpload">Logo Image *</label>
                  <input
                    type="file"
                    id="logoUpload"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    disabled={uploadingLogo}
                  />
                  {uploadingLogo && <p style={{ color: 'var(--sbd-brown)', marginTop: '0.5rem' }}>Uploading...</p>}
                  {logoUrl && (
                    <div style={{ marginTop: 'var(--spacing-sm)' }}>
                      <img src={logoUrl} alt="Logo preview" style={{ maxWidth: '200px', maxHeight: '100px', objectFit: 'contain' }} />
                      <button 
                        type="button" 
                        className="btn-small btn-danger" 
                        onClick={() => setLogoUrl('')}
                        style={{ marginLeft: 'var(--spacing-sm)' }}
                      >
                        Remove
                      </button>
                    </div>
                  )}
                  <input
                    type="hidden"
                    name="logo"
                    value={logoUrl}
                  />
                  <p style={{ fontSize: '14px', color: 'var(--warm-grey-3)', marginTop: '0.5rem' }}>
                    Or enter a URL:
                  </p>
                  <input
                    type="url"
                    name="logoUrl"
                    placeholder="https://example.com/logo.png"
                    value={logoUrl || ''}
                    onChange={(e) => setLogoUrl(e.target.value)}
                    style={{ marginTop: '0.5rem' }}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="displayName">File Name (Display Name) *</label>
                  <input
                    type="text"
                    id="displayName"
                    name="displayName"
                    required
                    defaultValue={editingPartner?.displayName || editingPartner?.name || ''}
                    placeholder="Company Name"
                  />
                  <p style={{ fontSize: '14px', color: 'var(--warm-grey-3)', marginTop: '0.5rem' }}>
                    This is the file name/display name for the logo.
                  </p>
                </div>
                <div className="form-group">
                  <label htmlFor="altText">Alt Text *</label>
                  <input
                    type="text"
                    id="altText"
                    name="altText"
                    required
                    defaultValue={editingPartner?.altText || ''}
                    placeholder="Logo description for accessibility"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="url">Website URL (optional)</label>
                  <input
                    type="url"
                    id="url"
                    name="url"
                    defaultValue={editingPartner?.url || ''}
                    placeholder="https://example.com"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="order">Display Order *</label>
                  <input
                    type="number"
                    id="order"
                    name="order"
                    required
                    min="1"
                    defaultValue={editingPartner?.order || partners.length + 1}
                    placeholder="1"
                  />
                  <p style={{ fontSize: '14px', color: 'var(--warm-grey-3)', marginTop: '0.5rem' }}>
                    Setting order to 3 will place this partner 3rd and automatically shift others back.
                  </p>
                </div>
                <div className="form-actions">
                  <button type="submit" className="btn" disabled={!logoUrl && !editingPartner?.logo}>
                    Save
                  </button>
                  <button 
                    type="button" 
                    className="btn-secondary" 
                    onClick={() => {
                      setShowPartnerForm(false);
                      setEditingPartner(null);
                      setLogoUrl('');
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          <div className="partners-grid">
            {partners.map((partner) => (
              <div key={partner._id} className="partner-box">
                <div className="testimonial-content">
                  {partner.logo && (
                    <div style={{ marginBottom: '0.25rem' }}>
                      <img src={partner.logo} alt={partner.altText || partner.displayName || partner.name} style={{ maxWidth: '100px', maxHeight: '50px', objectFit: 'contain' }} />
                    </div>
                  )}
                  <p className="testimonial-name" style={{ fontSize: '12px', marginBottom: '0.15rem', fontWeight: '600' }}>{partner.displayName || partner.name}</p>
                  <p className="testimonial-details" style={{ fontSize: '11px', marginBottom: '0.15rem' }}>Order: {partner.order}</p>
                  {partner.url && (
                    <p className="testimonial-details" style={{ marginTop: '0.15rem', fontSize: '10px', wordBreak: 'break-all', lineHeight: '1.3' }}>
                      <a href={partner.url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--sbd-gold)' }}>
                        {partner.url.length > 25 ? partner.url.substring(0, 25) + '...' : partner.url}
                      </a>
                    </p>
                  )}
                </div>
                <div className="testimonial-actions" style={{ marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid var(--warm-grey-1)' }}>
                  <button 
                    className="btn-small" 
                    onClick={() => {
                      setEditingPartner(partner);
                      setLogoUrl(partner.logo || '');
                      setShowPartnerForm(true);
                    }}
                  >
                    Edit
                  </button>
                  <button 
                    className="btn-small btn-danger" 
                    onClick={() => handleDeletePartner(partner._id!)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
            {(!partners || partners.length === 0) && !showPartnerForm && (
              <p className="empty-state">No partners yet. Click &quot;Add Partner&quot; to get started.</p>
            )}
          </div>
        </div>
      </div>

      {/* Testimonials Section */}
      <div className="admin-form">
        <div className="form-section">
          <div className="section-header">
            <h2>Testimonials</h2>
            <button 
              type="button" 
              className="btn" 
              onClick={() => {
                setEditingTestimonial(null);
                setShowTestimonialForm(true);
              }}
            >
              Add Testimonial
            </button>
          </div>

          {showTestimonialForm && (
            <div className="testimonial-form-box">
              <h3>{editingTestimonial ? 'Edit' : 'Add'} Testimonial</h3>
              <form onSubmit={handleTestimonialFormSubmit}>
                <div className="form-group">
                  <label htmlFor="review">Review *</label>
                  <textarea
                    id="review"
                    name="review"
                    rows={4}
                    required
                    defaultValue={editingTestimonial?.testimonial.review || ''}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="name">Name *</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    required
                    defaultValue={editingTestimonial?.testimonial.name || ''}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="position">Position *</label>
                  <input
                    type="text"
                    id="position"
                    name="position"
                    required
                    defaultValue={editingTestimonial?.testimonial.position || ''}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="company">Company *</label>
                  <input
                    type="text"
                    id="company"
                    name="company"
                    required
                    defaultValue={editingTestimonial?.testimonial.company || ''}
                  />
                </div>
                <div className="form-actions">
                  <button type="submit" className="btn">Save</button>
                  <button 
                    type="button" 
                    className="btn-secondary" 
                    onClick={() => {
                      setShowTestimonialForm(false);
                      setEditingTestimonial(null);
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          <div className="testimonials-grid">
            {content?.testimonials?.map((testimonial, index) => (
              <div key={index} className="testimonial-box">
                <div className="testimonial-content">
                  <p className="testimonial-review">&ldquo;{testimonial.review}&rdquo;</p>
                  <div className="testimonial-author">
                    <p className="testimonial-name">{testimonial.name}</p>
                    <p className="testimonial-details">{testimonial.position}, {testimonial.company}</p>
                  </div>
                </div>
                <div className="testimonial-actions">
                  <button 
                    className="btn-small" 
                    onClick={() => {
                      setEditingTestimonial({ index, testimonial });
                      setShowTestimonialForm(true);
                    }}
                  >
                    Edit
                  </button>
                  <button 
                    className="btn-small btn-danger" 
                    onClick={() => handleDeleteTestimonial(index)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
            {(!content?.testimonials || content.testimonials.length === 0) && !showTestimonialForm && (
              <p className="empty-state">No testimonials yet. Click &quot;Add Testimonial&quot; to get started.</p>
            )}
          </div>
        </div>
      </div>

      <style jsx>{`
        .admin-form {
          background: #fff;
          padding: var(--spacing-xl);
          border-radius: 8px;
          margin-bottom: var(--spacing-xl);
        }

        .form-section {
          margin-bottom: var(--spacing-xl);
          padding-bottom: var(--spacing-lg);
          border-bottom: 1px solid var(--warm-grey-1);
        }

        .form-section:last-child {
          border-bottom: none;
        }

        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: var(--spacing-md);
        }

        .form-section h2 {
          margin-bottom: 0;
          color: var(--sbd-brown);
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

        .form-actions {
          display: flex;
          gap: var(--spacing-sm);
          margin-top: var(--spacing-md);
        }

        .testimonial-form-box {
          background: var(--warm-grey-1);
          padding: var(--spacing-md);
          border-radius: 8px;
          margin-bottom: var(--spacing-lg);
        }

        .testimonial-form-box h3 {
          margin-bottom: var(--spacing-md);
          color: var(--sbd-brown);
        }

        .testimonials-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: var(--spacing-md);
          margin-top: var(--spacing-md);
        }

        .partners-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
          gap: var(--spacing-xs);
          margin-top: var(--spacing-md);
        }

        .testimonial-box {
          background: #fff;
          border: 1px solid var(--warm-grey-3);
          border-radius: 8px;
          padding: var(--spacing-md);
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }

        .partner-box {
          background: #fff;
          border: 1px solid var(--warm-grey-3);
          border-radius: 4px;
          padding: 0.5rem;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }

        .testimonial-content {
          flex: 1;
        }

        .testimonial-review {
          font-style: italic;
          color: var(--sbd-brown);
          margin-bottom: var(--spacing-sm);
          font-size: 16px;
          line-height: 1.6;
        }

        .testimonial-author {
          border-top: 1px solid var(--warm-grey-1);
          padding-top: var(--spacing-sm);
          margin-top: var(--spacing-sm);
        }

        .testimonial-name {
          font-weight: 600;
          color: var(--sbd-brown);
          margin-bottom: 0.25rem;
        }

        .testimonial-details {
          font-size: 14px;
          color: var(--warm-grey-3);
        }

        .testimonial-actions {
          display: flex;
          gap: var(--spacing-sm);
          margin-top: var(--spacing-md);
          padding-top: var(--spacing-md);
          border-top: 1px solid var(--warm-grey-1);
        }

        .btn-small {
          padding: 0.35rem 0.75rem;
          font-size: 12px;
        }

        .btn-danger {
          background: #dc3545;
          color: #fff;
        }

        .btn-danger:hover {
          background: #c82333;
        }

        .empty-state {
          grid-column: 1 / -1;
          text-align: center;
          color: var(--warm-grey-3);
          padding: var(--spacing-lg);
        }

        @media (max-width: 768px) {
          .testimonials-grid {
            grid-template-columns: 1fr;
          }

          .partners-grid {
            grid-template-columns: 1fr;
          }

          .section-header {
            flex-direction: column;
            align-items: flex-start;
            gap: var(--spacing-sm);
          }
        }
      `}</style>
    </div>
  );
}
