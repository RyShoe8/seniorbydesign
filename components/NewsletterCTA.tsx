'use client';

import { useEffect, useState, useRef } from 'react';
import styles from './NewsletterCTA.module.css';

const US_STATES = [
  { value: 'AL', label: 'Alabama' },
  { value: 'AK', label: 'Alaska' },
  { value: 'AZ', label: 'Arizona' },
  { value: 'AR', label: 'Arkansas' },
  { value: 'CA', label: 'California' },
  { value: 'CO', label: 'Colorado' },
  { value: 'CT', label: 'Connecticut' },
  { value: 'DE', label: 'Delaware' },
  { value: 'FL', label: 'Florida' },
  { value: 'GA', label: 'Georgia' },
  { value: 'HI', label: 'Hawaii' },
  { value: 'ID', label: 'Idaho' },
  { value: 'IL', label: 'Illinois' },
  { value: 'IN', label: 'Indiana' },
  { value: 'IA', label: 'Iowa' },
  { value: 'KS', label: 'Kansas' },
  { value: 'KY', label: 'Kentucky' },
  { value: 'LA', label: 'Louisiana' },
  { value: 'ME', label: 'Maine' },
  { value: 'MD', label: 'Maryland' },
  { value: 'MA', label: 'Massachusetts' },
  { value: 'MI', label: 'Michigan' },
  { value: 'MN', label: 'Minnesota' },
  { value: 'MS', label: 'Mississippi' },
  { value: 'MO', label: 'Missouri' },
  { value: 'MT', label: 'Montana' },
  { value: 'NE', label: 'Nebraska' },
  { value: 'NV', label: 'Nevada' },
  { value: 'NH', label: 'New Hampshire' },
  { value: 'NJ', label: 'New Jersey' },
  { value: 'NM', label: 'New Mexico' },
  { value: 'NY', label: 'New York' },
  { value: 'NC', label: 'North Carolina' },
  { value: 'ND', label: 'North Dakota' },
  { value: 'OH', label: 'Ohio' },
  { value: 'OK', label: 'Oklahoma' },
  { value: 'OR', label: 'Oregon' },
  { value: 'PA', label: 'Pennsylvania' },
  { value: 'RI', label: 'Rhode Island' },
  { value: 'SC', label: 'South Carolina' },
  { value: 'SD', label: 'South Dakota' },
  { value: 'TN', label: 'Tennessee' },
  { value: 'TX', label: 'Texas' },
  { value: 'UT', label: 'Utah' },
  { value: 'VT', label: 'Vermont' },
  { value: 'VA', label: 'Virginia' },
  { value: 'WA', label: 'Washington' },
  { value: 'WV', label: 'West Virginia' },
  { value: 'WI', label: 'Wisconsin' },
  { value: 'WY', label: 'Wyoming' },
];

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
  const [stateDropdownOpen, setStateDropdownOpen] = useState(false);
  const [stateSearchValue, setStateSearchValue] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const stateDropdownRef = useRef<HTMLDivElement>(null);
  const stateInputRef = useRef<HTMLInputElement>(null);

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
    
    // Prevent body scroll when modal is open
    const originalStyle = window.getComputedStyle(document.body).overflow;
    document.body.style.overflow = 'hidden';
    
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closeModal();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = originalStyle;
    };
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
    setStateSearchValue('');
    setStateDropdownOpen(false);
    setHighlightedIndex(-1);
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

  const filteredStates = US_STATES.filter(
    (state) =>
      state.label.toLowerCase().includes(stateSearchValue.toLowerCase()) ||
      state.value.toLowerCase().includes(stateSearchValue.toLowerCase())
  );

  const handleStateInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setStateSearchValue(value);
    setStateDropdownOpen(true);
    setHighlightedIndex(-1);
    
    // If exact match found, auto-select it
    const exactMatch = US_STATES.find(
      (state) =>
        state.label.toLowerCase() === value.toLowerCase() ||
        state.value.toLowerCase() === value.toLowerCase()
    );
    if (exactMatch) {
      setFormData({ ...formData, state: exactMatch.value });
    } else {
      setFormData({ ...formData, state: value });
    }
  };

  const handleStateSelect = (state: { value: string; label: string }) => {
    setFormData({ ...formData, state: state.value });
    setStateSearchValue(state.label);
    setStateDropdownOpen(false);
    setHighlightedIndex(-1);
    stateInputRef.current?.blur();
  };

  const handleStateInputFocus = () => {
    setStateDropdownOpen(true);
  };

  const handleStateInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!stateDropdownOpen && filteredStates.length > 0) {
      if (e.key === 'ArrowDown' || e.key === 'Enter') {
        e.preventDefault();
        setStateDropdownOpen(true);
        return;
      }
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((prev) =>
        prev < filteredStates.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : -1));
    } else if (e.key === 'Enter' && highlightedIndex >= 0) {
      e.preventDefault();
      handleStateSelect(filteredStates[highlightedIndex]);
    } else if (e.key === 'Escape') {
      setStateDropdownOpen(false);
      setHighlightedIndex(-1);
      stateInputRef.current?.blur();
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        stateDropdownRef.current &&
        !stateDropdownRef.current.contains(event.target as Node)
      ) {
        setStateDropdownOpen(false);
        setHighlightedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Update search value when formData.state changes externally
  useEffect(() => {
    if (formData.state) {
      const state = US_STATES.find((s) => s.value === formData.state);
      if (state) {
        setStateSearchValue(state.label);
      } else {
        setStateSearchValue(formData.state);
      }
    } else {
      setStateSearchValue('');
    }
  }, [formData.state]);

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
        setStateSearchValue('');
        setStateDropdownOpen(false);
        setHighlightedIndex(-1);
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

                    <div className={`${styles.formRow} ${styles.formRowThreeCol}`}>
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
                        <div className={styles.stateDropdown} ref={stateDropdownRef}>
                          <input
                            type="text"
                            id="ctaState"
                            name="state"
                            required
                            value={stateSearchValue}
                            onChange={handleStateInputChange}
                            onFocus={handleStateInputFocus}
                            onKeyDown={handleStateInputKeyDown}
                            ref={stateInputRef}
                            autoComplete="off"
                            placeholder="Select or type a state"
                          />
                          {stateDropdownOpen && filteredStates.length > 0 && (
                            <div className={styles.stateDropdownList}>
                              {filteredStates.map((state, index) => (
                                <div
                                  key={state.value}
                                  className={`${styles.stateDropdownItem} ${
                                    index === highlightedIndex ? styles.stateDropdownItemHighlighted : ''
                                  }`}
                                  onClick={() => handleStateSelect(state)}
                                  onMouseEnter={() => setHighlightedIndex(index)}
                                >
                                  <span className={styles.stateDropdownValue}>{state.value}</span>
                                  <span className={styles.stateDropdownLabel}>{state.label}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
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

