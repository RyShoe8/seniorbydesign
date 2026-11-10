import type { DGChapterKey, DGStory } from './design-guide-models';

/** Shared by the digital brochure and its builder, so both agree on chapter order and names. */

export const BROCHURE_CHAPTERS: Array<{
  key: DGChapterKey;
  /** Name used in the builder. */
  name: string;
  /** Default short name shown to readers. */
  label: string;
}> = [
  { key: 'intro', name: 'Introduction', label: 'Who we are' },
  { key: 'whyUs', name: 'Why Senior By Design', label: 'What sets us apart' },
  { key: 'services', name: 'Services', label: 'What we do' },
  { key: 'agingInPlace', name: 'Our approach', label: 'Our approach' },
  { key: 'process', name: 'Process', label: 'How we work' },
  { key: 'portfolio', name: 'Portfolio', label: 'The work' },
  { key: 'testimonials', name: 'Testimonials', label: 'In their words' },
  { key: 'financing', name: 'Investment', label: 'The investment' },
  { key: 'faq', name: 'Questions', label: 'Good questions' },
];

export const DEFAULT_COVER_EYEBROW = 'The Senior By Design Experience';
export const DEFAULT_CLOSING_LABEL = 'Begin your project';

/** The builder writes its unsaved draft here; the brochure reads it when opened with ?draft=1. */
export const BROCHURE_DRAFT_KEY = 'sbd-brochure-draft';

const KNOWN = new Set<string>(BROCHURE_CHAPTERS.map((chapter) => chapter.key));

/** Saved order first (ignoring anything unknown or repeated), then any chapter the order leaves out. */
export function orderedChapterKeys(story?: DGStory): DGChapterKey[] {
  const seen = new Set<string>();
  const ordered: DGChapterKey[] = [];
  for (const key of story?.order ?? []) {
    if (KNOWN.has(key) && !seen.has(key)) {
      seen.add(key);
      ordered.push(key);
    }
  }
  for (const { key } of BROCHURE_CHAPTERS) {
    if (!seen.has(key)) ordered.push(key);
  }
  return ordered;
}

export function chapterLabel(story: DGStory | undefined, key: DGChapterKey): string {
  const custom = story?.labels?.[key]?.trim();
  return custom || BROCHURE_CHAPTERS.find((chapter) => chapter.key === key)!.label;
}

export function isChapterHidden(story: DGStory | undefined, key: DGChapterKey): boolean {
  return !!story?.hidden?.includes(key);
}
