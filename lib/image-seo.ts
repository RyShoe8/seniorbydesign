import { normalizeSlug } from '@/lib/slug';

const SBD_SUFFIX = 'by Senior By Design';

export type FormatImageAltParams = {
  description: string;
  designType: string;
  location?: string;
};

/** [description] + [designType] + by Senior By Design (+ optional location). */
export function formatImageAlt({ description, designType, location }: FormatImageAltParams): string {
  const desc = description.trim();
  const type = designType.trim();
  let alt = `${desc} ${type} ${SBD_SUFFIX}`.replace(/\s+/g, ' ').trim();
  if (location?.trim()) {
    alt = `${alt} ${location.trim()}`;
  }
  return alt;
}

export function hasSbdAltSuffix(alt: string): boolean {
  return alt.trim().toLowerCase().endsWith(SBD_SUFFIX.toLowerCase());
}

/** Use stored alt when non-empty; otherwise use fallback. */
export function ensureImageAlt(stored: string | undefined | null, fallback: string): string {
  const s = (stored ?? '').trim();
  if (s.length > 0) return s;
  return fallback;
}

const PORTFOLIO_SLUG_DESIGN_TYPES: Record<string, string> = {
  'senior-living': 'senior living interior design',
  'memory-support': 'memory care interior design',
  'active-adult': 'active adult community interior design',
  'model-units': 'senior living model unit design',
  remodels: 'assisted living remodel interior design',
  'multi-family': 'multifamily interior design',
  'office-remodels': 'office interior design',
};

const PORTFOLIO_SLUG_DESCRIPTIONS: Record<string, string> = {
  'senior-living': 'luxury senior living lobby and common area',
  'memory-support': 'memory care bedroom with calming color palette',
  'active-adult': 'active adult community great room staging',
  'model-units': 'senior living model apartment staging',
  remodels: 'assisted living community renovation',
  'multi-family': 'multifamily amenity space',
  'office-remodels': 'senior living operator office',
};

export type PortfolioAltParams = {
  slug: string;
  displayName: string;
  storedAlt?: string;
  index?: number;
};

export function portfolioAltText({
  slug,
  displayName,
  storedAlt,
  index,
}: PortfolioAltParams): string {
  const stored = (storedAlt ?? '').trim();
  if (stored.length > 0) return stored;

  const designType =
    PORTFOLIO_SLUG_DESIGN_TYPES[slug] ?? `${displayName.toLowerCase()} interior design`;
  const description =
    PORTFOLIO_SLUG_DESCRIPTIONS[slug] ??
    `${displayName.toLowerCase()} project${index != null ? ` ${index + 1}` : ''}`;

  return formatImageAlt({ description, designType });
}

export type HeroPageKey =
  | 'home'
  | 'portfolio-index'
  | 'services-index'
  | 'blog-index'
  | 'team-index'
  | 'team-member'
  | 'contact'
  | 'firm'
  | 'newsletter'
  | 'service-detail'
  | 'portfolio-category'
  | 'blog-post';

const HERO_ALTS: Record<HeroPageKey, string> = {
  home: formatImageAlt({
    description: 'senior living community interior with warm lighting and custom furnishings',
    designType: 'senior living interior design',
  }),
  'portfolio-index': formatImageAlt({
    description: 'senior living interior design portfolio showcase',
    designType: 'senior living interior design',
  }),
  'services-index': formatImageAlt({
    description: 'senior living design team reviewing interior plans and FF&E selections',
    designType: 'senior living interior design services',
  }),
  'blog-index': formatImageAlt({
    description: 'senior living design journal editorial hero',
    designType: 'senior living interior design',
  }),
  'team-index': formatImageAlt({
    description: 'Senior By Design interior design team at work',
    designType: 'senior living interior design',
  }),
  'team-member': formatImageAlt({
    description: 'Senior By Design team',
    designType: 'senior living interior design',
  }),
  contact: formatImageAlt({
    description: 'welcoming senior living community interior',
    designType: 'senior living interior design consultation',
  }),
  firm: formatImageAlt({
    description: 'Senior By Design Dallas headquarters and design center exterior',
    designType: 'senior living design firm',
    location: 'Dallas TX',
  }),
  newsletter: formatImageAlt({
    description: 'senior living community lounge with curated furnishings',
    designType: 'senior living interior design',
  }),
  'service-detail': formatImageAlt({
    description: 'senior living interior design service project',
    designType: 'senior living interior design',
  }),
  'portfolio-category': formatImageAlt({
    description: 'senior living interior design project',
    designType: 'senior living interior design',
  }),
  'blog-post': formatImageAlt({
    description: 'senior living design journal featured article',
    designType: 'senior living interior design',
  }),
};

export function heroAlt(pageKey: HeroPageKey): string {
  return HERO_ALTS[pageKey];
}

export function teamMemberAlt(name: string, title?: string): string {
  const role = title?.trim() ? `, ${title.trim()}` : '';
  return formatImageAlt({
    description: `${name}${role} portrait`,
    designType: 'senior living interior design team',
  });
}

export function blogFeaturedAlt(title: string): string {
  return formatImageAlt({
    description: title.trim(),
    designType: 'senior living design journal article',
  });
}

/** Partner/client logos — third-party marks; no SBD suffix. */
export function partnerLogoAlt(name: string): string {
  const n = name.trim();
  return n ? `${n} logo` : 'Partner logo';
}

export function logoAlt(): string {
  return formatImageAlt({
    description: 'Senior By Design company',
    designType: 'senior living interior design firm logo',
  });
}

export function firmCultureAlt(): string {
  return formatImageAlt({
    description: 'Senior By Design team culture and collaborative design studio',
    designType: 'senior living interior design firm',
    location: 'Dallas TX',
  });
}

export function warehouseAlt(index: number): string {
  return formatImageAlt({
    description: `35,000 square foot warehouse and design center photo ${index}`,
    designType: 'senior living FF&E staging and procurement',
    location: 'Dallas TX',
  });
}

export function serviceHeroAlt(serviceTitle: string): string {
  return formatImageAlt({
    description: `${serviceTitle.trim()} project showcase`,
    designType: 'senior living interior design service',
  });
}

/** Static image paths (SEO filenames). */
export const STATIC_IMAGES = {
  teamHero: '/images/senior-living-team-hero-design-sbd.jpg',
  portfolioHero: '/images/senior-living-portfolio-index-design-sbd.jpg',
  servicesHero: '/images/senior-living-services-hero-design-sbd.jpg',
  blogHero: '/images/senior-living-blog-journal-hero-design-sbd.jpg',
  firmHero: '/images/senior-living-firm-hero-design-sbd.webp',
  firmCulture: '/images/senior-living-firm-culture-design-sbd.webp',
  newsletterHero: '/images/senior-living-newsletter-hero-design-sbd.jpg',
  logo: '/images/senior-living-logo-design-sbd.webp',
  warehouse: (n: number) => `/images/senior-living-warehouse-design-sbd-${n}.webp`,
} as const;

export type BuildSeoImageFilenameParams = {
  spaceType: string;
  projectSlug?: string;
  ext: string;
  uniqueToken?: string;
};

function slugifySegment(value: string): string {
  return normalizeSlug(value).replace(/^-|-$/g, '') || 'image';
}

/** senior-living-[spaceType]-design-[projectSlug?]-sbd.ext */
export function buildSeoImageFilename({
  spaceType,
  projectSlug,
  ext,
  uniqueToken,
}: BuildSeoImageFilenameParams): string {
  const space = slugifySegment(spaceType);
  const project = projectSlug ? slugifySegment(projectSlug) : '';
  const extension = ext.replace(/^\./, '').toLowerCase() || 'jpg';
  const token = uniqueToken ? `-${uniqueToken}` : '';

  if (project) {
    return `senior-living-${space}-design-${project}-sbd${token}.${extension}`;
  }
  return `senior-living-${space}-design-sbd${token}.${extension}`;
}

export const UPLOAD_FOLDER_SPACE_TYPES: Record<string, string> = {
  portfolio: 'portfolio',
  services: 'service-hero',
  blog: 'blog-featured',
  team: 'team-portrait',
  homepage: 'homepage',
  partners: 'partner-logo',
};

export function defaultSpaceTypeForFolder(folder: string, override?: string): string {
  if (override?.trim()) return override.trim();
  return UPLOAD_FOLDER_SPACE_TYPES[folder] ?? 'interior';
}

export function altFromUploadFields(
  altDescription: string | undefined,
  spaceType: string,
  projectSlug?: string
): string {
  const desc = (altDescription ?? '').trim();
  if (desc.length > 0) {
    if (hasSbdAltSuffix(desc)) return desc;
    const designType =
      PORTFOLIO_SLUG_DESIGN_TYPES[projectSlug ?? ''] ??
      spaceType.replace(/-/g, ' ') + ' interior design';
    return formatImageAlt({ description: desc, designType });
  }

  if (projectSlug && PORTFOLIO_SLUG_DESCRIPTIONS[projectSlug]) {
    return portfolioAltText({ slug: projectSlug, displayName: projectSlug });
  }

  return formatImageAlt({
    description: spaceType.replace(/-/g, ' '),
    designType: 'senior living interior design',
  });
}
