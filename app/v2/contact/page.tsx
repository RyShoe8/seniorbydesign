'use client';

import { useState } from 'react';
import SeoImage from '@/components/v2/SeoImage';
import { getRecaptchaToken } from '@/lib/recaptcha-client';
import { heroAlt, STATIC_IMAGES } from '@/lib/image-seo';
import {
  CONTACT_INTRO,
  ORG_EMAIL,
  formatAddressLines,
  formatPhoneDisplay,
  formatPhoneTel,
  formatStudioLines,
  getWarehouseLabel,
} from '@/lib/geo-entity';
import styles from './page.module.css';

export default function Contact() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    company: '',
    zip: '',
    website: '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const formatPhoneNumber = (phone: string): string => {
    if (!phone) return phone;

    // Remove all non-digit characters
    const digitsOnly = phone.replace(/\D/g, '');

    // If phone number doesn't start with 1, add it
    if (digitsOnly.length > 0 && !digitsOnly.startsWith('1')) {
      return `1${digitsOnly}`;
    }

    return digitsOnly.startsWith('1') ? digitsOnly : phone;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus('idle');

    try {
      let recaptchaToken: string;
      try {
        recaptchaToken = await getRecaptchaToken('contact');
      } catch {
        setSubmitStatus('error');
        return;
      }

      // Format phone number and website URL before submitting
      const formattedData = {
        ...formData,
        phone: formData.phone ? formatPhoneNumber(formData.phone) : formData.phone,
        website: formData.website ? formatWebsite(formData.website) : '',
        recaptchaToken,
      };

      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formattedData),
      });

      if (response.ok) {
        setSubmitStatus('success');
        setFormData({
          firstName: '',
          lastName: '',
          phone: '',
          email: '',
          company: '',
          zip: '',
          website: '',
          message: '',
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

  const formatWebsite = (url: string): string => {
    if (!url) return '';
    // Remove whitespace
    url = url.trim();
    if (!url) return '';

    // Remove www. if present
    url = url.replace(/^www\./i, '');

    // Remove http:// or https:// if present
    url = url.replace(/^https?:\/\//i, '');

    // Add https:// if not empty
    if (url) {
      url = `https://${url}`;
    }

    return url;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleWebsiteBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    if (e.target.value) {
      const formatted = formatWebsite(e.target.value);
      setFormData({
        ...formData,
        website: formatted,
      });
    }
  };

  return (
    <>
      <section className={`${styles.contactHero} sbd-page-hero`}>
        <div className={styles.contactHeroImage}>
          <SeoImage
            src={STATIC_IMAGES.teamHero}
            alt={heroAlt('contact')}
            fill
            className={styles.heroImage}
            priority
          />
          <h1>Contact Us</h1>
        </div>
      </section>

      <section className={`contact-content ${styles.contactBody} reveal-on-scroll`}>
        <div className={`container ${styles.contactGrid}`}>
          <aside className={styles.concierge}>
            <span className={styles.eyebrow}>Enquiries</span>
            <h2>Contact Senior By Design</h2>
            <p className={styles.conciergeIntro}>{CONTACT_INTRO}</p>

            <div className={styles.direct}>
              <span className={styles.placeLabel}>Call</span>
              <a className={styles.phone} href={`tel:${formatPhoneTel()}`}>
                {formatPhoneDisplay()}
              </a>
              <span className={styles.placeLabel}>Email</span>
              <a className={styles.email} href={`mailto:${ORG_EMAIL}`}>
                {ORG_EMAIL}
              </a>
            </div>

            <address className={styles.places} aria-label="Senior By Design locations">
              <div>
                <span className={styles.placeLabel}>Design Studios</span>
                {formatStudioLines().map((line) => (
                  <span key={line} className={styles.placeLine}>
                    {line}
                  </span>
                ))}
              </div>
              <div>
                <span className={styles.placeLabel}>{getWarehouseLabel()}</span>
                {formatAddressLines().map((line) => (
                  <span key={line} className={styles.placeLine}>
                    {line}
                  </span>
                ))}
              </div>
            </address>
          </aside>

          <div className={styles.enquiry}>
            <span className={styles.eyebrow}>Write to us</span>
            <h2>Drop us a Note</h2>
              <form onSubmit={handleSubmit} className="contact-form">
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

                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label htmlFor="phone">Phone #</label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                    />
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
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="company">Company</label>
                  <input
                    type="text"
                    id="company"
                    name="company"
                    value={formData.company}
                    onChange={handleChange}
                  />
                </div>

                <div className={styles.formRow}>
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
                      type="text"
                      id="website"
                      name="website"
                      value={formData.website}
                      onChange={handleChange}
                      onBlur={handleWebsiteBlur}
                      placeholder="example.com"
                    />
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="message">Message *</label>
                  <textarea
                    id="message"
                    name="message"
                    rows={6}
                    required
                    value={formData.message}
                    onChange={handleChange}
                  />
                </div>

                {submitStatus === 'success' && (
                  <div className={`${styles.formMessage} ${styles.success}`} role="status">
                    Thank you! Your message has been sent successfully.
                  </div>
                )}

                {submitStatus === 'error' && (
                  <div className={`${styles.formMessage} ${styles.error}`} role="alert">
                    There was an error sending your message. Please try again.
                  </div>
                )}

                <button type="submit" className={`btn ${styles.send}`} disabled={isSubmitting}>
                  {isSubmitting ? 'Sending…' : 'Send Message'}
                  {!isSubmitting && <span aria-hidden="true">→</span>}
                </button>
              </form>
          </div>
        </div>
      </section>
    </>
  );
}
