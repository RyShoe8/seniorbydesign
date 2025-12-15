'use client';

import { useState } from 'react';

export default function NewsletterAndBrochure() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    address: '',
    city: '',
    state: '',
    zip: '',
    newsletter: true,
    brochureType: 'digital' as 'digital' | 'physical',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus('idle');

    try {
      const response = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setSubmitStatus('success');
        setFormData({
          firstName: '',
          lastName: '',
          email: '',
          address: '',
          city: '',
          state: '',
          zip: '',
          newsletter: true,
          brochureType: 'digital',
        });
      } else {
        setSubmitStatus('error');
      }
    } catch (error) {
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const value = e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value;
    setFormData({
      ...formData,
      [e.target.name]: value,
    });
  };

  return (
    <>
      <section className="newsletter-hero section-padding">
        <div className="container">
          <div className="hero-image-placeholder">
            <h1>Newsletter & Brochure</h1>
          </div>
        </div>
      </section>

      <section className="newsletter-content section-padding">
        <div className="container">
          <div className="newsletter-form-wrapper">
            <h2>Join our family and receive our monthly newsletter</h2>
            <p>Download our digital brochure or have a physical copy sent to you.</p>

            <form onSubmit={handleSubmit} className="newsletter-form">
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="firstName">First Name *</label>
                  <input
                    type="text"
                    id="firstName"
                    name="firstName"
                    required
                    value={formData.firstName}
                    onChange={handleChange}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="lastName">Last Name *</label>
                  <input
                    type="text"
                    id="lastName"
                    name="lastName"
                    required
                    value={formData.lastName}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="email">Email *</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label>
                  <input
                    type="checkbox"
                    name="newsletter"
                    checked={formData.newsletter}
                    onChange={handleChange}
                  />
                  Subscribe to monthly newsletter
                </label>
              </div>

              <div className="form-group">
                <label htmlFor="brochureType">Brochure Type *</label>
                <select
                  id="brochureType"
                  name="brochureType"
                  required
                  value={formData.brochureType}
                  onChange={handleChange}
                >
                  <option value="digital">Digital Download</option>
                  <option value="physical">Physical Copy (Mailed)</option>
                </select>
              </div>

              {formData.brochureType === 'physical' && (
                <>
                  <div className="form-group">
                    <label htmlFor="address">Address *</label>
                    <input
                      type="text"
                      id="address"
                      name="address"
                      required={formData.brochureType === 'physical'}
                      value={formData.address}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="city">City *</label>
                      <input
                        type="text"
                        id="city"
                        name="city"
                        required={formData.brochureType === 'physical'}
                        value={formData.city}
                        onChange={handleChange}
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="state">State *</label>
                      <input
                        type="text"
                        id="state"
                        name="state"
                        required={formData.brochureType === 'physical'}
                        value={formData.state}
                        onChange={handleChange}
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="zip">ZIP Code *</label>
                      <input
                        type="text"
                        id="zip"
                        name="zip"
                        required={formData.brochureType === 'physical'}
                        value={formData.zip}
                        onChange={handleChange}
                      />
                    </div>
                  </div>
                </>
              )}

              {submitStatus === 'success' && (
                <div className="form-message success">
                  Thank you! {formData.brochureType === 'digital' ? 'Your download link has been sent to your email.' : 'Your brochure will be mailed to you shortly.'}
                </div>
              )}

              {submitStatus === 'error' && (
                <div className="form-message error">
                  There was an error processing your request. Please try again.
                </div>
              )}

              <button type="submit" className="btn" disabled={isSubmitting}>
                {isSubmitting ? 'Processing...' : 'Submit'}
              </button>
            </form>
          </div>
        </div>
      </section>

      <style jsx>{`
        .newsletter-hero {
          background: linear-gradient(135deg, var(--warm-grey-1) 0%, var(--warm-grey-3) 100%);
          text-align: center;
        }

        .hero-image-placeholder {
          height: 300px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--warm-grey-1);
          border-radius: 8px;
        }

        .newsletter-form-wrapper {
          max-width: 700px;
          margin: 0 auto;
        }

        .newsletter-form-wrapper h2 {
          text-align: center;
          margin-bottom: var(--spacing-sm);
        }

        .newsletter-form-wrapper p {
          text-align: center;
          margin-bottom: var(--spacing-lg);
        }

        .form-row {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: var(--spacing-md);
        }

        .form-group {
          margin-bottom: var(--spacing-md);
        }

        .form-group label {
          display: block;
          margin-bottom: 0.5rem;
        }

        .form-group input[type="checkbox"] {
          width: auto;
          margin-right: 0.5rem;
        }

        .form-message {
          padding: var(--spacing-sm);
          border-radius: 4px;
          margin-bottom: var(--spacing-md);
        }

        .form-message.success {
          background: #d4edda;
          color: #155724;
        }

        .form-message.error {
          background: #f8d7da;
          color: #721c24;
        }

        @media (max-width: 768px) {
          .form-row {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </>
  );
}

