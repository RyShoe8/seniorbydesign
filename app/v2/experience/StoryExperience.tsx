'use client';

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import Image from 'next/image';
import Link from '@/components/v2/PreviewLink';
import type { DesignGuideContent, DGChapterKey, DGStat } from '@/lib/design-guide-models';
import {
  BROCHURE_DRAFT_KEY,
  DEFAULT_CLOSING_LABEL,
  DEFAULT_COVER_EYEBROW,
  chapterLabel,
  isChapterHidden,
  orderedChapterKeys,
} from '@/lib/design-guide-story';
import { getPortfolioImageUrl } from '@/lib/image-utils';
import { getRecaptchaToken } from '@/lib/recaptcha-client';
import s from './story.module.css';

type GalleryImage = { src: string; alt: string; category?: string; caption?: string };
type Quote = { quote: string; name: string; title?: string };

interface Props {
  content: DesignGuideContent | null;
  portfolioImages: GalleryImage[];
  existingTestimonials: Quote[];
}

const TONE: Record<DGChapterKey, 'ivory' | 'stone' | 'walnut'> = {
  intro: 'ivory',
  whyUs: 'walnut',
  services: 'ivory',
  agingInPlace: 'stone',
  process: 'ivory',
  portfolio: 'walnut',
  testimonials: 'stone',
  financing: 'ivory',
  faq: 'stone',
};

const two = (n: number) => String(n).padStart(2, '0');
const telHref = (phone: string) => `tel:${phone.replace(/[^0-9+]/g, '')}`;

/** Native modal semantics keep keyboard focus inside and restore it to the opener. */
function StoryDialog({ className, label, onClose, children }: {
  className: string; label: string; onClose: () => void; children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    dialog?.showModal();
    return () => {
      dialog?.close();
      if (opener?.isConnected) opener.focus({ preventScroll: true });
    };
  }, []);
  return <dialog ref={ref} className={className} aria-label={label}
    onCancel={(event) => { event.preventDefault(); onClose(); }}
    onClick={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    {children}
  </dialog>;
}

/* ------------------------------------------------------------------ */
/*  Entry: picks the saved brochure, or the builder's unsaved draft.    */
/* ------------------------------------------------------------------ */
export default function StoryExperience({ content, portfolioImages, existingTestimonials }: Props) {
  const [draft, setDraft] = useState<DesignGuideContent | null>(null);
  const [isDraft, setIsDraft] = useState(false);

  useEffect(() => {
    if (!new URLSearchParams(window.location.search).has('draft')) return;
    setIsDraft(true);
    const read = () => {
      try {
        const raw = window.localStorage.getItem(BROCHURE_DRAFT_KEY);
        const parsed = raw ? JSON.parse(raw) : null;
        setDraft(parsed && typeof parsed === 'object' && parsed.hero ? parsed : null);
      } catch {
        /* An unreadable draft just leaves the saved brochure on screen. */
      }
    };
    read();
    window.addEventListener('storage', read);
    return () => window.removeEventListener('storage', read);
  }, []);

  const current = draft ?? content;

  if (!current) {
    return (
      <div className={`${s.story} ${s.empty}`}>
        <span className={s.eyebrow}>{DEFAULT_COVER_EYEBROW}</span>
        <h1>The brochure has not been written yet.</h1>
        <p>Open the brochure builder to add the first content.</p>
        <Link href="/admin/design-guide" className={s.button}>
          Open the brochure builder
        </Link>
      </div>
    );
  }

  return (
    <Story
      content={current}
      portfolioImages={portfolioImages}
      existingTestimonials={existingTestimonials}
      isDraft={isDraft}
    />
  );
}

/* ------------------------------------------------------------------ */
/*  The story                                                           */
/* ------------------------------------------------------------------ */
function Story({
  content,
  portfolioImages,
  existingTestimonials,
  isDraft,
}: {
  content: DesignGuideContent;
  portfolioImages: GalleryImage[];
  existingTestimonials: Quote[];
  isDraft: boolean;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [activeId, setActiveId] = useState('cover');
  const [contentsOpen, setContentsOpen] = useState(false);

  const gallery: GalleryImage[] = content.portfolio?.useExistingPortfolio
    ? portfolioImages
    : content.portfolio?.images ?? [];
  const quotes: Quote[] = content.testimonials?.useExistingTestimonials
    ? existingTestimonials
    : content.testimonials?.items ?? [];

  // Chapters in the builder's order, minus hidden ones and any with nothing to show.
  const chapters = useMemo(() => {
    const hasContent: Record<DGChapterKey, boolean> = {
      intro: !!content.intro,
      whyUs: !!content.whyUs && (content.whyUs.cards ?? []).length > 0,
      services: !!content.services && (content.services.items ?? []).length > 0,
      agingInPlace: !!content.agingInPlace,
      process: !!content.process && (content.process.steps ?? []).length > 0,
      portfolio: !!content.portfolio && gallery.length > 0,
      testimonials: !!content.testimonials && quotes.length > 0,
      financing: !!content.financing,
      faq: !!content.faq && (content.faq.items ?? []).length > 0,
    };
    return orderedChapterKeys(content.story)
      .filter((key) => hasContent[key] && !isChapterHidden(content.story, key))
      .map((key, index) => ({
        key,
        id: `ch-${key}`,
        number: two(index + 1),
        label: chapterLabel(content.story, key),
      }));
  }, [content, gallery.length, quotes.length]);

  const closingLabel = content.story?.labels?.cta?.trim() || DEFAULT_CLOSING_LABEL;
  const stops = useMemo(
    () => [
      { id: 'cover', number: '', label: 'Cover' },
      ...chapters.map(({ id, number, label }) => ({ id, number, label })),
      { id: 'ch-cta', number: two(chapters.length + 1), label: closingLabel },
    ],
    [chapters, closingLabel]
  );

  const go = useCallback((id: string) => {
    setContentsOpen(false);
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    document.getElementById(id)?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
  }, []);

  // Reveal on scroll. Content is only hidden once this has run, so it is never lost without script.
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    root.setAttribute('data-ready', '');
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.setAttribute('data-in', '');
            observer.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.12, rootMargin: '0px 0px -6% 0px' }
    );
    root.querySelectorAll('[data-reveal]:not([data-in])').forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [content, chapters]);

  // One scroll listener: reading progress, the chapter in view, and scroll-drawn lines.
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      const doc = document.documentElement;
      const max = doc.scrollHeight - window.innerHeight;
      root.style.setProperty('--read', max > 0 ? String(Math.min(1, window.scrollY / max)) : '0');

      const line = window.innerHeight * 0.4;
      let current = 'cover';
      for (const stop of stops) {
        const el = document.getElementById(stop.id);
        if (el && el.getBoundingClientRect().top <= line) current = stop.id;
      }
      setActiveId((previous) => (previous === current ? previous : current));

      root.querySelectorAll<HTMLElement>('[data-scroll-line]').forEach((el) => {
        const rect = el.getBoundingClientRect();
        const done = (window.innerHeight * 0.62 - rect.top) / Math.max(1, rect.height);
        el.style.setProperty('--draw', String(Math.max(0, Math.min(1, done))));
      });
    };
    const onScroll = () => {
      if (!frame) frame = window.requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, [stops]);

  useEffect(() => {
    if (!contentsOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setContentsOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener('keydown', onKey);
    };
  }, [contentsOpen]);

  const activeStop = stops.find((stop) => stop.id === activeId) ?? stops[0];
  const hero = content.hero;
  const headlineLines = (hero?.headline ?? '').split('\n').filter((line) => line.trim());

  return (
    <div className={s.story} ref={rootRef}>
      {/* ---------- Reading bar ---------- */}
      <header className={s.bar}>
        <Link href="/" className={s.barBrand} aria-label="Senior By Design website">
          <Image src="/images/sbd-logo-transparent.png" alt="Senior By Design" width={96} height={36} />
        </Link>
        <span className={s.barWhere} aria-live="polite">
          {activeStop.id === 'cover' ? (
            content.story?.coverEyebrow?.trim() || DEFAULT_COVER_EYEBROW
          ) : (
            <>
              <em>{activeStop.number}</em>
              {activeStop.label}
            </>
          )}
        </span>
        <button
          type="button"
          className={s.barContents}
          onClick={() => setContentsOpen(true)}
          aria-haspopup="dialog"
          aria-expanded={contentsOpen}
        >
          Contents
          <span aria-hidden="true" className={s.barContentsIcon} />
        </button>
        <span className={s.barProgress} aria-hidden="true" />
      </header>

      {isDraft && <div className={s.draftFlag}>Draft preview. Not yet saved.</div>}

      {/* ---------- Contents ---------- */}
      {contentsOpen && (
        <StoryDialog className={s.contents} label="Contents" onClose={() => setContentsOpen(false)}>
          <button type="button" className={s.contentsClose} onClick={() => setContentsOpen(false)}>
            Close <span aria-hidden="true">×</span>
          </button>
          <div className={s.contentsInner}>
            <span className={s.eyebrow}>Contents</span>
            <ol className={s.contentsList}>
              {stops.map((stop) => (
                <li key={stop.id}>
                  <button
                    type="button"
                    onClick={() => go(stop.id)}
                    aria-current={stop.id === activeId ? 'true' : undefined}
                  >
                    <span aria-hidden="true">{stop.number || '—'}</span>
                    {stop.label}
                  </button>
                </li>
              ))}
            </ol>
            <div className={s.contentsFoot}>
              {content.cta?.phone && <a href={telHref(content.cta.phone)}>{content.cta.phone}</a>}
              {content.cta?.email && <a href={`mailto:${content.cta.email}`}>{content.cta.email}</a>}
              <Link href="/">Visit the website</Link>
            </div>
          </div>
        </StoryDialog>
      )}

      <main>
        {/* ---------- Cover ---------- */}
        <section className={s.cover} id="cover">
          <div className={s.coverCopy}>
            <div className={s.coverTop}>
              <span className={s.eyebrow}>{content.story?.coverEyebrow?.trim() || DEFAULT_COVER_EYEBROW}</span>
              <span className={s.coverMeta}>
                {chapters.length + 1} chapters <i aria-hidden="true" /> A few minutes to read
              </span>
            </div>
            <h1 className={s.coverTitle}>
              {headlineLines.map((line, index) => (
                <span key={index} className={index > 0 && index === headlineLines.length - 1 ? s.coverTitleAccent : undefined}>
                  {line}
                </span>
              ))}
            </h1>
            <div className={s.coverDetails}>
            {hero?.subheadline && <p className={s.coverLead}>{hero.subheadline}</p>}
            <div className={s.coverActions}>
              <button type="button" className={s.button} onClick={() => go(stops[1].id)}>
                Begin the story <span aria-hidden="true">↓</span>
              </button>
              {hero?.ctaPrimary?.label && hero.ctaPrimary.href && (
                <Link href={hero.ctaPrimary.href} className={s.textLink}>
                  {hero.ctaPrimary.label} <span aria-hidden="true">→</span>
                </Link>
              )}
              {hero?.ctaSecondary?.label && hero.ctaSecondary.href && (
                <Link href={hero.ctaSecondary.href} className={s.textLink}>
                  {hero.ctaSecondary.label} <span aria-hidden="true">→</span>
                </Link>
              )}
            </div>
            </div>
          </div>
          <div className={s.coverPhoto}>
            {hero?.backgroundImage?.src && (
              <Image
                src={hero.backgroundImage.src}
                alt={hero.backgroundImage.alt || ''}
                width={3529}
                height={1813}
                priority
                sizes="100vw"
              />
            )}
          </div>
        </section>

        {/* ---------- Chapters ---------- */}
        {chapters.map((chapter, index) => {
          const next = stops[index + 2];
          const body = (() => {
            switch (chapter.key) {
              case 'intro':
                return <IntroChapter content={content} number={chapter.number} label={chapter.label} />;
              case 'whyUs':
                return <WhyChapter content={content} number={chapter.number} label={chapter.label} />;
              case 'services':
                return <ServicesChapter content={content} number={chapter.number} label={chapter.label} />;
              case 'agingInPlace':
                return <ApproachChapter content={content} number={chapter.number} label={chapter.label} />;
              case 'process':
                return <ProcessChapter content={content} number={chapter.number} label={chapter.label} />;
              case 'portfolio':
                return <PortfolioChapter content={content} images={gallery} number={chapter.number} label={chapter.label} />;
              case 'testimonials':
                return <VoicesChapter content={content} quotes={quotes} number={chapter.number} label={chapter.label} />;
              case 'financing':
                return <InvestmentChapter content={content} number={chapter.number} label={chapter.label} />;
              case 'faq':
                return <QuestionsChapter content={content} number={chapter.number} label={chapter.label} />;
            }
          })();
          return (
            <section key={chapter.key} id={chapter.id} className={`${s.chapter} ${s[TONE[chapter.key]]}`}>
              {body}
              {next && (
                <a
                  className={s.next}
                  href={`#${next.id}`}
                  onClick={(event) => {
                    event.preventDefault();
                    go(next.id);
                  }}
                >
                  <span>Next</span>
                  <strong>
                    <em>{next.number}</em>
                    {next.label}
                  </strong>
                  <i aria-hidden="true">↓</i>
                </a>
              )}
            </section>
          );
        })}

        {/* ---------- Closing ---------- */}
        <Closing content={content} number={two(chapters.length + 1)} label={closingLabel} />
      </main>

      <footer className={s.footer}>
        <span>© {new Date().getFullYear()} Senior By Design</span>
        <button type="button" onClick={() => go('cover')}>
          Back to the cover <span aria-hidden="true">↑</span>
        </button>
        <Link href="/">seniorbydesign.com</Link>
      </footer>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Shared pieces                                                       */
/* ------------------------------------------------------------------ */
type ChapterProps = { content: DesignGuideContent; number: string; label: string };

function Opener({
  number,
  label,
  headline,
  sub,
}: {
  number: string;
  label: string;
  headline?: string;
  sub?: string;
}) {
  return (
    <header className={s.opener}>
      <span className={s.numeral} aria-hidden="true">
        {number}
      </span>
      <span className={s.eyebrow} data-reveal>
        <em>{number}</em>
        {label}
      </span>
      {headline && (
        <h2 className={s.h2} data-reveal>
          {headline}
        </h2>
      )}
      {sub && (
        <p className={s.sub} data-reveal>
          {sub}
        </p>
      )}
    </header>
  );
}

/** A number that counts up the first time it is seen. Text that is not a number is shown as written. */
function Figure({ stat }: { stat: DGStat }) {
  const target = Number(String(stat.value ?? '').replace(/[,\s]/g, ''));
  const numeric = !Number.isNaN(target) && /^[\d,.\s]+$/.test(String(stat.value ?? '').trim());
  const [shown, setShown] = useState<number | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || !numeric) return;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    let frame = 0;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        observer.disconnect();
        const start = performance.now();
        const tick = (now: number) => {
          const t = Math.min(1, (now - start) / 1800);
          setShown(t === 1 ? target : Math.round(target * (1 - Math.pow(1 - t, 4))));
          if (t < 1) frame = requestAnimationFrame(tick);
        };
        setShown(0);
        frame = requestAnimationFrame(tick);
      },
      { threshold: 0.4 }
    );
    observer.observe(el);
    return () => {
      observer.disconnect();
      if (frame) cancelAnimationFrame(frame);
    };
  }, [numeric, target]);

  return (
    <div className={s.figure} ref={ref} data-reveal>
      <dd>
        {numeric && shown !== null && shown !== target ? shown.toLocaleString() : stat.value}
        {stat.suffix && <small>{stat.suffix}</small>}
      </dd>
      <dt>{stat.label}</dt>
    </div>
  );
}

function Figures({ stats }: { stats?: DGStat[] }) {
  const list = (stats ?? []).filter((stat) => stat.value || stat.label);
  if (list.length === 0) return null;
  return (
    <dl className={s.figures}>
      {list.map((stat, index) => (
        <Figure key={index} stat={stat} />
      ))}
    </dl>
  );
}

/* ------------------------------------------------------------------ */
/*  Chapters                                                            */
/* ------------------------------------------------------------------ */
function IntroChapter({ content, number, label }: ChapterProps) {
  const intro = content.intro;
  const cards = intro.cards ?? [];
  const photo = intro.image?.src ? intro.image : cards.find((card) => card.image?.src)?.image;
  return (
    <div className={s.wrap}>
      <div className={s.split}>
        <Opener number={number} label={label} headline={intro.headline} />
        <div className={s.prose}>
          {(intro.body ?? '').split(/\n{2,}/).map((paragraph, index) => (
            <p key={index} className={index === 0 ? s.lead : undefined} data-reveal>
              {paragraph}
            </p>
          ))}
        </div>
      </div>
      <Figures stats={intro.stats} />
      {photo?.src && (
        <figure className={s.wide} data-reveal>
          <Image src={photo.src} alt={photo.alt || ''} fill sizes="(max-width: 1320px) 100vw, 1240px" />
        </figure>
      )}
      {cards.length > 0 && (
        <ul className={s.pillars}>
          {cards.map((card, index) => (
            <li key={index} data-reveal style={{ transitionDelay: `${(index % 2) * 120}ms` }}>
              <span aria-hidden="true">{two(index + 1)}</span>
              <h3>{card.title}</h3>
              <p>{card.description}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function WhyChapter({ content, number, label }: ChapterProps) {
  const why = content.whyUs;
  return (
    <div className={s.wrap}>
      <Opener number={number} label={label} headline={why.headline} sub={why.subheadline} />
      <ol className={s.reasons}>
        {(why.cards ?? []).map((card, index) => (
          <li key={index} data-reveal style={{ transitionDelay: `${(index % 2) * 120}ms` }}>
            <span aria-hidden="true">{two(index + 1)}</span>
            <div>
              <h3>{card.title}</h3>
              <p>{card.description}</p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}

function ServicesChapter({ content, number, label }: ChapterProps) {
  const services = content.services;
  const items = useMemo(
    () => [...(services.items ?? [])].sort((a, b) => (a.order ?? 0) - (b.order ?? 0)),
    [services.items]
  );
  const [active, setActive] = useState(0);
  const refs = useRef<Array<HTMLElement | null>>([]);

  // The photograph follows whichever service is at reading height.
  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const line = window.innerHeight * 0.55;
      let current = 0;
      refs.current.forEach((el, index) => {
        if (el && el.getBoundingClientRect().top <= line) current = index;
      });
      setActive((previous) => (previous === current ? previous : current));
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [items.length]);

  return (
    <div className={s.wrap}>
      <Opener number={number} label={label} headline={services.headline} sub={services.subheadline} />
      <div className={s.services}>
        <div className={s.stage} aria-hidden="true">
          <div className={s.stageFrame}>
            {items.map((item, index) =>
              item.image?.src ? (
                <div key={index} className={`${s.stagePhoto} ${index === active ? s.stagePhotoOn : ''}`}>
                  <Image src={item.image.src} alt="" fill sizes="(max-width: 900px) 100vw, 46vw" />
                </div>
              ) : null
            )}
          </div>
          <span className={s.stageCount}>
            <em>{two(active + 1)}</em> / {two(items.length)}
          </span>
        </div>
        <div className={s.serviceList}>
          {items.map((item, index) => (
            <article
              key={index}
              ref={(el) => {
                refs.current[index] = el;
              }}
              className={`${s.service} ${index === active ? s.serviceOn : ''}`}
            >
              {item.image?.src && (
                <div className={s.servicePhoto}>
                  <Image src={item.image.src} alt={item.image.alt || ''} fill sizes="100vw" />
                </div>
              )}
              <span className={s.serviceNumber} aria-hidden="true">
                {two(index + 1)}
              </span>
              <h3>{item.title}</h3>
              <p className={s.serviceLead}>{item.description}</p>
              {item.details && <p>{item.details}</p>}
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}

function ApproachChapter({ content, number, label }: ChapterProps) {
  const approach = content.agingInPlace;
  const features = approach.features ?? [];
  return (
    <div className={s.wrap}>
      <div className={s.approach}>
        <div>
          <Opener number={number} label={label} headline={approach.headline} />
          {(approach.body ?? '').split(/\n{2,}/).map((paragraph, index) => (
            <p key={index} className={index === 0 ? s.statement : s.sub} data-reveal>
              {paragraph}
            </p>
          ))}
        </div>
        {approach.image?.src && (
          <figure className={s.tall} data-reveal>
            <Image src={approach.image.src} alt={approach.image.alt || ''} fill sizes="(max-width: 900px) 100vw, 40vw" />
          </figure>
        )}
      </div>
      <Figures stats={approach.stats} />
      {features.length > 0 && (
        <ul className={s.pillars}>
          {features.map((feature, index) => (
            <li key={index} data-reveal style={{ transitionDelay: `${(index % 2) * 120}ms` }}>
              <span aria-hidden="true">{two(index + 1)}</span>
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function ProcessChapter({ content, number, label }: ChapterProps) {
  const process = content.process;
  return (
    <div className={`${s.wrap} ${s.split} ${s.processGrid}`}>
      <Opener number={number} label={label} headline={process.headline} sub={process.subheadline} />
      <ol className={s.journey} data-scroll-line>
        {(process.steps ?? []).map((step, index) => (
          <li key={index} data-reveal>
            <span className={s.journeyPhase}>{step.phase || two(index + 1)}</span>
            <div>
              <h3>{step.title}</h3>
              <p>{step.description}</p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}

function PortfolioChapter({
  content,
  images,
  number,
  label,
}: ChapterProps & { images: GalleryImage[] }) {
  const portfolio = content.portfolio;
  const [failed, setFailed] = useState<Record<string, true>>({});
  const [category, setCategory] = useState('All');
  const [open, setOpen] = useState<number | null>(null);
  const stripRef = useRef<HTMLDivElement>(null);

  const categories = useMemo(() => {
    const names: string[] = [];
    for (const image of images) if (image.category && !names.includes(image.category)) names.push(image.category);
    return names;
  }, [images]);

  // "All" takes a few photographs from each category in turn, so no single category fills the strip.
  const shown = useMemo(() => {
    const usable = images.filter((image) => image.src && !failed[image.src]);
    if (category !== 'All') return usable.filter((image) => image.category === category).slice(0, 14);
    if (categories.length < 2) return usable.slice(0, 14);
    const groups = categories.map((name) => usable.filter((image) => image.category === name));
    const mixed: GalleryImage[] = [];
    for (let round = 0; mixed.length < 14 && round < 14; round++) {
      for (const group of groups) if (group[round] && mixed.length < 14) mixed.push(group[round]);
    }
    return mixed;
  }, [images, failed, category, categories]);

  const slide = (direction: 1 | -1) => {
    const strip = stripRef.current;
    if (!strip) return;
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    strip.scrollBy({ left: direction * strip.clientWidth * 0.8, behavior: reduce ? 'auto' : 'smooth' });
  };

  useEffect(() => {
    if (open === null) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(null);
      if (event.key === 'ArrowRight') setOpen((i) => (i === null ? i : (i + 1) % shown.length));
      if (event.key === 'ArrowLeft') setOpen((i) => (i === null ? i : (i - 1 + shown.length) % shown.length));
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener('keydown', onKey);
    };
  }, [open, shown.length]);

  const current = open !== null ? shown[open] : null;

  return (
    <>
      <div className={s.wrap}>
        <Opener number={number} label={label} headline={portfolio.headline} sub={portfolio.subheadline} />
        <div className={s.stripHead}>
          {categories.length > 1 && (
            <div className={s.chips} role="group" aria-label="Filter the work by community type">
              {['All', ...categories].map((name) => (
                <button
                  key={name}
                  type="button"
                  aria-pressed={category === name}
                  onClick={() => {
                    setCategory(name);
                    stripRef.current?.scrollTo({ left: 0 });
                  }}
                >
                  {name}
                </button>
              ))}
            </div>
          )}
          {shown.length > 1 && <div className={s.stripArrows}>
            <button type="button" onClick={() => slide(-1)} aria-label="Earlier photographs">
              <span aria-hidden="true">←</span>
            </button>
            <button type="button" onClick={() => slide(1)} aria-label="More photographs">
              <span aria-hidden="true">→</span>
            </button>
          </div>}
        </div>
      </div>
      <div className={s.strip} ref={stripRef} tabIndex={0} aria-label="Photographs of our work">
        {shown.length === 0 && <p className={s.galleryEmpty}>These photographs are temporarily unavailable. Explore more of our work in the full portfolio.</p>}
        {shown.map((image, index) => (
          <figure key={image.src} className={s.plate}>
            <button type="button" onClick={() => setOpen(index)} aria-label={`Enlarge: ${image.caption || image.alt}`}>
              {/* Plain img: portfolio photos come from storage that the proxy route serves. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={getPortfolioImageUrl(image.src)}
                alt={image.alt || ''}
                loading="lazy"
                onError={() => setFailed((map) => ({ ...map, [image.src]: true }))}
              />
            </button>
            <figcaption>
              <span>{two(index + 1)}</span>
              {image.category && <em>{image.category}</em>}
              {image.caption && image.caption !== image.category && <b>{image.caption}</b>}
            </figcaption>
          </figure>
        ))}
        <div className={s.plateEnd}>
          <Link href="/portfolio" className={s.textLink}>
            See the full portfolio <span aria-hidden="true">→</span>
          </Link>
        </div>
      </div>

      {current && open !== null && (
        <StoryDialog
          className={s.lightbox}
          label="Photograph"
          onClose={() => setOpen(null)}
        >
          <button type="button" className={s.lightboxClose} onClick={() => setOpen(null)}>
            Close <span aria-hidden="true">×</span>
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={getPortfolioImageUrl(current.src)} alt={current.alt || ''} />
          <div className={s.lightboxBar}>
            <button type="button" onClick={() => setOpen((open - 1 + shown.length) % shown.length)} aria-label="Previous photograph">
              <span aria-hidden="true">←</span>
            </button>
            <p>
              <span>
                {two(open + 1)} / {two(shown.length)}
              </span>
              {[current.category, current.caption !== current.category ? current.caption : ''].filter(Boolean).join(' · ')}
            </p>
            <button type="button" onClick={() => setOpen((open + 1) % shown.length)} aria-label="Next photograph">
              <span aria-hidden="true">→</span>
            </button>
          </div>
        </StoryDialog>
      )}
    </>
  );
}

function VoicesChapter({ content, quotes, number, label }: ChapterProps & { quotes: Quote[] }) {
  const [index, setIndex] = useState(0);
  const [held, setHeld] = useState(false);
  const count = quotes.length;
  const safe = index % Math.max(1, count);
  const stackRef = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);

  // Quotes only change by themselves while they are on screen, so the page never moves under a reader elsewhere.
  useEffect(() => {
    const stack = stackRef.current;
    if (!stack) return;
    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), { threshold: 0.3 });
    observer.observe(stack);
    return () => observer.disconnect();
  }, []);

  // The block is as tall as the quote on show, not the longest one, so a short quote leaves no empty space.
  useEffect(() => {
    const stack = stackRef.current;
    const active = stack?.children[safe] as HTMLElement | undefined;
    if (!stack || !active) return;
    const sync = () => {
      stack.style.height = `${active.offsetHeight}px`;
    };
    sync();
    const observer = new ResizeObserver(sync);
    observer.observe(active);
    return () => observer.disconnect();
  }, [safe, count]);

  useEffect(() => {
    if (held || !inView || count < 2) return;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    const timer = window.setInterval(() => {
      if (!document.hidden) setIndex((i) => (i + 1) % count);
    }, 9000);
    return () => window.clearInterval(timer);
  }, [held, inView, count]);

  return (
    <div className={s.wrap}>
      <Opener number={number} label={label} headline={content.testimonials.headline} sub={content.testimonials.subheadline} />
      <div
        className={s.voices}
        onMouseEnter={() => setHeld(true)}
        onMouseLeave={() => setHeld(false)}
        onFocus={() => setHeld(true)}
        onBlur={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget)) setHeld(false);
        }}
      >
        <span className={s.voicesMark} aria-hidden="true">
          “
        </span>
        <div className={s.voicesStack} ref={stackRef}>
          {quotes.map((quote, i) => (
            <blockquote key={i} className={i === safe ? s.voiceOn : undefined} aria-hidden={i !== safe}>
              <p>{quote.quote}</p>
              <footer>
                <strong>{quote.name}</strong>
                {quote.title && <span>{quote.title}</span>}
              </footer>
            </blockquote>
          ))}
        </div>
        {count > 1 && (
          <div className={s.voicesNav}>
            <button type="button" onClick={() => setIndex((safe - 1 + count) % count)} aria-label="Previous client">
              <span aria-hidden="true">←</span>
            </button>
            <span>
              <em>{two(safe + 1)}</em> / {two(count)}
            </span>
            <button type="button" onClick={() => setIndex((safe + 1) % count)} aria-label="Next client">
              <span aria-hidden="true">→</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function InvestmentChapter({ content, number, label }: ChapterProps) {
  const financing = content.financing;
  const examples = (financing.examples ?? []).filter((example) => example.label || example.value);
  return (
    <div className={s.wrap}>
      <div className={s.split}>
        <div>
          <Opener number={number} label={label} headline={financing.headline} />
          {(financing.body ?? '').split(/\n{2,}/).map((paragraph, index) => (
            <p key={index} className={s.sub} data-reveal>
              {paragraph}
            </p>
          ))}
        </div>
        {examples.length > 0 && (
          <dl className={s.ledger}>
            {examples.map((example, index) => (
              <div key={index} data-reveal style={{ transitionDelay: `${index * 100}ms` }}>
                <dt>{example.label}</dt>
                <dd>{example.value}</dd>
              </div>
            ))}
          </dl>
        )}
      </div>
    </div>
  );
}

function QuestionsChapter({ content, number, label }: ChapterProps) {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <div className={s.wrap}>
      <div className={s.split}>
        <Opener number={number} label={label} headline={content.faq.headline} />
        <div className={s.questions}>
          {(content.faq.items ?? []).map((item, index) => (
            <div key={index} className={open === index ? s.questionOpen : undefined} data-reveal>
              <h3>
                <button
                  type="button"
                  aria-expanded={open === index}
                  aria-controls={`story-answer-${index}`}
                  onClick={() => setOpen(open === index ? null : index)}
                >
                  {item.question}
                  <i aria-hidden="true" />
                </button>
              </h3>
              <div id={`story-answer-${index}`} className={s.answer} role="region" aria-hidden={open !== index}>
                <div>
                  <p>{item.answer}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Closing({ content, number, label }: ChapterProps) {
  const cta = content.cta;
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', phone: '', message: '' });
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  if (!cta) return null;

  const change = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm({ ...form, [event.target.name]: event.target.value });

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setStatus('sending');
    try {
      const recaptchaToken = await getRecaptchaToken('contact');
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          message: `[From the digital brochure] ${form.message}`,
          company: '',
          zip: '',
          website: '',
          recaptchaToken,
        }),
      });
      if (!response.ok) throw new Error('Not sent');
      setStatus('sent');
      setForm({ firstName: '', lastName: '', email: '', phone: '', message: '' });
    } catch {
      setStatus('error');
    }
  };

  return (
    <section id="ch-cta" className={`${s.chapter} ${s.walnut} ${s.closing}`}>
      <div className={s.wrap}>
        <div className={s.closingGrid}>
          <div>
            <Opener number={number} label={label} headline={cta.headline} sub={cta.subheadline} />
            <div className={s.direct} data-reveal>
              {cta.phone && (
                <a href={telHref(cta.phone)} className={s.phone}>
                  {cta.phone}
                </a>
              )}
              {cta.email && (
                <a href={`mailto:${cta.email}`} className={s.textLink}>
                  {cta.email}
                </a>
              )}
            </div>
            {cta.backgroundImage?.src && (
              <figure className={s.closingPhoto} data-reveal>
                <Image src={cta.backgroundImage.src} alt={cta.backgroundImage.alt || ''} fill sizes="(max-width: 900px) 100vw, 44vw" />
              </figure>
            )}
          </div>

          {cta.showConsultationForm && (
            <form className={s.form} onSubmit={submit} data-reveal>
              <h3>Schedule a consultation</h3>
              {status === 'sent' ? (
                <p className={s.formDone} role="status">
                  Thank you. Your note is with our team, and we will be in touch shortly.
                </p>
              ) : (
                <>
                  <div className={s.formRow}>
                    <label>
                      First name
                      <input name="firstName" required autoComplete="given-name" value={form.firstName} onChange={change} />
                    </label>
                    <label>
                      Last name
                      <input name="lastName" required autoComplete="family-name" value={form.lastName} onChange={change} />
                    </label>
                  </div>
                  <div className={s.formRow}>
                    <label>
                      Email
                      <input name="email" type="email" required autoComplete="email" value={form.email} onChange={change} />
                    </label>
                    <label>
                      Phone (optional)
                      <input name="phone" type="tel" autoComplete="tel" value={form.phone} onChange={change} />
                    </label>
                  </div>
                  <label>
                    Tell us about your project
                    <textarea name="message" rows={4} required value={form.message} onChange={change} />
                  </label>
                  {status === 'error' && (
                    <p className={s.formError} role="alert">
                      Your note could not be sent. Please try again, or call us.
                    </p>
                  )}
                  <button type="submit" className={s.buttonLight} disabled={status === 'sending'}>
                    {status === 'sending' ? 'Sending…' : 'Send'}
                    {status !== 'sending' && <span aria-hidden="true">→</span>}
                  </button>
                </>
              )}
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
