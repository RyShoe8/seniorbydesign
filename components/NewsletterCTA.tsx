'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { getRecaptchaToken } from '@/lib/recaptcha-client';
import styles from './NewsletterCTA.module.css';

// Dynamically import PDF.js only on client side
let pdfjsLib: any = null;

const loadPDFJS = async () => {
  if (typeof window !== 'undefined' && !pdfjsLib) {
    pdfjsLib = await import('pdfjs-dist');
    pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
  }
  return pdfjsLib;
};

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
    website: '',
    newsletter: false,
  });
  const [stateDropdownOpen, setStateDropdownOpen] = useState(false);
  const [stateSearchValue, setStateSearchValue] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const stateDropdownRef = useRef<HTMLDivElement>(null);
  const stateInputRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const submitButtonRef = useRef<HTMLButtonElement>(null);
  const [brochurePreview, setBrochurePreview] = useState<string | null>(null);

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

  // Load brochure preview (first page)
  useEffect(() => {
    const loadBrochurePreview = async () => {
      try {
        const pdfjs = await loadPDFJS();
        if (!pdfjs) return;

        const loadingTask = pdfjs.getDocument('/files/SBD Interactive Brochure.pdf');
        const pdf = await loadingTask.promise;
        const page = await pdf.getPage(1);
        
        // Render at a reasonable size for button preview
        const viewport = page.getViewport({ scale: 0.5 });
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        if (!context) return;

        canvas.height = viewport.height;
        canvas.width = viewport.width;

        await page.render({
          canvasContext: context,
          viewport: viewport,
        }).promise;

        // Convert to data URL
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        setBrochurePreview(dataUrl);
      } catch (error) {
        console.error('Error loading brochure preview:', error);
        // Silently fail - button will just show without preview
      }
    };

    loadBrochurePreview();
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
    });
    setStateSearchValue('');
    setStateDropdownOpen(false);
    setHighlightedIndex(-1);
  };

  const handleChoice = (choice: 'digital' | 'physical') => {
    setBrochureType(choice);
    setStep('form');
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value: any = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    
    // Format website URL before storing
    if (e.target.name === 'website' && e.target.type !== 'checkbox') {
      // Don't format while typing, only format on blur
      // Store the raw value for display
    }
    
    setFormData({
      ...formData,
      [e.target.name]: value,
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

  // Handle input focus to scroll into view (for mobile keyboard)
  const handleInputFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    // Delay to ensure keyboard has opened and viewport has adjusted
    setTimeout(() => {
      const input = e.target;
      const modal = modalRef.current;
      const submitButton = submitButtonRef.current;
      
      if (modal && input) {
        const viewportHeight = window.innerHeight;
        const estimatedKeyboardHeight = viewportHeight * 0.4;
        const availableHeight = viewportHeight - estimatedKeyboardHeight;
        
        // Get positions
        const inputRect = input.getBoundingClientRect();
        const submitRect = submitButton?.getBoundingClientRect();
        const modalRect = modal.getBoundingClientRect();
        
        // Calculate how much space we need for input + submit button
        const inputBottom = inputRect.bottom;
        const submitHeight = submitRect ? submitRect.height + 20 : 80; // 20px padding
        const neededSpace = inputBottom + submitHeight;
        
        // Check if submit button would be hidden
        if (neededSpace > availableHeight) {
          // Scroll to ensure both input and submit button are visible
          const scrollAmount = neededSpace - availableHeight + 40; // Extra padding
          modal.scrollBy({
            top: scrollAmount,
            behavior: 'smooth',
          });
        } else if (inputRect.bottom > availableHeight - submitHeight) {
          // Input is too low, scroll it up a bit
          const scrollAmount = inputRect.bottom - (availableHeight - submitHeight) + 20;
          modal.scrollBy({
            top: scrollAmount,
            behavior: 'smooth',
          });
        }
      }
    }, 400); // Slightly longer delay to ensure keyboard is fully open
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus('idle');

    try {
      let recaptchaToken: string;
      try {
        recaptchaToken = await getRecaptchaToken('newsletter');
      } catch {
        setSubmitStatus('error');
        return;
      }

      // Format website URL before submitting
      const formattedData = {
        ...formData,
        website: formData.website ? formatWebsite(formData.website) : '',
        brochureType,
        recaptchaToken,
      };
      
      const response = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formattedData),
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
          website: '',
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
        <button 
          type="button" 
          className={`btn ${styles.brochureButton}`}
          onClick={openModal}
          style={brochurePreview ? {
            backgroundImage: `url(${brochurePreview})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            position: 'relative',
          } : {}}
        >
          <span className={styles.brochureButtonText}>Get the brochure</span>
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
          <div className={styles.modal} ref={modalRef}>
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
                      onFocus={handleInputFocus}
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
                      onFocus={handleInputFocus}
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
                    onFocus={handleInputFocus}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="ctaWebsite">Your Website</label>
                  <input
                    type="text"
                    id="ctaWebsite"
                    name="website"
                    value={formData.website}
                    onChange={handleChange}
                    onBlur={handleWebsiteBlur}
                    onFocus={handleInputFocus}
                    placeholder="example.com"
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
                        onFocus={handleInputFocus}
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
                        onFocus={handleInputFocus}
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
                          onFocus={handleInputFocus}
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
                            onFocus={(e) => {
                              handleStateInputFocus();
                              handleInputFocus(e);
                            }}
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
                          onFocus={handleInputFocus}
                        />
                      </div>
                    </div>
                  </>
                )}

                {submitStatus === 'error' && (
                  <p className={styles.formError}>There was an error processing your request. Please try again.</p>
                )}

                <div className={styles.formActions}>
                  <button 
                    type="submit" 
                    className="btn" 
                    disabled={isSubmitting}
                    ref={submitButtonRef}
                  >
                    {isSubmitting ? 'Processing...' : 'Submit'}
                  </button>
                </div>
              </form>
            )}

            {step === 'success' && (
              <div className={styles.modalStep}>
                <h4>Your Brochure is Ready</h4>
                {brochureType === 'digital' ? (
                  <div className={styles.brochureActions}>
                    <Link
                      href="/brochure/view"
                      className={`btn ${styles.viewBtn}`}
                      onClick={closeModal}
                    >
                      View Brochure
                    </Link>
                    <a
                      href="/files/SBD Interactive Brochure.pdf"
                      download="SBD Interactive Brochure.pdf"
                      className={`btn ${styles.downloadBtn}`}
                    >
                      Download Brochure
                    </a>
                  </div>
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

