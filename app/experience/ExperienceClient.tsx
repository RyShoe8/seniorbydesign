'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import type { DesignGuideContent } from '@/lib/design-guide-models';
import PresentationHero from '@/components/presentation/PresentationHero';
import AnimatedStats from '@/components/presentation/AnimatedStats';
import FeatureCards from '@/components/presentation/FeatureCards';
import ServiceShowcase from '@/components/presentation/ServiceShowcase';
import ProcessTimeline from '@/components/presentation/ProcessTimeline';
import PresentationGallery from '@/components/presentation/PresentationGallery';
import TestimonialCarousel from '@/components/presentation/TestimonialCarousel';
import PresentationCTA from '@/components/presentation/PresentationCTA';
import PresentationNav from '@/components/presentation/PresentationNav';
import SectionReveal from '@/components/presentation/SectionReveal';
import PDFExportButton from '@/components/presentation/PDFExportButton';
import styles from './experience.module.css';

interface ExperienceClientProps {
  content: DesignGuideContent | null;
  portfolioImages: Array<{ src: string; alt: string; category?: string; caption?: string }>;
  existingTestimonials: Array<{ quote: string; name: string; title?: string; rating?: number }>;
}

const NAV_SECTIONS = [
  { id: 'hero', label: 'Home' },
  { id: 'intro', label: 'About' },
  { id: 'why-us', label: 'Why Us' },
  { id: 'services', label: 'Services' },
  { id: 'aging-in-place', label: 'Our Approach' },
  { id: 'process', label: 'Process' },
  { id: 'portfolio', label: 'Portfolio' },
  { id: 'testimonials', label: 'Testimonials' },
  { id: 'faq', label: 'FAQ' },
  { id: 'contact', label: 'Contact' },
];

export default function ExperienceClient({
  content,
  portfolioImages,
  existingTestimonials,
}: ExperienceClientProps) {
  const [scrolled, setScrolled] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 100);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // If no content yet, show a seed prompt
  if (!content) {
    return (
      <div className={styles.experience} style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        minHeight: '100vh', flexDirection: 'column', gap: '1.5rem',
        padding: '2rem', textAlign: 'center',
      }}>
        <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '2.5rem', color: 'var(--sbd-brown)' }}>
          The Senior By Design Experience
        </h1>
        <p style={{ color: 'var(--text-muted)', maxWidth: 500, lineHeight: 1.7 }}>
          Content has not been set up yet. Please visit the admin panel to seed the initial content or configure your Design Guide.
        </p>
        <Link
          href="/admin/design-guide"
          style={{
            padding: '0.875rem 2rem',
            background: 'var(--sbd-gold)',
            color: '#fff',
            borderRadius: '8px',
            fontWeight: 600,
            textDecoration: 'none',
          }}
        >
          Go to Admin Panel
        </Link>
      </div>
    );
  }

  // Resolve testimonials and portfolio
  const testimonials = content.testimonials.useExistingTestimonials
    ? existingTestimonials
    : content.testimonials.items;

  const galleryImages = content.portfolio.useExistingPortfolio
    ? portfolioImages
    : content.portfolio.images;

  return (
    <div className={styles.experience}>
      {/* Floating navigation */}
      <PresentationNav sections={NAV_SECTIONS} />

      {/* Floating top bar */}
      <div className={`${styles.floatingActions} ${scrolled ? styles.floatingActionsVisible : ''}`}>
        <Link href="/" className={styles.floatingBtn}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          Home
        </Link>
        <PDFExportButton label="Download Guide" />
      </div>

      {/* ============================================================
          HERO
          ============================================================ */}
      <PresentationHero hero={content.hero} />

      {/* ============================================================
          COMPANY INTRODUCTION
          ============================================================ */}
      <section className={styles.section} id="intro">
        <div className={styles.container}>
          <SectionReveal direction="up">
            <span className={styles.sectionEyebrow}>About Us</span>
            <h2 className={styles.sectionHeading}>{content.intro.headline}</h2>
            <hr className={styles.divider} />
          </SectionReveal>

          <div className={styles.introGrid}>
            <SectionReveal direction="left" delay={200}>
              <p className={styles.introBody}>{content.intro.body}</p>
            </SectionReveal>
            {content.intro.cards.length > 0 && content.intro.cards[3]?.image?.src && (
              <SectionReveal direction="right" delay={300}>
                <div className={styles.introImageWrap}>
                  <Image
                    src={content.intro.cards[3].image!.src}
                    alt={content.intro.cards[3].image!.alt}
                    fill
                    className={styles.introImage}
                    sizes="(max-width: 768px) 100vw, 50vw"
                    loading="lazy"
                  />
                </div>
              </SectionReveal>
            )}
          </div>

          <SectionReveal direction="up" delay={100}>
            <AnimatedStats stats={content.intro.stats} />
          </SectionReveal>

          {content.intro.cards.length > 0 && (
            <div className={styles.introCardsGrid}>
              {content.intro.cards.map((card, i) => (
                <SectionReveal key={i} direction="up" delay={i * 100}>
                  <div className={styles.introCard}>
                    <span className={styles.introCardIcon}>{card.icon}</span>
                    <h3 className={styles.introCardTitle}>{card.title}</h3>
                    <p className={styles.introCardDesc}>{card.description}</p>
                  </div>
                </SectionReveal>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ============================================================
          WHY SENIOR BY DESIGN
          ============================================================ */}
      <section className={`${styles.section} ${styles.sectionAlt}`} id="why-us">
        <div className={styles.container}>
          <SectionReveal direction="up">
            <span className={styles.sectionEyebrow}>What Sets Us Apart</span>
            <h2 className={styles.sectionHeading}>{content.whyUs.headline}</h2>
            <hr className={styles.divider} />
            {content.whyUs.subheadline && (
              <p className={styles.sectionSubheading}>{content.whyUs.subheadline}</p>
            )}
          </SectionReveal>

          <FeatureCards cards={content.whyUs.cards} />
        </div>
      </section>

      {/* ============================================================
          SERVICES
          ============================================================ */}
      <section className={styles.section} id="services">
        <div className={styles.container}>
          <SectionReveal direction="up">
            <span className={styles.sectionEyebrow}>What We Do</span>
            <h2 className={styles.sectionHeading}>{content.services.headline}</h2>
            <hr className={styles.divider} />
            {content.services.subheadline && (
              <p className={styles.sectionSubheading}>{content.services.subheadline}</p>
            )}
          </SectionReveal>

          <ServiceShowcase services={content.services.items} />
        </div>
      </section>

      {/* ============================================================
          AGING IN PLACE / OUR APPROACH
          ============================================================ */}
      <section className={`${styles.section} ${styles.sectionAlt}`} id="aging-in-place">
        <div className={styles.container}>
          <SectionReveal direction="up">
            <span className={styles.sectionEyebrow}>Our Approach</span>
            <h2 className={styles.sectionHeading}>{content.agingInPlace.headline}</h2>
            <hr className={styles.divider} />
          </SectionReveal>

          <div className={styles.agingGrid}>
            <div className={styles.agingContent}>
              <SectionReveal direction="left" delay={100}>
                <p className={styles.agingBody}>{content.agingInPlace.body}</p>
              </SectionReveal>

              <SectionReveal direction="up" delay={200}>
                <AnimatedStats stats={content.agingInPlace.stats} />
              </SectionReveal>

              {content.agingInPlace.features.length > 0 && (
                <div className={styles.agingFeatures}>
                  {content.agingInPlace.features.map((feature, i) => (
                    <SectionReveal key={i} direction="up" delay={300 + i * 100}>
                      <div className={styles.agingFeature}>
                        <span className={styles.agingFeatureIcon}>{feature.icon}</span>
                        <div>
                          <h4 className={styles.agingFeatureTitle}>{feature.title}</h4>
                          <p className={styles.agingFeatureDesc}>{feature.description}</p>
                        </div>
                      </div>
                    </SectionReveal>
                  ))}
                </div>
              )}
            </div>

            {content.agingInPlace.image?.src && (
              <SectionReveal direction="right" delay={200}>
                <div className={styles.agingImageWrap}>
                  <Image
                    src={content.agingInPlace.image.src}
                    alt={content.agingInPlace.image.alt}
                    fill
                    className={styles.agingImage}
                    sizes="(max-width: 768px) 100vw, 50vw"
                    loading="lazy"
                  />
                </div>
              </SectionReveal>
            )}
          </div>
        </div>
      </section>

      {/* ============================================================
          PROCESS TIMELINE
          ============================================================ */}
      <section className={styles.section} id="process">
        <div className={styles.container}>
          <div className={styles.sectionCenter}>
            <SectionReveal direction="up">
              <span className={styles.sectionEyebrow}>How We Work</span>
              <h2 className={styles.sectionHeading}>{content.process.headline}</h2>
              <hr className={styles.divider} />
              {content.process.subheadline && (
                <p className={styles.sectionSubheading}>{content.process.subheadline}</p>
              )}
            </SectionReveal>
          </div>

          <ProcessTimeline steps={content.process.steps} />
        </div>
      </section>

      {/* ============================================================
          PORTFOLIO
          ============================================================ */}
      {galleryImages.length > 0 && (
        <section className={`${styles.section} ${styles.sectionAlt}`} id="portfolio">
          <div className={styles.container}>
            <div className={styles.sectionCenter}>
              <SectionReveal direction="up">
                <span className={styles.sectionEyebrow}>Portfolio</span>
                <h2 className={styles.sectionHeading}>{content.portfolio.headline}</h2>
                <hr className={styles.divider} />
                {content.portfolio.subheadline && (
                  <p className={styles.sectionSubheading}>{content.portfolio.subheadline}</p>
                )}
              </SectionReveal>
            </div>

            <PresentationGallery images={galleryImages} />
          </div>
        </section>
      )}

      {/* ============================================================
          TESTIMONIALS
          ============================================================ */}
      {testimonials.length > 0 && (
        <section className={styles.section} id="testimonials">
          <div className={styles.container}>
            <div className={styles.sectionCenter}>
              <SectionReveal direction="up">
                <span className={styles.sectionEyebrow}>Client Stories</span>
                <h2 className={styles.sectionHeading}>{content.testimonials.headline}</h2>
                <hr className={styles.divider} />
                {content.testimonials.subheadline && (
                  <p className={styles.sectionSubheading}>{content.testimonials.subheadline}</p>
                )}
              </SectionReveal>
            </div>

            <SectionReveal direction="up" delay={200}>
              <TestimonialCarousel testimonials={testimonials} />
            </SectionReveal>
          </div>
        </section>
      )}

      {/* ============================================================
          FINANCING
          ============================================================ */}
      <section className={`${styles.section} ${styles.sectionAlt}`} id="financing">
        <div className={styles.container}>
          <div className={`${styles.sectionCenter} ${styles.financingContent}`}>
            <SectionReveal direction="up">
              <span className={styles.sectionEyebrow}>Investment</span>
              <h2 className={styles.sectionHeading}>{content.financing.headline}</h2>
              <hr className={styles.divider} />
              <p className={styles.financingBody}>{content.financing.body}</p>
            </SectionReveal>

            {content.financing.examples && content.financing.examples.length > 0 && (
              <div className={styles.financingExamples}>
                {content.financing.examples.map((ex, i) => (
                  <SectionReveal key={i} direction="up" delay={i * 120}>
                    <div className={styles.financingCard}>
                      <span className={styles.financingLabel}>{ex.label}</span>
                      <span className={styles.financingValue}>{ex.value}</span>
                    </div>
                  </SectionReveal>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ============================================================
          FAQ
          ============================================================ */}
      {content.faq.items.length > 0 && (
        <section className={styles.section} id="faq">
          <div className={styles.container}>
            <div className={styles.sectionCenter}>
              <SectionReveal direction="up">
                <span className={styles.sectionEyebrow}>Questions</span>
                <h2 className={styles.sectionHeading}>{content.faq.headline}</h2>
                <hr className={styles.divider} />
              </SectionReveal>
            </div>

            <div className={styles.faqList}>
              {content.faq.items.map((item, i) => (
                <SectionReveal key={i} direction="up" delay={i * 80}>
                  <div className={styles.faqItem}>
                    <button
                      className={styles.faqQuestion}
                      onClick={() => setOpenFaq(openFaq === i ? null : i)}
                      aria-expanded={openFaq === i}
                    >
                      {item.question}
                      <svg
                        className={`${styles.faqChevron} ${openFaq === i ? styles.faqChevronOpen : ''}`}
                        viewBox="0 0 24 24"
                        fill="none"
                      >
                        <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                      </svg>
                    </button>
                    <div
                      className={styles.faqAnswer}
                      style={{
                        maxHeight: openFaq === i ? '300px' : '0',
                        opacity: openFaq === i ? 1 : 0,
                      }}
                    >
                      <p className={styles.faqAnswerText}>{item.answer}</p>
                    </div>
                  </div>
                </SectionReveal>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ============================================================
          CTA / CONTACT
          ============================================================ */}
      <PresentationCTA cta={content.cta} />

      {/* ============================================================
          FOOTER
          ============================================================ */}
      <footer style={{
        textAlign: 'center',
        padding: '2rem',
        background: 'var(--exp-bg-dark, #1A1410)',
        color: 'rgba(255,255,255,0.4)',
        fontSize: '0.8rem',
        fontFamily: 'var(--font-body)',
      }}>
        © {new Date().getFullYear()} Senior By Design. All rights reserved.
      </footer>
    </div>
  );
}
