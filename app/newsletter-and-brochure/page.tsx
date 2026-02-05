'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import styles from './page.module.css';

interface BrochureSettings {
  allowMailRequests: boolean;
}

export default function NewsletterAndBrochure() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    address: '',
    city: '',
    state: '',
    zip: '',
    website: '',
    newsletter: false,
    brochureType: 'digital' as 'digital' | 'physical',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [requestSubmitted, setRequestSubmitted] = useState(false);
  const [brochureSettings, setBrochureSettings] = useState<BrochureSettings>({
    allowMailRequests: true,
  });
  const [isLoadingSettings, setIsLoadingSettings] = useState(true);

  const fetchBrochureSettings = useCallback(async () => {
    try {
      const response = await fetch('/api/brochure-settings');
      if (response.ok) {
        const data = await response.json();
        setBrochureSettings(data);
        // If mail requests are disabled, ensure brochureType is set to digital
        setFormData(prev => {
          if (!data.allowMailRequests && prev.brochureType === 'physical') {
            return { ...prev, brochureType: 'digital' };
          }
          return prev;
        });
      }
    } catch (error) {
      console.error('Error fetching brochure settings:', error);
    } finally {
      setIsLoadingSettings(false);
    }
  }, []);

  useEffect(() => {
    fetchBrochureSettings();
  }, [fetchBrochureSettings]);

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
        setRequestSubmitted(true);
        setFormData({
          firstName: '',
          lastName: '',
          email: '',
          address: '',
          city: '',
          state: '',
          zip: '',
          website: '',
          newsletter: false,
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
      <section className={styles.newsletterHero}>
        <div className={styles.newsletterHeroImage}>
          <Image
            src="/images/Newsletter and Brochure Hero Image.jpg"
            alt="Newsletter & Brochure"
            fill
            className={styles.heroImage}
            priority
          />
          <h1>Newsletter & Brochure</h1>
        </div>
      </section>

      <section className="newsletter-content section-padding">
        <div className="container">
          <div className={styles.newsletterFormWrapper}>
            <h2>Download Our Brochure</h2>
            <p>
              {brochureSettings.allowMailRequests 
                ? 'Get instant access to our digital brochure, or opt to receive a physical copy by mail. You can also join our family and receive our monthly newsletter.'
                : 'Get instant access to our digital brochure. You can also join our family and receive our monthly newsletter.'}
            </p>

            {isLoadingSettings ? (
              <p>Loading...</p>
            ) : (
              <form onSubmit={handleSubmit} className="newsletter-form">
                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
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
                  <div className={styles.formGroup}>
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

                <div className={styles.formGroup}>
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

                <div className={styles.formGroup}>
                  <label htmlFor="zip">ZIP Code *</label>
                  <input
                    type="text"
                    id="zip"
                    name="zip"
                    required
                    value={formData.zip}
                    onChange={handleChange}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="website">Your Website</label>
                  <input
                    type="url"
                    id="website"
                    name="website"
                    value={formData.website}
                    onChange={handleChange}
                    placeholder="https://example.com"
                  />
                </div>

                <div className={styles.formGroup}>
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

                {brochureSettings.allowMailRequests ? (
                  <div className={styles.formGroup}>
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
                ) : (
                  <input type="hidden" name="brochureType" value="digital" />
                )}

                {formData.brochureType === 'physical' && (
                  <>
                    <div className={styles.formGroup}>
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

                    <div className={styles.formRow}>
                      <div className={styles.formGroup}>
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
                      <div className={styles.formGroup}>
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
                      <div className={styles.formGroup}>
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
                  <div className={`${styles.formMessage} ${styles.success}`}>
                    Thank you! {formData.brochureType === 'digital' ? 'Your download link has been sent to your email.' : 'Your brochure will be mailed to you shortly.'}
                  </div>
                )}

                {submitStatus === 'error' && (
                  <div className={`${styles.formMessage} ${styles.error}`}>
                    There was an error processing your request. Please try again.
                  </div>
                )}

                <button type="submit" className="btn" disabled={isSubmitting}>
                  {isSubmitting ? 'Processing...' : 'Submit'}
                </button>
              </form>
            )}

            {/* Download Section - Appears after successful form submission */}
            {requestSubmitted && (
              <section className={`${styles.downloadSection} section-padding`}>
                <div className="container">
                  <h2 className={styles.centeredHeading}>Your Brochure is Ready</h2>
                  <div className={styles.downloadOptions}>
                    <a
                      href="/files/SBD Interactive Brochure.pdf"
                      download="SBD Interactive Brochure.pdf"
                      className={`btn ${styles.downloadBtn}`}
                    >
                      Download Brochure
                    </a>
                  </div>
                </div>
              </section>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
