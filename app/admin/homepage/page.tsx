'use client';

import { useState, useEffect } from 'react';

interface Testimonial {
  review: string;
  name: string;
  position: string;
  company: string;
}

interface HomepageContent {
  _id?: string;
  portfolioHighlights: string[];
  testimonials: Testimonial[];
}

export default function HomepageManagement() {
  const [content, setContent] = useState<HomepageContent | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [editingTestimonial, setEditingTestimonial] = useState<{ index: number; testimonial: Testimonial } | null>(null);
  const [showTestimonialForm, setShowTestimonialForm] = useState(false);

  useEffect(() => {
    fetchContent();
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
            <a href="/admin/partners" className="btn" style={{ textDecoration: 'none' }}>
              Manage Partners
            </a>
          </div>
          <div style={{ background: 'var(--warm-grey-1)', padding: 'var(--spacing-md)', borderRadius: '8px', marginTop: 'var(--spacing-md)' }}>
            <p style={{ color: 'var(--sbd-brown)', marginBottom: 'var(--spacing-sm)', fontWeight: '500' }}>
              Partner logos appear in the &quot;You&apos;re In Good Hands&quot; section on the homepage.
            </p>
            <p style={{ color: 'var(--warm-grey-3)', fontSize: '14px', marginBottom: 'var(--spacing-sm)' }}>
              Click &quot;Manage Partners&quot; to add, edit, or delete partner logos. You can upload logo images and optionally add click-through URLs.
            </p>
            <a href="/admin/partners" className="btn" style={{ textDecoration: 'none', display: 'inline-block', marginTop: 'var(--spacing-sm)' }}>
              Go to Partners Management →
            </a>
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

        .testimonial-box {
          background: #fff;
          border: 1px solid var(--warm-grey-3);
          border-radius: 8px;
          padding: var(--spacing-md);
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
          padding: 0.5rem 1rem;
          font-size: 14px;
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
