'use client';

import { useState, useEffect, useCallback, type CSSProperties, type ReactNode } from 'react';
import type { DesignGuideContent, DGChapterKey } from '@/lib/design-guide-models';
import {
  BROCHURE_CHAPTERS,
  BROCHURE_DRAFT_KEY,
  DEFAULT_CLOSING_LABEL,
  DEFAULT_COVER_EYEBROW,
  orderedChapterKeys,
} from '@/lib/design-guide-story';
import ImageUploadField from '@/components/admin/ImageUploadField';

type TabKey = 'story' | 'hero' | DGChapterKey | 'cta';

const PREVIEW_URL = '/v2/experience?draft=1';

const subhead: CSSProperties = { margin: '1.75rem 0 0.75rem', color: 'var(--sbd-brown)' };
const hint: CSSProperties = { margin: '0 0 1rem', fontSize: '14px', color: '#7c705e', lineHeight: 1.6 };
const card: CSSProperties = { padding: '1rem', border: '1px solid #e6dfd2', borderRadius: '8px', marginBottom: '0.75rem', background: '#fffdf8' };
const smallBtn: CSSProperties = { minWidth: '40px', minHeight: '40px', padding: '0 0.6rem', border: '1px solid #ddd4c4', background: '#fffefa', borderRadius: '6px', cursor: 'pointer', color: '#554331', fontSize: '14px' };
const removeBtn: CSSProperties = { ...smallBtn, border: '1px solid #ecc9cd', background: '#fbeaec', color: '#721c24' };
const addBtn: CSSProperties = { minHeight: '44px', padding: '0.5rem 1rem', border: '1px dashed #b9ab94', background: 'transparent', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem', color: '#554331' };
const grid2: CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0 1rem' };

export default function DesignGuideAdmin() {
  const [content, setContent] = useState<DesignGuideContent | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>('story');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');
  const [savedContent, setSavedContent] = useState('');
  const [loadError, setLoadError] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const brochureLink = 'https://seniorbydesign.com/experience';
  const copyBrochureLink = async () => {
    try {
      await navigator.clipboard.writeText(brochureLink);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    } catch {
      window.prompt('Copy the digital brochure link:', brochureLink);
    }
  };
  const dirty = !!content && JSON.stringify(content) !== savedContent;
  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = ''; };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  // The live preview window reads this draft and redraws as you type. Nothing here is public.
  useEffect(() => {
    if (!content) return;
    const timer = window.setTimeout(() => {
      try {
        window.localStorage.setItem(BROCHURE_DRAFT_KEY, JSON.stringify(content));
      } catch {
        /* Preview simply shows the last saved brochure if the draft cannot be stored. */
      }
    }, 200);
    return () => window.clearTimeout(timer);
  }, [content]);

  const openPreview = () => {
    try {
      if (content) window.localStorage.setItem(BROCHURE_DRAFT_KEY, JSON.stringify(content));
    } catch {
      setSaveMsg('Live preview is unavailable because browser storage is full or disabled. Save your changes to preview the saved brochure.');
      return;
    }
    window.open(PREVIEW_URL, 'sbd-brochure-preview', 'width=1320,height=900');
  };

  const fetchContent = useCallback(async () => {
    setLoadError(false);
    try {
      const res = await fetch('/api/admin/design-guide');
      if (res.status === 404) {
        setContent(null);
        return;
      }
      if (!res.ok) throw new Error('Could not load brochure');
      const data = await res.json();
      setContent(data);
      setSavedContent(JSON.stringify(data));
    } catch (e) {
      setLoadError(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchContent(); }, [fetchContent]);

  const handleSeed = async () => {
    if (!confirm('This will add the starting brochure content. Continue?')) return;
    setIsSeeding(true);
    try {
      const res = await fetch('/api/admin/design-guide/seed', { method: 'POST' });
      if (res.ok) {
        setSaveMsg('Starting content added.');
        fetchContent();
      } else {
        setSaveMsg('Error adding the starting content.');
      }
    } catch {
      setSaveMsg('Error adding the starting content.');
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

  // Update a nested value by path, creating any missing objects on the way (older brochures lack newer fields).
  const updateField = (path: string, value: any) => {
    if (!content) return;
    const keys = path.split('.');
    const updated = JSON.parse(JSON.stringify(content));
    let obj: any = updated;
    for (let i = 0; i < keys.length - 1; i++) {
      if (obj[keys[i]] === undefined || obj[keys[i]] === null) obj[keys[i]] = {};
      obj = obj[keys[i]];
    }
    obj[keys[keys.length - 1]] = value;
    setContent(updated);
  };

  if (isLoading) return <p>Loading...</p>;

  if (loadError) return <div className="admin-page"><h1>Brochure builder</h1><p role="alert">The brochure could not be loaded. Your saved content has not changed.</p><button className="btn" onClick={fetchContent}>Try again</button></div>;

  if (!content) {
    return (
      <div className="admin-page">
        <h1>Brochure builder</h1>
        <p style={{ marginBottom: '1rem' }}>The brochure has no content yet. Add the starting content, then make it yours.</p>
        <button className="btn" onClick={handleSeed} disabled={isSeeding}>
          {isSeeding ? 'Adding...' : 'Add starting content'}
        </button>
        {saveMsg && <p style={{ marginTop: '1rem', color: 'var(--sbd-gold)' }}>{saveMsg}</p>}
      </div>
    );
  }

  /* ---------- Story order ---------- */
  const story = content.story ?? {};
  const order = orderedChapterKeys(story);
  const hidden = story.hidden ?? [];
  const moveChapter = (index: number, by: -1 | 1) => {
    const target = index + by;
    if (target < 0 || target >= order.length) return;
    const next = [...order];
    [next[index], next[target]] = [next[target], next[index]];
    updateField('story.order', next);
  };
  const toggleChapter = (key: DGChapterKey, show: boolean) =>
    updateField('story.hidden', show ? hidden.filter((k) => k !== key) : [...hidden, key]);
  const chapterName = (key: DGChapterKey) => BROCHURE_CHAPTERS.find((c) => c.key === key)!;

  const tabs: { key: TabKey; label: string }[] = [
    { key: 'story', label: 'Story' },
    { key: 'hero', label: 'Cover' },
    ...order.map((key, index) => ({ key: key as TabKey, label: `${index + 1}. ${chapterName(key).name}` })),
    { key: 'cta', label: 'Closing' },
  ];

  const image = (path: string, label: string, folder: string, value?: { src: string; alt: string }) => (
    <ImageUploadField
      label={label}
      value={value?.src || ''}
      onChange={(url) => updateField(path, { src: url, alt: value?.alt || '' })}
      altValue={value?.alt || ''}
      onAltChange={(alt) => updateField(path, { src: value?.src || '', alt })}
      folder={folder}
    />
  );

  return (
    <div className="admin-page">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <h1 style={{ margin: 0 }}>Brochure builder</h1>
          <p style={{ margin: '0.25rem 0 0', fontSize: '14px', color: 'var(--text-muted)' }}>
            Write and arrange the digital brochure. It reads as a story: a cover, your chapters, then a closing invitation.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <a href="/admin/brochure" className="btn" style={{ textDecoration: 'none', background: '#fffefa', color: '#66533f' }}>
            Brochure Requests & Settings
          </a>
          <button type="button" className="btn" onClick={openPreview} style={{ background: 'var(--sbd-brown)' }}>
            Open live preview
          </button>
          <button className="btn" onClick={handleSave} disabled={isSaving || !dirty}>
            {isSaving ? 'Saving...' : 'Save All Changes'}
          </button>
        </div>
      </div>

      <div className="brochure-share-link" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap', padding: '0.9rem 1rem', marginBottom: '1.25rem', background: '#fffdf8', border: '1px solid #e3d7c3', borderLeft: '3px solid var(--sbd-gold, #b08d57)', borderRadius: '4px' }}>
        <div style={{ flex: '1 1 260px', minWidth: 0 }}>
          <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#806a4d' }}>Digital brochure link</div>
          <a href={brochureLink} target="_blank" rel="noopener noreferrer" style={{ display: 'block', marginTop: '0.2rem', fontSize: '15px', color: '#593825', overflowWrap: 'anywhere' }}>
            {brochureLink}
          </a>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
          <a href={brochureLink} target="_blank" rel="noopener noreferrer" className="btn" style={{ textDecoration: 'none', background: '#fffefa', color: '#66533f' }}>
            Open
          </a>
          <button type="button" className="btn" onClick={copyBrochureLink} aria-live="polite">
            {linkCopied ? 'Copied' : 'Copy link'}
          </button>
        </div>
      </div>

      {saveMsg && (
        <div style={{ padding: '0.75rem', background: saveMsg.includes('Error') ? '#f8d7da' : '#d4edda', borderRadius: '4px', marginBottom: '1rem', fontSize: '14px' }}>
          {saveMsg}
        </div>
      )}

      <div className="brochure-tabs" aria-label="Brochure sections">
        {tabs.map(({ key, label }) => (
          <button key={key} aria-pressed={activeTab === key} onClick={() => setActiveTab(key)}>
            {label}
            {key !== 'story' && key !== 'hero' && key !== 'cta' && hidden.includes(key) ? ' (hidden)' : ''}
          </button>
        ))}
      </div>

      <fieldset className="brochure-editor-panel" disabled={isSaving}>
        {/* ============ STORY ============ */}
        {activeTab === 'story' && (
          <div>
            <PanelTitle>The story</PanelTitle>
            <p style={hint}>
              Readers open on the cover, move through the chapters in this order, and finish on the closing invitation.
              Open the live preview beside this window: it redraws as you type, and nothing is public until you save.
            </p>
            <Field label="Line above the cover headline" help={`Leave empty to use "${DEFAULT_COVER_EYEBROW}".`}>
              <input type="text" value={story.coverEyebrow || ''} placeholder={DEFAULT_COVER_EYEBROW} onChange={(e) => updateField('story.coverEyebrow', e.target.value)} />
            </Field>

            <h3 style={subhead}>Chapters</h3>
            <p style={hint}>Reorder with the arrows, untick a chapter to leave it out, and rename the short title readers see above each chapter and in the contents.</p>
            <div style={{ ...card, background: '#f4f0e7', display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
              <strong style={{ minWidth: '1.5rem' }}>—</strong>
              <span>Cover</span>
              <button type="button" style={{ ...smallBtn, marginLeft: 'auto' }} onClick={() => setActiveTab('hero')}>Edit</button>
            </div>
            {order.map((key, index) => {
              const info = chapterName(key);
              const isHidden = hidden.includes(key);
              return (
                <div key={key} style={{ ...card, display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center', opacity: isHidden ? 0.6 : 1 }}>
                  <strong style={{ minWidth: '1.5rem' }}>{index + 1}</strong>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', minWidth: '190px', minHeight: '40px' }}>
                    <input type="checkbox" checked={!isHidden} onChange={(e) => toggleChapter(key, e.target.checked)} style={{ width: '20px', height: '20px' }} />
                    {info.name}
                  </label>
                  <input
                    type="text"
                    aria-label={`Short title for ${info.name}`}
                    value={story.labels?.[key] || ''}
                    placeholder={info.label}
                    onChange={(e) => updateField(`story.labels.${key}`, e.target.value)}
                    style={{ flex: '1 1 200px' }}
                  />
                  <span style={{ display: 'flex', gap: '0.35rem' }}>
                    <button type="button" style={smallBtn} onClick={() => moveChapter(index, -1)} disabled={index === 0} aria-label={`Move ${info.name} earlier`}>↑</button>
                    <button type="button" style={smallBtn} onClick={() => moveChapter(index, 1)} disabled={index === order.length - 1} aria-label={`Move ${info.name} later`}>↓</button>
                    <button type="button" style={smallBtn} onClick={() => setActiveTab(key)}>Edit</button>
                  </span>
                </div>
              );
            })}
            <div style={{ ...card, background: '#f4f0e7', display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center' }}>
              <strong style={{ minWidth: '1.5rem' }}>{order.length + 1}</strong>
              <span style={{ minWidth: '190px' }}>Closing</span>
              <input
                type="text"
                aria-label="Short title for the closing"
                value={story.labels?.cta || ''}
                placeholder={DEFAULT_CLOSING_LABEL}
                onChange={(e) => updateField('story.labels.cta', e.target.value)}
                style={{ flex: '1 1 200px' }}
              />
              <button type="button" style={smallBtn} onClick={() => setActiveTab('cta')}>Edit</button>
            </div>
          </div>
        )}

        {/* ============ COVER ============ */}
        {activeTab === 'hero' && (
          <div>
            <PanelTitle>Cover</PanelTitle>
            <Field label="Headline" help="Each line break starts a new line. The last line is set in italic gold.">
              <textarea rows={3} value={content.hero.headline} onChange={(e) => updateField('hero.headline', e.target.value)} />
            </Field>
            <Field label="Opening sentence">
              <textarea rows={3} value={content.hero.subheadline} onChange={(e) => updateField('hero.subheadline', e.target.value)} />
            </Field>
            {image('hero.backgroundImage', 'Cover photograph', 'brochure/hero', content.hero.backgroundImage)}
            <h3 style={subhead}>Links beside &ldquo;Begin the story&rdquo;</h3>
            <p style={hint}>Leave a label empty to remove that link.</p>
            <div style={grid2}>
              <Field label="First link label">
                <input type="text" value={content.hero.ctaPrimary?.label || ''} onChange={(e) => updateField('hero.ctaPrimary.label', e.target.value)} />
              </Field>
              <Field label="First link destination">
                <input type="text" value={content.hero.ctaPrimary?.href || ''} onChange={(e) => updateField('hero.ctaPrimary.href', e.target.value)} />
              </Field>
              <Field label="Second link label">
                <input type="text" value={content.hero.ctaSecondary?.label || ''} onChange={(e) => updateField('hero.ctaSecondary.label', e.target.value)} />
              </Field>
              <Field label="Second link destination">
                <input type="text" value={content.hero.ctaSecondary?.href || ''} onChange={(e) => updateField('hero.ctaSecondary.href', e.target.value)} />
              </Field>
            </div>
          </div>
        )}

        {/* ============ INTRODUCTION ============ */}
        {activeTab === 'intro' && (
          <div>
            <PanelTitle>Introduction</PanelTitle>
            <Field label="Headline">
              <input type="text" value={content.intro.headline} onChange={(e) => updateField('intro.headline', e.target.value)} />
            </Field>
            <Field label="Body" help="Leave an empty line between paragraphs. The first paragraph is set larger.">
              <textarea rows={6} value={content.intro.body} onChange={(e) => updateField('intro.body', e.target.value)} />
            </Field>
            {image('intro.image', 'Photograph', 'brochure/intro', content.intro.image)}
            <h3 style={subhead}>Figures</h3>
            <Repeater
              items={content.intro.stats ?? []}
              onChange={(items) => updateField('intro.stats', items)}
              blank={{ value: '', label: '', suffix: '' }}
              addLabel="Add a figure"
              render={(stat, set) => <StatFields stat={stat} set={set} />}
            />
            <h3 style={subhead}>Strengths</h3>
            <Repeater
              items={content.intro.cards ?? []}
              onChange={(items) => updateField('intro.cards', items)}
              blank={{ icon: '', title: '', description: '' }}
              addLabel="Add a strength"
              render={(item, set) => <TitleDescriptionFields item={item} set={set} />}
            />
          </div>
        )}

        {/* ============ WHY US ============ */}
        {activeTab === 'whyUs' && (
          <div>
            <PanelTitle>Why Senior By Design</PanelTitle>
            <Field label="Headline">
              <input type="text" value={content.whyUs.headline} onChange={(e) => updateField('whyUs.headline', e.target.value)} />
            </Field>
            <Field label="Supporting sentence">
              <textarea rows={2} value={content.whyUs.subheadline || ''} onChange={(e) => updateField('whyUs.subheadline', e.target.value)} />
            </Field>
            <h3 style={subhead}>Reasons</h3>
            <Repeater
              items={content.whyUs.cards ?? []}
              onChange={(items) => updateField('whyUs.cards', items)}
              blank={{ icon: '', title: '', description: '' }}
              addLabel="Add a reason"
              render={(item, set) => <TitleDescriptionFields item={item} set={set} />}
            />
          </div>
        )}

        {/* ============ SERVICES ============ */}
        {activeTab === 'services' && (
          <div>
            <PanelTitle>Services</PanelTitle>
            <Field label="Headline">
              <input type="text" value={content.services.headline} onChange={(e) => updateField('services.headline', e.target.value)} />
            </Field>
            <Field label="Supporting sentence">
              <textarea rows={2} value={content.services.subheadline || ''} onChange={(e) => updateField('services.subheadline', e.target.value)} />
            </Field>
            <h3 style={subhead}>Services</h3>
            <p style={hint}>Each service has its own photograph. On a computer the photograph stays in view and changes as the reader moves down the list.</p>
            <Repeater
              items={[...(content.services.items ?? [])].sort((a, b) => (a.order ?? 0) - (b.order ?? 0))}
              onChange={(items) => updateField('services.items', items.map((item, index) => ({ ...item, order: index + 1 })))}
              blank={{ title: '', description: '', details: '', image: { src: '', alt: '' }, order: 0 }}
              addLabel="Add a service"
              render={(item, set) => (
                <>
                  <Field label="Title">
                    <input type="text" value={item.title} onChange={(e) => set({ title: e.target.value })} />
                  </Field>
                  <Field label="Summary">
                    <textarea rows={2} value={item.description} onChange={(e) => set({ description: e.target.value })} />
                  </Field>
                  <Field label="Detail">
                    <textarea rows={3} value={item.details} onChange={(e) => set({ details: e.target.value })} />
                  </Field>
                  <ImageUploadField
                    label="Photograph"
                    value={item.image?.src || ''}
                    onChange={(url) => set({ image: { src: url, alt: item.image?.alt || '' } })}
                    altValue={item.image?.alt || ''}
                    onAltChange={(alt) => set({ image: { src: item.image?.src || '', alt } })}
                    folder="brochure/services"
                  />
                </>
              )}
            />
          </div>
        )}

        {/* ============ OUR APPROACH ============ */}
        {activeTab === 'agingInPlace' && (
          <div>
            <PanelTitle>Our approach</PanelTitle>
            <Field label="Headline">
              <input type="text" value={content.agingInPlace.headline} onChange={(e) => updateField('agingInPlace.headline', e.target.value)} />
            </Field>
            <Field label="Body" help="Leave an empty line between paragraphs. The first paragraph is set as a large statement.">
              <textarea rows={6} value={content.agingInPlace.body} onChange={(e) => updateField('agingInPlace.body', e.target.value)} />
            </Field>
            {image('agingInPlace.image', 'Photograph', 'brochure/aging-in-place', content.agingInPlace.image)}
            <h3 style={subhead}>Figures</h3>
            <Repeater
              items={content.agingInPlace.stats ?? []}
              onChange={(items) => updateField('agingInPlace.stats', items)}
              blank={{ value: '', label: '', suffix: '' }}
              addLabel="Add a figure"
              render={(stat, set) => <StatFields stat={stat} set={set} />}
            />
            <h3 style={subhead}>Principles</h3>
            <Repeater
              items={content.agingInPlace.features ?? []}
              onChange={(items) => updateField('agingInPlace.features', items)}
              blank={{ icon: '', title: '', description: '' }}
              addLabel="Add a principle"
              render={(item, set) => <TitleDescriptionFields item={item} set={set} />}
            />
          </div>
        )}

        {/* ============ PROCESS ============ */}
        {activeTab === 'process' && (
          <div>
            <PanelTitle>Process</PanelTitle>
            <Field label="Headline">
              <input type="text" value={content.process.headline} onChange={(e) => updateField('process.headline', e.target.value)} />
            </Field>
            <Field label="Supporting sentence">
              <textarea rows={2} value={content.process.subheadline || ''} onChange={(e) => updateField('process.subheadline', e.target.value)} />
            </Field>
            <h3 style={subhead}>Steps</h3>
            <Repeater
              items={content.process.steps ?? []}
              onChange={(items) => updateField('process.steps', items.map((step, index) => ({ ...step, phase: String(index + 1).padStart(2, '0') })))}
              blank={{ phase: '', title: '', description: '', icon: '' }}
              addLabel="Add a step"
              render={(item, set) => <TitleDescriptionFields item={item} set={set} />}
            />
          </div>
        )}

        {/* ============ PORTFOLIO ============ */}
        {activeTab === 'portfolio' && (
          <div>
            <PanelTitle>Portfolio</PanelTitle>
            <Field label="Headline">
              <input type="text" value={content.portfolio.headline} onChange={(e) => updateField('portfolio.headline', e.target.value)} />
            </Field>
            <Field label="Supporting sentence">
              <textarea rows={2} value={content.portfolio.subheadline || ''} onChange={(e) => updateField('portfolio.subheadline', e.target.value)} />
            </Field>
            <Toggle
              checked={content.portfolio.useExistingPortfolio}
              onChange={(checked) => updateField('portfolio.useExistingPortfolio', checked)}
              label="Use the photographs from the website portfolio"
              help={content.portfolio.useExistingPortfolio
                ? 'The brochure shows a selection from each portfolio category, with a filter by category.'
                : 'Choose the photographs for the brochure below.'}
            />
            {!content.portfolio.useExistingPortfolio && (
              <Repeater
                items={content.portfolio.images ?? []}
                onChange={(items) => updateField('portfolio.images', items)}
                blank={{ src: '', alt: '', category: '', caption: '' }}
                addLabel="Add a photograph"
                render={(item, set) => (
                  <>
                    <ImageUploadField
                      label="Photograph"
                      value={item.src}
                      onChange={(url) => set({ src: url })}
                      altValue={item.alt}
                      onAltChange={(alt) => set({ alt })}
                      folder="brochure/portfolio"
                    />
                    <div style={grid2}>
                      <Field label="Community type" help="Photographs sharing a type are grouped in the filter.">
                        <input type="text" value={item.category || ''} onChange={(e) => set({ category: e.target.value })} />
                      </Field>
                      <Field label="Caption">
                        <input type="text" value={item.caption || ''} onChange={(e) => set({ caption: e.target.value })} />
                      </Field>
                    </div>
                  </>
                )}
              />
            )}
          </div>
        )}

        {/* ============ TESTIMONIALS ============ */}
        {activeTab === 'testimonials' && (
          <div>
            <PanelTitle>Testimonials</PanelTitle>
            <Field label="Headline">
              <input type="text" value={content.testimonials.headline} onChange={(e) => updateField('testimonials.headline', e.target.value)} />
            </Field>
            <Field label="Supporting sentence">
              <textarea rows={2} value={content.testimonials.subheadline || ''} onChange={(e) => updateField('testimonials.subheadline', e.target.value)} />
            </Field>
            <Toggle
              checked={content.testimonials.useExistingTestimonials}
              onChange={(checked) => updateField('testimonials.useExistingTestimonials', checked)}
              label="Use the testimonials from the homepage"
              help={content.testimonials.useExistingTestimonials
                ? 'The brochure shows the homepage testimonials, one at a time.'
                : 'Write the testimonials for the brochure below.'}
            />
            {!content.testimonials.useExistingTestimonials && (
              <Repeater
                items={content.testimonials.items ?? []}
                onChange={(items) => updateField('testimonials.items', items)}
                blank={{ quote: '', name: '', title: '' }}
                addLabel="Add a testimonial"
                render={(item, set) => (
                  <>
                    <Field label="Quote">
                      <textarea rows={3} value={item.quote} onChange={(e) => set({ quote: e.target.value })} />
                    </Field>
                    <div style={grid2}>
                      <Field label="Name">
                        <input type="text" value={item.name} onChange={(e) => set({ name: e.target.value })} />
                      </Field>
                      <Field label="Title and company">
                        <input type="text" value={item.title || ''} onChange={(e) => set({ title: e.target.value })} />
                      </Field>
                    </div>
                  </>
                )}
              />
            )}
          </div>
        )}

        {/* ============ INVESTMENT ============ */}
        {activeTab === 'financing' && (
          <div>
            <PanelTitle>Investment</PanelTitle>
            <Field label="Headline">
              <input type="text" value={content.financing.headline} onChange={(e) => updateField('financing.headline', e.target.value)} />
            </Field>
            <Field label="Body">
              <textarea rows={4} value={content.financing.body} onChange={(e) => updateField('financing.body', e.target.value)} />
            </Field>
            <h3 style={subhead}>Examples</h3>
            <Repeater
              items={content.financing.examples ?? []}
              onChange={(items) => updateField('financing.examples', items)}
              blank={{ label: '', value: '' }}
              addLabel="Add an example"
              render={(item, set) => (
                <div style={grid2}>
                  <Field label="Project type">
                    <input type="text" value={item.label} onChange={(e) => set({ label: e.target.value })} />
                  </Field>
                  <Field label="Price guide">
                    <input type="text" value={item.value} onChange={(e) => set({ value: e.target.value })} />
                  </Field>
                </div>
              )}
            />
          </div>
        )}

        {/* ============ QUESTIONS ============ */}
        {activeTab === 'faq' && (
          <div>
            <PanelTitle>Questions</PanelTitle>
            <Field label="Headline">
              <input type="text" value={content.faq.headline} onChange={(e) => updateField('faq.headline', e.target.value)} />
            </Field>
            <Repeater
              items={content.faq.items ?? []}
              onChange={(items) => updateField('faq.items', items)}
              blank={{ question: '', answer: '' }}
              addLabel="Add a question"
              render={(item, set) => (
                <>
                  <Field label="Question">
                    <input type="text" value={item.question} onChange={(e) => set({ question: e.target.value })} />
                  </Field>
                  <Field label="Answer">
                    <textarea rows={3} value={item.answer} onChange={(e) => set({ answer: e.target.value })} />
                  </Field>
                </>
              )}
            />
          </div>
        )}

        {/* ============ CLOSING ============ */}
        {activeTab === 'cta' && (
          <div>
            <PanelTitle>Closing</PanelTitle>
            <Field label="Headline">
              <input type="text" value={content.cta.headline} onChange={(e) => updateField('cta.headline', e.target.value)} />
            </Field>
            <Field label="Supporting sentence">
              <textarea rows={2} value={content.cta.subheadline} onChange={(e) => updateField('cta.subheadline', e.target.value)} />
            </Field>
            <div style={grid2}>
              <Field label="Phone number">
                <input type="text" value={content.cta.phone} onChange={(e) => updateField('cta.phone', e.target.value)} />
              </Field>
              <Field label="Email">
                <input type="text" value={content.cta.email} onChange={(e) => updateField('cta.email', e.target.value)} />
              </Field>
            </div>
            {image('cta.backgroundImage', 'Photograph', 'brochure/cta', content.cta.backgroundImage)}
            <Toggle
              checked={content.cta.showConsultationForm}
              onChange={(checked) => updateField('cta.showConsultationForm', checked)}
              label="Show the consultation form"
              help="Notes sent from the form arrive the same way as the website contact form."
            />
          </div>
        )}
      </fieldset>

      <div className="brochure-savebar"><span role="status">{dirty ? "You have unsaved changes" : "All changes saved"}</span>
        <button className="btn" onClick={handleSave} disabled={isSaving || !dirty}>
          {isSaving ? 'Saving...' : 'Save All Changes'}
        </button>
      </div>
    </div>
  );
}

/* ---------- Small building blocks ---------- */
function PanelTitle({ children }: { children: ReactNode }) {
  return <h2 style={{ color: 'var(--sbd-brown)', marginBottom: '1rem' }}>{children}</h2>;
}

function Field({ label, help, children }: { label?: string; help?: string; children: ReactNode }) {
  return (
    <div style={{ marginBottom: '0.75rem' }}>
      <label style={{ display: 'block' }}>
        {label && <span style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 500, fontSize: '0.85rem' }}>{label}</span>}
        {children}
      </label>
      {help && <p style={{ margin: '0.3rem 0 0', fontSize: '13px', color: '#7c705e' }}>{help}</p>}
    </div>
  );
}

function Toggle({ checked, onChange, label, help }: { checked: boolean; onChange: (checked: boolean) => void; label: string; help?: string }) {
  return (
    <div style={{ margin: '1rem 0' }}>
      <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', minHeight: '40px' }}>
        <input type="checkbox" checked={!!checked} onChange={(e) => onChange(e.target.checked)} style={{ width: '20px', height: '20px' }} />
        {label}
      </label>
      {help && <p style={{ fontSize: '14px', color: '#7c705e', margin: '0.25rem 0 0 28px' }}>{help}</p>}
    </div>
  );
}

/** A list the editor can add to, remove from and reorder. */
function Repeater<T>({
  items,
  onChange,
  blank,
  addLabel,
  render,
}: {
  items: T[];
  onChange: (items: T[]) => void;
  blank: T;
  addLabel: string;
  render: (item: T, set: (patch: Partial<T>) => void, index: number) => ReactNode;
}) {
  const move = (index: number, by: -1 | 1) => {
    const target = index + by;
    if (target < 0 || target >= items.length) return;
    const next = [...items];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  };
  return (
    <div>
      {items.map((item, index) => (
        <div key={index} style={card}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.6rem' }}>
            <strong style={{ marginRight: 'auto' }}>{index + 1}</strong>
            <button type="button" style={smallBtn} onClick={() => move(index, -1)} disabled={index === 0} aria-label={`Move item ${index + 1} up`}>↑</button>
            <button type="button" style={smallBtn} onClick={() => move(index, 1)} disabled={index === items.length - 1} aria-label={`Move item ${index + 1} down`}>↓</button>
            <button type="button" style={removeBtn} onClick={() => onChange(items.filter((_, i) => i !== index))} aria-label={`Remove item ${index + 1}`}>Remove</button>
          </div>
          {render(item, (patch) => onChange(items.map((existing, i) => (i === index ? { ...existing, ...patch } : existing))), index)}
        </div>
      ))}
      <button type="button" style={addBtn} onClick={() => onChange([...items, { ...blank }])}>
        + {addLabel}
      </button>
    </div>
  );
}

function StatFields({ stat, set }: { stat: { value: string; label: string; suffix?: string }; set: (patch: { value?: string; label?: string; suffix?: string }) => void }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(90px, 1fr) minmax(70px, 0.6fr) minmax(160px, 3fr)', gap: '0 0.75rem' }}>
      <Field label="Number">
        <input type="text" value={stat.value} onChange={(e) => set({ value: e.target.value })} />
      </Field>
      <Field label="After it">
        <input type="text" value={stat.suffix || ''} placeholder="+ or %" onChange={(e) => set({ suffix: e.target.value })} />
      </Field>
      <Field label="What it counts">
        <input type="text" value={stat.label} onChange={(e) => set({ label: e.target.value })} />
      </Field>
    </div>
  );
}

function TitleDescriptionFields({ item, set }: { item: { title: string; description: string }; set: (patch: { title?: string; description?: string }) => void }) {
  return (
    <>
      <Field label="Title">
        <input type="text" value={item.title} onChange={(e) => set({ title: e.target.value })} />
      </Field>
      <Field label="Description">
        <textarea rows={2} value={item.description} onChange={(e) => set({ description: e.target.value })} />
      </Field>
    </>
  );
}
