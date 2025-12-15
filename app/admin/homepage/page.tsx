'use client';

import { useState, useEffect } from 'react';

interface HomepageContent {
  _id?: string;
  heroHeadline: string;
  heroSubheadline: string;
  heroVideo?: string;
  portfolioHighlights: string[];
  testimonials: {
    review: string;
    name: string;
    position: string;
    company: string;
  }[];
  partners: string[];
}

export default function HomepageManagement() {
  const [content, setContent] = useState<HomepageContent | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchContent();
  }, []);

  const fetchContent = async () => {
    try {
      const response = await fetch('/api/admin/homepage');
      const data = await response.json();
      setContent(data || {
        heroHeadline: '',
        heroSubheadline: '',
        heroVideo: '',
        portfolioHighlights: [],
        testimonials: [],
        partners: [],
      });
    } catch (error) {
      console.error('Error fetching homepage content:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSaving(true);
    const formData = new FormData(e.currentTarget);
    
    const testimonialsText = formData.get('testimonials') as string;
    const testimonials = testimonialsText.split('\n\n').filter(t => t.trim()).map(block => {
      const lines = block.split('\n');
      return {
        review: lines[0] || '',
        name: lines[1]?.replace('Name: ', '') || '',
        position: lines[2]?.replace('Position: ', '') || '',
        company: lines[3]?.replace('Company: ', '') || '',
      };
    });

    const data = {
      heroHeadline: formData.get('heroHeadline') as string,
      heroSubheadline: formData.get('heroSubheadline') as string,
      heroVideo: formData.get('heroVideo') as string,
      portfolioHighlights: (formData.get('portfolioHighlights') as string).split('\n').filter(h => h.trim()),
      testimonials: testimonials,
      partners: (formData.get('partners') as string).split('\n').filter(p => p.trim()),
    };

    try {
      const response = await fetch('/api/admin/homepage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        alert('Homepage content saved successfully!');
        fetchContent();
      }
    } catch (error) {
      console.error('Error saving homepage content:', error);
      alert('Error saving content');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <p>Loading...</p>;
  }

  return (
    <div className="admin-page">
      <h1>Homepage Content Management</h1>
      
      <form onSubmit={handleSubmit} className="admin-form">
        <div className="form-section">
          <h2>Hero Section</h2>
          <div className="form-group">
            <label htmlFor="heroHeadline">Hero Headline *</label>
            <input
              type="text"
              id="heroHeadline"
              name="heroHeadline"
              required
              defaultValue={content?.heroHeadline || ''}
            />
          </div>
          <div className="form-group">
            <label htmlFor="heroSubheadline">Hero Subheadline *</label>
            <textarea
              id="heroSubheadline"
              name="heroSubheadline"
              rows={3}
              required
              defaultValue={content?.heroSubheadline || ''}
            />
          </div>
          <div className="form-group">
            <label htmlFor="heroVideo">Hero Video URL</label>
            <input
              type="url"
              id="heroVideo"
              name="heroVideo"
              defaultValue={content?.heroVideo || ''}
            />
          </div>
        </div>

        <div className="form-section">
          <h2>Portfolio Highlights</h2>
          <div className="form-group">
            <label htmlFor="portfolioHighlights">Portfolio Category Slugs (one per line)</label>
            <textarea
              id="portfolioHighlights"
              name="portfolioHighlights"
              rows={6}
              defaultValue={content?.portfolioHighlights.join('\n') || ''}
              placeholder="active-adult-55&#10;senior-living&#10;remodels"
            />
          </div>
        </div>

        <div className="form-section">
          <h2>Testimonials</h2>
          <div className="form-group">
            <label htmlFor="testimonials">Testimonials (format: review on first line, then Name:, Position:, Company:)</label>
            <textarea
              id="testimonials"
              name="testimonials"
              rows={12}
              defaultValue={content?.testimonials.map(t => 
                `${t.review}\nName: ${t.name}\nPosition: ${t.position}\nCompany: ${t.company}`
              ).join('\n\n') || ''}
              placeholder="Great service!&#10;Name: John Doe&#10;Position: CEO&#10;Company: ABC Corp&#10;&#10;Another testimonial..."
            />
          </div>
        </div>

        <div className="form-section">
          <h2>Partners</h2>
          <div className="form-group">
            <label htmlFor="partners">Partner Logo URLs (one per line)</label>
            <textarea
              id="partners"
              name="partners"
              rows={6}
              defaultValue={content?.partners.join('\n') || ''}
              placeholder="https://example.com/logo1.png&#10;https://example.com/logo2.png"
            />
          </div>
        </div>

        <div className="form-actions">
          <button type="submit" className="btn" disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>

      <style jsx>{`
        .admin-form {
          background: #fff;
          padding: var(--spacing-xl);
          border-radius: 8px;
        }

        .form-section {
          margin-bottom: var(--spacing-xl);
          padding-bottom: var(--spacing-lg);
          border-bottom: 1px solid var(--warm-grey-1);
        }

        .form-section:last-child {
          border-bottom: none;
        }

        .form-section h2 {
          margin-bottom: var(--spacing-md);
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
          margin-top: var(--spacing-lg);
        }
      `}</style>
    </div>
  );
}
