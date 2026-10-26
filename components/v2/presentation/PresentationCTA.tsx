'use client';

import { useState } from 'react';
import Image from 'next/image';
import type { DGCTA } from '@/lib/design-guide-models';
import SectionReveal from './SectionReveal';
import styles from './PresentationCTA.module.css';

interface PresentationCTAProps {
  cta: DGCTA;
}

export default function PresentationCTA({ cta }: PresentationCTAProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: '',
  });
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('sending');
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: formData.name.split(' ')[0] || formData.name,
          lastName: formData.name.split(' ').slice(1).join(' ') || '',
          email: formData.email,
          phone: formData.phone,
          message: `[From Design Guide] ${formData.message}`,
          company: '',
          zip: '',
          website: '',
        }),
      });
      if (res.ok) {
        setStatus('success');
        setFormData({ name: '', email: '', phone: '', message: '' });
      } else {
        setStatus('error');
      }
    } catch {
      setStatus('error');
    }
  };

  return (
    <section className={styles.section} id="contact">
      {/* Background */}
      {cta.backgroundImage?.src && (
        <div className={styles.bgWrap}>
          <Image
            src={cta.backgroundImage.src}
            alt={cta.backgroundImage.alt || ''}
            fill
            className={styles.bgImage}
            sizes="100vw"
            loading="lazy"
          />
          <div className={styles.bgOverlay} />
        </div>
      )}

      <div className={styles.container}>
        <SectionReveal direction="up" duration={800}>
          <div className={styles.textContent}>
            <h2 className={styles.headline}>{cta.headline}</h2>
            <p className={styles.subheadline}>{cta.subheadline}</p>

            <div className={styles.contactInfo}>
              <a href={`tel:${cta.phone.replace(/[^0-9+]/g, '')}`} className={styles.contactLink}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                {cta.phone}
              </a>
              <a href={`mailto:${cta.email}`} className={styles.contactLink}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <rect x="2" y="4" width="20" height="16" rx="2" stroke="currentColor" strokeWidth="1.5"/>
                  <path d="M22 7l-10 7L2 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                {cta.email}
              </a>
            </div>
          </div>
        </SectionReveal>

        {cta.showConsultationForm && (
          <SectionReveal direction="up" delay={200} duration={800}>
            <form className={styles.form} onSubmit={handleSubmit}>
              <h3 className={styles.formHeading}>Schedule a Consultation</h3>

              <div className={styles.formGroup}>
                <input
                  type="text"
                  name="name"
                  placeholder="Your Name"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  className={styles.input}
                  id="cta-name"
                />
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <input
                    type="email"
                    name="email"
                    placeholder="Email Address"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    className={styles.input}
                    id="cta-email"
                  />
                </div>
                <div className={styles.formGroup}>
                  <input
                    type="tel"
                    name="phone"
                    placeholder="Phone (optional)"
                    value={formData.phone}
                    onChange={handleChange}
                    className={styles.input}
                    id="cta-phone"
                  />
                </div>
              </div>

              <div className={styles.formGroup}>
                <textarea
                  name="message"
                  placeholder="Tell us about your project..."
                  rows={4}
                  required
                  value={formData.message}
                  onChange={handleChange}
                  className={styles.textarea}
                  id="cta-message"
                />
              </div>

              {status === 'success' && (
                <div className={styles.successMsg}>
                  Thank you! We&apos;ll be in touch shortly.
                </div>
              )}

              {status === 'error' && (
                <div className={styles.errorMsg}>
                  Something went wrong. Please try again.
                </div>
              )}

              <button
                type="submit"
                className={styles.submitBtn}
                disabled={status === 'sending'}
              >
                {status === 'sending' ? 'Sending...' : 'Send Message'}
              </button>
            </form>
          </SectionReveal>
        )}
      </div>
    </section>
  );
}
