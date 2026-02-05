'use client';

import { useEffect, useState } from 'react';
import styles from './NewsletterCTA.module.css';

export default function NewsletterCTA() {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState<'choice' | 'form' | 'success'>('choice');
  const [brochureType, setBrochureType] = useState<'digital' | 'physical'>('digital');
  const [allowMailRequests, setAllowMailRequests] = useState(true);
  const [isLoadingSettings, setIsLoadingSettings] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    address: '',
    city: '',
    state: '',
    zip: '',
    newsletter: false,
  });

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch('/api/brochure-settings');
        if (response.ok) {
          const data = await response.json();
          setAllowMailRequests(!!data.allowMailRequests);
        }
      } catch (error) {
        console.error('Error fetching brochure settings:', error);
      } finally {
        setIsLoadingSettings(false);
      }
    };

    fetchSettings();
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closeModal();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && !isLoadingSettings && !allowMailRequests) {
      setBrochureType('digital');
      setStep('form');
    }
  }, [allowMailRequests, isLoadingSettings, isOpen]);

  const openModal = () => {
    setIsOpen(true);
    setSubmitStatus('idle');
    setStep('choice');
  };

  const closeModal = () => {
    setIsOpen(false);
    setStep('choice');
    setSubmitStatus('idle');
    setIsSubmitting(false);
  };

  const handleChoice = (choice: 'digital' | 'physical') => {
    setBrochureType(choice);
    setStep('form');
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setFormData({
      ...formData,
      [e.target.name]: value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus('idle');

    try {
      const response = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          brochureType,
        }),
      });

      if (response.ok) {
        setSubmitStatus('success');
        setStep('success');
        setFormData({
          firstName: '',
          lastName: '',
          email: '',
          address: '',
          city: '',
          state: '',
          zip: '',
          newsletter: false,
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

  return (
    <section className={styles.newsletterCta}>
      <div className={styles.newsletterCtaContainer}>
        <h3 className={styles.newsletterCtaHeading}>
          See how we design spaces residents love and operators trust.
        </h3>
        <button type="button" className="btn" onClick={openModal}>
          Get the brochure
        </button>
      </div>

      {isOpen && (
        <div
          className={styles.modalOverlay}
          role="dialog"
          aria-modal="true"
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              closeModal();
            }
          }}
        >
          <div className={styles.modal}>
            <button type="button" className={styles.modalClose} onClick={closeModal} aria-label="Close">
              ×
            </button>

            {step === 'choice' && allowMailRequests && (
              <div className={styles.modalStep}>
                <h4>How would you like the brochure?</h4>
                <div className={styles.choiceButtons}>
                  <button type="button" className="btn" onClick={() => handleChoice('digital')}>
                    📄 Download instantly
                  </button>
                  <button type="button" className={styles.secondaryBtn} onClick={() => handleChoice('physical')}>
                    📬 Mail me a printed copy
                  </button>
                </div>
              </div>
            )}

            {step === 'form' && (
              <form onSubmit={handleSubmit} className={styles.modalForm}>
                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label htmlFor="ctaFirstName">First Name *</label>
                    <input
                      type="text"
                      id="ctaFirstName"
                      name="firstName"
                      required
                      value={formData.firstName}
                      onChange={handleChange}
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label htmlFor="ctaLastName">Last Name *</label>
                    <input
                      type="text"
                      id="ctaLastName"
                      name="lastName"
                      required
                      value={formData.lastName}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="ctaEmail">Email *</label>
                  <input
                    type="email"
                    id="ctaEmail"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      name="newsletter"
                      checked={formData.newsletter}
                      onChange={handleChange}
                    />
                    Subscribe to monthly newsletter
                  </label>
                </div>

                {brochureType === 'physical' && (
                  <>
                    <div className={styles.formGroup}>
                      <label htmlFor="ctaAddress">Address *</label>
                      <input
                        type="text"
                        id="ctaAddress"
                        name="address"
                        required
                        value={formData.address}
                        onChange={handleChange}
                      />
                    </div>

                    <div className={styles.formRow}>
                      <div className={styles.formGroup}>
                        <label htmlFor="ctaCity">City *</label>
                        <input
                          type="text"
                          id="ctaCity"
                          name="city"
                          required
                          value={formData.city}
                          onChange={handleChange}
                        />
                      </div>
                      <div className={styles.formGroup}>
                        <label htmlFor="ctaState">State *</label>
                        <input
                          type="text"
                          id="ctaState"
                          name="state"
                          required
                          value={formData.state}
                          onChange={handleChange}
                        />
                      </div>
                      <div className={styles.formGroup}>
                        <label htmlFor="ctaZip">ZIP Code *</label>
                        <input
                          type="text"
                          id="ctaZip"
                          name="zip"
                          required
                          value={formData.zip}
                          onChange={handleChange}
                        />
                      </div>
                    </div>
                  </>
                )}

                {submitStatus === 'error' && (
                  <p className={styles.formError}>There was an error processing your request. Please try again.</p>
                )}

                <div className={styles.formActions}>
                  <button type="submit" className="btn" disabled={isSubmitting}>
                    {isSubmitting ? 'Processing...' : 'Submit'}
                  </button>
                </div>
              </form>
            )}

            {step === 'success' && (
              <div className={styles.modalStep}>
                <h4>Your Brochure is Ready</h4>
                {brochureType === 'digital' ? (
                  <a
                    href="/files/SBD Interactive Brochure.pdf"
                    download="SBD Interactive Brochure.pdf"
                    className={`btn ${styles.downloadBtn}`}
                  >
                    Download Brochure
                  </a>
                ) : (
                  <p>Thanks! Your brochure will be mailed to you shortly.</p>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}

