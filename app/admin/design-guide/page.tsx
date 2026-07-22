'use client';

import { useState, useEffect, useCallback } from 'react';
import type { DesignGuideContent } from '@/lib/design-guide-models';

type TabKey = 'hero' | 'intro' | 'whyUs' | 'services' | 'aging' | 'process' | 'testimonials' | 'portfolio' | 'financing' | 'faq' | 'cta';

const TABS: { key: TabKey; label: string }[] = [
  { key: 'hero', label: 'Hero' },
  { key: 'intro', label: 'Introduction' },
  { key: 'whyUs', label: 'Why Us' },
  { key: 'services', label: 'Services' },
  { key: 'aging', label: 'Aging in Place' },
  { key: 'process', label: 'Process' },
  { key: 'testimonials', label: 'Testimonials' },
  { key: 'portfolio', label: 'Portfolio' },
  { key: 'financing', label: 'Financing' },
  { key: 'faq', label: 'FAQ' },
  { key: 'cta', label: 'CTA' },
];

export default function DesignGuideAdmin() {
  const [content, setContent] = useState<DesignGuideContent | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>('hero');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');

  const fetchContent = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/design-guide');
      if (res.ok) {
        const data = await res.json();
        setContent(data);
      }
    } catch (e) {
      console.error('Error fetching design guide content:', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchContent(); }, [fetchContent]);

  const handleSeed = async () => {
    if (!confirm('This will seed initial Design Guide content. Continue?')) return;
    setIsSeeding(true);
    try {
      const res = await fetch('/api/admin/design-guide/seed', { method: 'POST' });
      if (res.ok) {
        setSaveMsg('Content seeded successfully!');
        fetchContent();
      } else {
        setSaveMsg('Error seeding content.');
      }
    } catch {
      setSaveMsg('Error seeding content.');
    } finally {
      setIsSeeding(false);
      setTimeout(() => setSaveMsg(''), 4000);
    }
  };

  const handleSave = async () => {
    if (!content) return;
    setIsSaving(true);
    setSaveMsg('');
    try {
      const res = await fetch('/api/admin/design-guide', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(content),
      });
      if (res.ok) {
        setSaveMsg('Saved successfully!');
        fetchContent();
      } else {
        setSaveMsg('Error saving.');
      }
    } catch {
      setSaveMsg('Error saving.');
    } finally {
      setIsSaving(false);
      setTimeout(() => setSaveMsg(''), 4000);
    }
  };

  // Helper to update nested content
  const updateField = (path: string, value: any) => {
    if (!content) return;
    const keys = path.split('.');
    const updated = JSON.parse(JSON.stringify(content));
    let obj: any = updated;
    for (let i = 0; i < keys.length - 1; i++) {
      obj = obj[keys[i]];
    }
    obj[keys[keys.length - 1]] = value;
    setContent(updated);
  };

  if (isLoading) return <p>Loading...</p>;

  if (!content) {
    return (
      <div className="admin-page">
        <h1>Design Guide</h1>
        <p style={{ marginBottom: '1rem' }}>No content found. Seed initial content to get started.</p>
        <button className="btn" onClick={handleSeed} disabled={isSeeding}>
          {isSeeding ? 'Seeding...' : 'Seed Initial Content'}
        </button>
        {saveMsg && <p style={{ marginTop: '1rem', color: 'var(--sbd-gold)' }}>{saveMsg}</p>}
      </div>
    );
  }

  return (
    <div className="admin-page">
      {/* Top Header & Cross links */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <h1 style={{ margin: 0 }}>Design Brochure Editor</h1>
          <p style={{ margin: '0.25rem 0 0', fontSize: '14px', color: 'var(--text-muted)' }}>
            Manage the content, imagery, and text for the interactive digital brochure.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <a href="/admin/brochure" className="btn" style={{ textDecoration: 'none', background: 'var(--warm-grey-1)', color: 'var(--sbd-brown)' }}>
            Brochure Requests & Settings
          </a>
          <a href="/experience" target="_blank" rel="noopener noreferrer" className="btn" style={{ textDecoration: 'none', background: 'var(--sbd-brown)' }}>
            Preview Digital Brochure
          </a>
          <button className="btn" onClick={handleSave} disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Save All Changes'}
          </button>
        </div>
      </div>

      {saveMsg && (
        <div style={{ padding: '0.75rem', background: saveMsg.includes('Error') ? '#f8d7da' : '#d4edda', borderRadius: '4px', marginBottom: '1rem', fontSize: '14px' }}>
          {saveMsg}
        </div>
      )}

      {/* Tab navigation */}
      <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap', marginBottom: '1.5rem', borderBottom: '2px solid var(--warm-grey-1)' }}>
        {TABS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            style={{
              padding: '0.6rem 1rem',
              background: activeTab === key ? 'var(--sbd-gold)' : 'transparent',
              color: activeTab === key ? '#fff' : 'var(--sbd-brown)',
              border: 'none',
              borderRadius: '4px 4px 0 0',
              cursor: 'pointer',
              fontWeight: activeTab === key ? 600 : 400,
              fontSize: '0.85rem',
              fontFamily: 'inherit',
              transition: 'all 200ms ease',
            }}
          >
            {label}
          </button>
        ))}
      </div>

      <div style={{ background: '#fff', padding: '1.5rem', borderRadius: '8px' }}>
        {/* ============ HERO ============ */}
        {activeTab === 'hero' && (
          <div>
            <h2 style={{ color: 'var(--sbd-brown)', marginBottom: '1rem' }}>Hero Section</h2>
            <FieldGroup label="Headline">
              <textarea rows={3} value={content.hero.headline} onChange={(e) => updateField('hero.headline', e.target.value)} />
            </FieldGroup>
            <FieldGroup label="Subheadline">
              <textarea rows={3} value={content.hero.subheadline} onChange={(e) => updateField('hero.subheadline', e.target.value)} />
            </FieldGroup>
            <FieldGroup label="Background Image URL">
              <input type="text" value={content.hero.backgroundImage.src} onChange={(e) => updateField('hero.backgroundImage.src', e.target.value)} />
            </FieldGroup>
            <FieldGroup label="Background Image Alt Text">
              <input type="text" value={content.hero.backgroundImage.alt} onChange={(e) => updateField('hero.backgroundImage.alt', e.target.value)} />
            </FieldGroup>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <FieldGroup label="Primary CTA Label">
                <input type="text" value={content.hero.ctaPrimary.label} onChange={(e) => updateField('hero.ctaPrimary.label', e.target.value)} />
              </FieldGroup>
              <FieldGroup label="Primary CTA Link">
                <input type="text" value={content.hero.ctaPrimary.href} onChange={(e) => updateField('hero.ctaPrimary.href', e.target.value)} />
              </FieldGroup>
              <FieldGroup label="Secondary CTA Label">
                <input type="text" value={content.hero.ctaSecondary.label} onChange={(e) => updateField('hero.ctaSecondary.label', e.target.value)} />
              </FieldGroup>
              <FieldGroup label="Secondary CTA Link">
                <input type="text" value={content.hero.ctaSecondary.href} onChange={(e) => updateField('hero.ctaSecondary.href', e.target.value)} />
              </FieldGroup>
            </div>
          </div>
        )}

        {/* ============ INTRODUCTION ============ */}
        {activeTab === 'intro' && (
          <div>
            <h2 style={{ color: 'var(--sbd-brown)', marginBottom: '1rem' }}>Introduction</h2>
            <FieldGroup label="Headline">
              <input type="text" value={content.intro.headline} onChange={(e) => updateField('intro.headline', e.target.value)} />
            </FieldGroup>
            <FieldGroup label="Body Text">
              <textarea rows={5} value={content.intro.body} onChange={(e) => updateField('intro.body', e.target.value)} />
            </FieldGroup>
            <h3 style={{ marginTop: '1.5rem', color: 'var(--sbd-brown)' }}>Statistics</h3>
            {content.intro.stats.map((stat, i) => (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 2fr 0.5fr auto', gap: '0.5rem', marginBottom: '0.5rem', alignItems: 'end' }}>
                <FieldGroup label={i === 0 ? 'Value' : undefined}>
                  <input type="text" value={stat.value} onChange={(e) => { const stats = [...content.intro.stats]; stats[i] = { ...stats[i], value: e.target.value }; updateField('intro.stats', stats); }} />
                </FieldGroup>
                <FieldGroup label={i === 0 ? 'Label' : undefined}>
                  <input type="text" value={stat.label} onChange={(e) => { const stats = [...content.intro.stats]; stats[i] = { ...stats[i], label: e.target.value }; updateField('intro.stats', stats); }} />
                </FieldGroup>
                <FieldGroup label={i === 0 ? 'Suffix' : undefined}>
                  <input type="text" value={stat.suffix || ''} onChange={(e) => { const stats = [...content.intro.stats]; stats[i] = { ...stats[i], suffix: e.target.value }; updateField('intro.stats', stats); }} />
                </FieldGroup>
                <button onClick={() => { const stats = content.intro.stats.filter((_, j) => j !== i); updateField('intro.stats', stats); }} style={{ padding: '0.5rem', border: 'none', background: '#f8d7da', borderRadius: '4px', cursor: 'pointer', color: '#721c24', minHeight: '40px' }}>✕</button>
              </div>
            ))}
            <button onClick={() => updateField('intro.stats', [...content.intro.stats, { value: '', label: '', suffix: '' }])} style={{ padding: '0.5rem 1rem', border: '1px dashed var(--warm-grey-3)', background: 'transparent', borderRadius: '4px', cursor: 'pointer', fontSize: '0.85rem', marginTop: '0.5rem' }}>
              + Add Statistic
            </button>
          </div>
        )}

        {/* ============ WHY US ============ */}
        {activeTab === 'whyUs' && (
          <div>
            <h2 style={{ color: 'var(--sbd-brown)', marginBottom: '1rem' }}>Why Senior By Design</h2>
            <FieldGroup label="Headline">
              <input type="text" value={content.whyUs.headline} onChange={(e) => updateField('whyUs.headline', e.target.value)} />
            </FieldGroup>
            <FieldGroup label="Subheadline">
              <textarea rows={2} value={content.whyUs.subheadline || ''} onChange={(e) => updateField('whyUs.subheadline', e.target.value)} />
            </FieldGroup>
            <h3 style={{ marginTop: '1.5rem', color: 'var(--sbd-brown)' }}>Cards</h3>
            {content.whyUs.cards.map((card, i) => (
              <div key={i} style={{ padding: '1rem', border: '1px solid var(--warm-grey-1)', borderRadius: '8px', marginBottom: '0.75rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr auto', gap: '0.5rem', alignItems: 'end' }}>
                  <FieldGroup label="Icon">
                    <input type="text" value={card.icon} onChange={(e) => { const cards = [...content.whyUs.cards]; cards[i] = { ...cards[i], icon: e.target.value }; updateField('whyUs.cards', cards); }} />
                  </FieldGroup>
                  <FieldGroup label="Title">
                    <input type="text" value={card.title} onChange={(e) => { const cards = [...content.whyUs.cards]; cards[i] = { ...cards[i], title: e.target.value }; updateField('whyUs.cards', cards); }} />
                  </FieldGroup>
                  <button onClick={() => updateField('whyUs.cards', content.whyUs.cards.filter((_, j) => j !== i))} style={{ padding: '0.5rem', border: 'none', background: '#f8d7da', borderRadius: '4px', cursor: 'pointer', color: '#721c24', minHeight: '40px' }}>✕</button>
                </div>
                <FieldGroup label="Description">
                  <textarea rows={2} value={card.description} onChange={(e) => { const cards = [...content.whyUs.cards]; cards[i] = { ...cards[i], description: e.target.value }; updateField('whyUs.cards', cards); }} />
                </FieldGroup>
              </div>
            ))}
            <button onClick={() => updateField('whyUs.cards', [...content.whyUs.cards, { icon: '⭐', title: '', description: '' }])} style={{ padding: '0.5rem 1rem', border: '1px dashed var(--warm-grey-3)', background: 'transparent', borderRadius: '4px', cursor: 'pointer', fontSize: '0.85rem' }}>
              + Add Card
            </button>
          </div>
        )}

        {/* ============ SERVICES ============ */}
        {activeTab === 'services' && (
          <div>
            <h2 style={{ color: 'var(--sbd-brown)', marginBottom: '1rem' }}>Services</h2>
            <FieldGroup label="Headline">
              <input type="text" value={content.services.headline} onChange={(e) => updateField('services.headline', e.target.value)} />
            </FieldGroup>
            <FieldGroup label="Subheadline">
              <textarea rows={2} value={content.services.subheadline || ''} onChange={(e) => updateField('services.subheadline', e.target.value)} />
            </FieldGroup>
            {content.services.items.map((svc, i) => (
              <div key={i} style={{ padding: '1rem', border: '1px solid var(--warm-grey-1)', borderRadius: '8px', marginBottom: '0.75rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <strong>Service {svc.order}</strong>
                  <button onClick={() => updateField('services.items', content.services.items.filter((_, j) => j !== i))} style={{ padding: '0.5rem', border: 'none', background: '#f8d7da', borderRadius: '4px', cursor: 'pointer', color: '#721c24' }}>✕</button>
                </div>
                <FieldGroup label="Title">
                  <input type="text" value={svc.title} onChange={(e) => { const items = [...content.services.items]; items[i] = { ...items[i], title: e.target.value }; updateField('services.items', items); }} />
                </FieldGroup>
                <FieldGroup label="Description">
                  <textarea rows={2} value={svc.description} onChange={(e) => { const items = [...content.services.items]; items[i] = { ...items[i], description: e.target.value }; updateField('services.items', items); }} />
                </FieldGroup>
                <FieldGroup label="Expanded Details">
                  <textarea rows={3} value={svc.details} onChange={(e) => { const items = [...content.services.items]; items[i] = { ...items[i], details: e.target.value }; updateField('services.items', items); }} />
                </FieldGroup>
                <FieldGroup label="Image URL">
                  <input type="text" value={svc.image.src} onChange={(e) => { const items = [...content.services.items]; items[i] = { ...items[i], image: { ...items[i].image, src: e.target.value } }; updateField('services.items', items); }} />
                </FieldGroup>
                <FieldGroup label="Image Alt Text">
                  <input type="text" value={svc.image.alt} onChange={(e) => { const items = [...content.services.items]; items[i] = { ...items[i], image: { ...items[i].image, alt: e.target.value } }; updateField('services.items', items); }} />
                </FieldGroup>
              </div>
            ))}
            <button onClick={() => updateField('services.items', [...content.services.items, { title: '', description: '', details: '', image: { src: '', alt: '' }, order: content.services.items.length + 1 }])} style={{ padding: '0.5rem 1rem', border: '1px dashed var(--warm-grey-3)', background: 'transparent', borderRadius: '4px', cursor: 'pointer', fontSize: '0.85rem' }}>
              + Add Service
            </button>
          </div>
        )}

        {/* ============ AGING IN PLACE ============ */}
        {activeTab === 'aging' && (
          <div>
            <h2 style={{ color: 'var(--sbd-brown)', marginBottom: '1rem' }}>Aging in Place / Our Approach</h2>
            <FieldGroup label="Headline">
              <input type="text" value={content.agingInPlace.headline} onChange={(e) => updateField('agingInPlace.headline', e.target.value)} />
            </FieldGroup>
            <FieldGroup label="Body">
              <textarea rows={5} value={content.agingInPlace.body} onChange={(e) => updateField('agingInPlace.body', e.target.value)} />
            </FieldGroup>
            <FieldGroup label="Section Image URL">
              <input type="text" value={content.agingInPlace.image?.src || ''} onChange={(e) => updateField('agingInPlace.image', { src: e.target.value, alt: content.agingInPlace.image?.alt || '' })} />
            </FieldGroup>
            <FieldGroup label="Section Image Alt">
              <input type="text" value={content.agingInPlace.image?.alt || ''} onChange={(e) => updateField('agingInPlace.image', { src: content.agingInPlace.image?.src || '', alt: e.target.value })} />
            </FieldGroup>
          </div>
        )}

        {/* ============ PROCESS ============ */}
        {activeTab === 'process' && (
          <div>
            <h2 style={{ color: 'var(--sbd-brown)', marginBottom: '1rem' }}>Process Timeline</h2>
            <FieldGroup label="Headline">
              <input type="text" value={content.process.headline} onChange={(e) => updateField('process.headline', e.target.value)} />
            </FieldGroup>
            <FieldGroup label="Subheadline">
              <textarea rows={2} value={content.process.subheadline || ''} onChange={(e) => updateField('process.subheadline', e.target.value)} />
            </FieldGroup>
            {content.process.steps.map((step, i) => (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '60px 60px 1fr 2fr auto', gap: '0.5rem', marginBottom: '0.5rem', alignItems: 'end' }}>
                <FieldGroup label={i === 0 ? 'Phase' : undefined}>
                  <input type="text" value={step.phase} onChange={(e) => { const steps = [...content.process.steps]; steps[i] = { ...steps[i], phase: e.target.value }; updateField('process.steps', steps); }} />
                </FieldGroup>
                <FieldGroup label={i === 0 ? 'Icon' : undefined}>
                  <input type="text" value={step.icon} onChange={(e) => { const steps = [...content.process.steps]; steps[i] = { ...steps[i], icon: e.target.value }; updateField('process.steps', steps); }} />
                </FieldGroup>
                <FieldGroup label={i === 0 ? 'Title' : undefined}>
                  <input type="text" value={step.title} onChange={(e) => { const steps = [...content.process.steps]; steps[i] = { ...steps[i], title: e.target.value }; updateField('process.steps', steps); }} />
                </FieldGroup>
                <FieldGroup label={i === 0 ? 'Description' : undefined}>
                  <input type="text" value={step.description} onChange={(e) => { const steps = [...content.process.steps]; steps[i] = { ...steps[i], description: e.target.value }; updateField('process.steps', steps); }} />
                </FieldGroup>
                <button onClick={() => updateField('process.steps', content.process.steps.filter((_, j) => j !== i))} style={{ padding: '0.5rem', border: 'none', background: '#f8d7da', borderRadius: '4px', cursor: 'pointer', color: '#721c24', minHeight: '40px' }}>✕</button>
              </div>
            ))}
            <button onClick={() => updateField('process.steps', [...content.process.steps, { phase: String(content.process.steps.length + 1).padStart(2, '0'), title: '', description: '', icon: '📋' }])} style={{ padding: '0.5rem 1rem', border: '1px dashed var(--warm-grey-3)', background: 'transparent', borderRadius: '4px', cursor: 'pointer', fontSize: '0.85rem', marginTop: '0.5rem' }}>
              + Add Step
            </button>
          </div>
        )}

        {/* ============ TESTIMONIALS ============ */}
        {activeTab === 'testimonials' && (
          <div>
            <h2 style={{ color: 'var(--sbd-brown)', marginBottom: '1rem' }}>Testimonials</h2>
            <FieldGroup label="Headline">
              <input type="text" value={content.testimonials.headline} onChange={(e) => updateField('testimonials.headline', e.target.value)} />
            </FieldGroup>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                <input type="checkbox" checked={content.testimonials.useExistingTestimonials} onChange={(e) => updateField('testimonials.useExistingTestimonials', e.target.checked)} style={{ width: '20px', height: '20px' }} />
                Use testimonials from Homepage Content
              </label>
              <p style={{ fontSize: '14px', color: 'var(--warm-grey-3)', marginLeft: '28px', marginTop: '0.25rem' }}>
                {content.testimonials.useExistingTestimonials
                  ? 'Testimonials will be pulled from the Homepage Content testimonials.'
                  : 'Enter custom testimonials below.'}
              </p>
            </div>
            {!content.testimonials.useExistingTestimonials && (
              <>
                {content.testimonials.items.map((t, i) => (
                  <div key={i} style={{ padding: '1rem', border: '1px solid var(--warm-grey-1)', borderRadius: '8px', marginBottom: '0.75rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                      <strong>Testimonial {i + 1}</strong>
                      <button onClick={() => updateField('testimonials.items', content.testimonials.items.filter((_, j) => j !== i))} style={{ padding: '0.25rem 0.5rem', border: 'none', background: '#f8d7da', borderRadius: '4px', cursor: 'pointer', color: '#721c24' }}>✕</button>
                    </div>
                    <FieldGroup label="Quote">
                      <textarea rows={3} value={t.quote} onChange={(e) => { const items = [...content.testimonials.items]; items[i] = { ...items[i], quote: e.target.value }; updateField('testimonials.items', items); }} />
                    </FieldGroup>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                      <FieldGroup label="Name">
                        <input type="text" value={t.name} onChange={(e) => { const items = [...content.testimonials.items]; items[i] = { ...items[i], name: e.target.value }; updateField('testimonials.items', items); }} />
                      </FieldGroup>
                      <FieldGroup label="Title/Company">
                        <input type="text" value={t.title || ''} onChange={(e) => { const items = [...content.testimonials.items]; items[i] = { ...items[i], title: e.target.value }; updateField('testimonials.items', items); }} />
                      </FieldGroup>
                    </div>
                  </div>
                ))}
                <button onClick={() => updateField('testimonials.items', [...content.testimonials.items, { quote: '', name: '', title: '' }])} style={{ padding: '0.5rem 1rem', border: '1px dashed var(--warm-grey-3)', background: 'transparent', borderRadius: '4px', cursor: 'pointer', fontSize: '0.85rem' }}>
                  + Add Testimonial
                </button>
              </>
            )}
          </div>
        )}

        {/* ============ PORTFOLIO ============ */}
        {activeTab === 'portfolio' && (
          <div>
            <h2 style={{ color: 'var(--sbd-brown)', marginBottom: '1rem' }}>Portfolio</h2>
            <FieldGroup label="Headline">
              <input type="text" value={content.portfolio.headline} onChange={(e) => updateField('portfolio.headline', e.target.value)} />
            </FieldGroup>
            <FieldGroup label="Subheadline">
              <textarea rows={2} value={content.portfolio.subheadline || ''} onChange={(e) => updateField('portfolio.subheadline', e.target.value)} />
            </FieldGroup>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                <input type="checkbox" checked={content.portfolio.useExistingPortfolio} onChange={(e) => updateField('portfolio.useExistingPortfolio', e.target.checked)} style={{ width: '20px', height: '20px' }} />
                Pull images from existing Portfolio categories
              </label>
            </div>
          </div>
        )}

        {/* ============ FINANCING ============ */}
        {activeTab === 'financing' && (
          <div>
            <h2 style={{ color: 'var(--sbd-brown)', marginBottom: '1rem' }}>Financing / Investment</h2>
            <FieldGroup label="Headline">
              <input type="text" value={content.financing.headline} onChange={(e) => updateField('financing.headline', e.target.value)} />
            </FieldGroup>
            <FieldGroup label="Body">
              <textarea rows={4} value={content.financing.body} onChange={(e) => updateField('financing.body', e.target.value)} />
            </FieldGroup>
            <h3 style={{ marginTop: '1rem', color: 'var(--sbd-brown)' }}>Pricing Examples</h3>
            {(content.financing.examples || []).map((ex, i) => (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '0.5rem', marginBottom: '0.5rem', alignItems: 'end' }}>
                <FieldGroup label={i === 0 ? 'Label' : undefined}>
                  <input type="text" value={ex.label} onChange={(e) => { const examples = [...(content.financing.examples || [])]; examples[i] = { ...examples[i], label: e.target.value }; updateField('financing.examples', examples); }} />
                </FieldGroup>
                <FieldGroup label={i === 0 ? 'Value' : undefined}>
                  <input type="text" value={ex.value} onChange={(e) => { const examples = [...(content.financing.examples || [])]; examples[i] = { ...examples[i], value: e.target.value }; updateField('financing.examples', examples); }} />
                </FieldGroup>
                <button onClick={() => updateField('financing.examples', (content.financing.examples || []).filter((_, j) => j !== i))} style={{ padding: '0.5rem', border: 'none', background: '#f8d7da', borderRadius: '4px', cursor: 'pointer', color: '#721c24', minHeight: '40px' }}>✕</button>
              </div>
            ))}
            <button onClick={() => updateField('financing.examples', [...(content.financing.examples || []), { label: '', value: '' }])} style={{ padding: '0.5rem 1rem', border: '1px dashed var(--warm-grey-3)', background: 'transparent', borderRadius: '4px', cursor: 'pointer', fontSize: '0.85rem', marginTop: '0.5rem' }}>
              + Add Example
            </button>
          </div>
        )}

        {/* ============ FAQ ============ */}
        {activeTab === 'faq' && (
          <div>
            <h2 style={{ color: 'var(--sbd-brown)', marginBottom: '1rem' }}>FAQ</h2>
            <FieldGroup label="Headline">
              <input type="text" value={content.faq.headline} onChange={(e) => updateField('faq.headline', e.target.value)} />
            </FieldGroup>
            {content.faq.items.map((item, i) => (
              <div key={i} style={{ padding: '1rem', border: '1px solid var(--warm-grey-1)', borderRadius: '8px', marginBottom: '0.75rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <strong>Q{i + 1}</strong>
                  <button onClick={() => updateField('faq.items', content.faq.items.filter((_, j) => j !== i))} style={{ padding: '0.25rem 0.5rem', border: 'none', background: '#f8d7da', borderRadius: '4px', cursor: 'pointer', color: '#721c24' }}>✕</button>
                </div>
                <FieldGroup label="Question">
                  <input type="text" value={item.question} onChange={(e) => { const items = [...content.faq.items]; items[i] = { ...items[i], question: e.target.value }; updateField('faq.items', items); }} />
                </FieldGroup>
                <FieldGroup label="Answer">
                  <textarea rows={3} value={item.answer} onChange={(e) => { const items = [...content.faq.items]; items[i] = { ...items[i], answer: e.target.value }; updateField('faq.items', items); }} />
                </FieldGroup>
              </div>
            ))}
            <button onClick={() => updateField('faq.items', [...content.faq.items, { question: '', answer: '' }])} style={{ padding: '0.5rem 1rem', border: '1px dashed var(--warm-grey-3)', background: 'transparent', borderRadius: '4px', cursor: 'pointer', fontSize: '0.85rem' }}>
              + Add FAQ
            </button>
          </div>
        )}

        {/* ============ CTA ============ */}
        {activeTab === 'cta' && (
          <div>
            <h2 style={{ color: 'var(--sbd-brown)', marginBottom: '1rem' }}>Call to Action</h2>
            <FieldGroup label="Headline">
              <input type="text" value={content.cta.headline} onChange={(e) => updateField('cta.headline', e.target.value)} />
            </FieldGroup>
            <FieldGroup label="Subheadline">
              <textarea rows={2} value={content.cta.subheadline} onChange={(e) => updateField('cta.subheadline', e.target.value)} />
            </FieldGroup>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <FieldGroup label="Phone Number">
                <input type="text" value={content.cta.phone} onChange={(e) => updateField('cta.phone', e.target.value)} />
              </FieldGroup>
              <FieldGroup label="Email">
                <input type="text" value={content.cta.email} onChange={(e) => updateField('cta.email', e.target.value)} />
              </FieldGroup>
            </div>
            <FieldGroup label="Background Image URL">
              <input type="text" value={content.cta.backgroundImage?.src || ''} onChange={(e) => updateField('cta.backgroundImage', { src: e.target.value, alt: content.cta.backgroundImage?.alt || '' })} />
            </FieldGroup>
            <div style={{ marginTop: '0.5rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                <input type="checkbox" checked={content.cta.showConsultationForm} onChange={(e) => updateField('cta.showConsultationForm', e.target.checked)} style={{ width: '20px', height: '20px' }} />
                Show consultation form
              </label>
            </div>
          </div>
        )}
      </div>

      <div style={{ marginTop: '1.5rem', display: 'flex', gap: '0.75rem' }}>
        <button className="btn" onClick={handleSave} disabled={isSaving}>
          {isSaving ? 'Saving...' : 'Save All Changes'}
        </button>
      </div>
    </div>
  );
}

/* Reusable field group */
function FieldGroup({ label, children }: { label?: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: '0.75rem' }}>
      {label && <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 500, fontSize: '0.85rem' }}>{label}</label>}
      {children}
    </div>
  );
}
