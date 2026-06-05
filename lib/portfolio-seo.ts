import { clampMetaDescription } from '@/lib/blog-seo';

export const PORTFOLIO_INDEX_TITLE = 'Senior Living Interior Design Portfolio | Senior By Design';

export const PORTFOLIO_INDEX_H1 = 'Our Senior Living Design Portfolio';

export const PORTFOLIO_INDEX_META = clampMetaDescription(
  "Browse Senior By Design's portfolio of senior living interior design projects—independent living, memory care, active adult communities, and more, nationwide."
);

export const PORTFOLIO_INDEX_INTRO =
  'Senior By Design is a senior living interior design firm whose portfolio spans independent living, memory care, active adult communities, and model units across the United States. Each category reflects the firm\'s boutique approach: hand-selected furnishings, custom art, and durable specifications tailored to how residents and staff use every space.';

export const PORTFOLIO_BASE_KEYWORDS = [
  'interior design portfolio',
  'senior living design',
  'commercial interior design',
  'Senior By Design',
];

const SLUG_DISPLAY_LABELS: Record<string, string> = {
  'senior-living': 'Senior Living',
  'memory-support': 'Memory Care',
  'active-adult': 'Active Adult Living',
  'remodels': 'Assisted Living Remodels',
  'model-units': 'Model Units',
};

const SLUG_TITLES: Record<string, string> = {
  'senior-living': 'Senior Living Interior Design Projects | Portfolio | Senior By Design',
  'memory-support': 'Memory Care Interior Design Portfolio | Senior By Design',
  'active-adult': 'Active Adult Community Interior Design | Portfolio | Senior By Design',
  'model-units': 'Senior Living Model Unit Design & Staging | Senior By Design',
};

const SLUG_H1S: Record<string, string> = {
  'senior-living': 'Senior Living Interior Design Projects',
  'memory-support': 'Memory Care Interior Design',
  'active-adult': 'Active Adult Community Interior Design',
  'model-units': 'Senior Living Model Unit Design & Staging',
};

const SLUG_DESCRIPTIONS: Record<string, string> = {
  'senior-living':
    'Senior By Design senior living interior design projects—lobbies, common areas, and apartment interiors for communities nationwide.',
  'memory-support':
    "Senior By Design's memory care interior design portfolio—dignified, safe, and therapeutically informed environments that support residents and staff.",
  'active-adult':
    'Active adult community interior design by Senior By Design—welcoming 55+ spaces with residential warmth and commercial durability.',
  'multi-family':
    'Multifamily residential interior design by Senior By Design—model units, common areas, and amenity spaces.',
  'remodels':
    'Senior living remodel projects by Senior By Design—refreshing existing communities with thoughtful, durable interiors.',
  'office-remodels':
    'Office remodel interiors by Senior By Design—functional, brand-aligned workspaces for senior living operators.',
  'model-units':
    'Senior living model unit design and staging by Senior By Design—showcase apartments that help prospects envision community life.',
};

const SLUG_INTROS: Record<string, string> = {
  'senior-living':
    'Senior By Design is a senior living interior design firm whose portfolio includes lobbies, common areas, and apartment interiors nationwide. The firm specializes in lobby and common area design that welcomes families and supports daily resident life. Each project balances residential warmth with commercial durability.',
  'memory-support':
    'Senior By Design is a memory care interior design firm that creates calm, dignified environments for residents and staff. The firm\'s memory care portfolio includes intuitive layouts, durable finishes, and furnishings that support orientation and daily routines. Projects follow dementia-friendly design principles for safety and comfort.',
  'active-adult':
    'Senior By Design provides active adult community interior design for 55+ communities nationwide. The firm designs clubrooms, fitness areas, dining venues, and apartments with residential warmth and commercial durability. Prospects and residents experience quality in every shared and private space.',
  'multi-family':
    'Senior By Design delivers multifamily interior design for model units, common areas, and amenity spaces. The firm serves mixed-use and residential communities with finishes and furnishings built for daily use.',
  remodels:
    'Senior By Design completes senior living remodel projects that refresh existing communities with minimal disruption. The firm works with operators to improve function and appearance through flexible, collaborative design.',
  'office-remodels':
    'Senior By Design designs office remodel interiors for senior living operators. The firm creates functional, brand-aligned workspaces that support teams serving residents and families.',
  'model-units':
    'Senior By Design provides senior living model unit design and staging for communities preparing to open or relaunch. The firm uses its Dallas warehouse and worldwide sourcing network to deliver finished, warm showcase apartments that help prospects envision community life.',
};

function slugTokens(slug: string, name: string): string[] {
  const fromSlug = slug.split('-').filter((w) => w.length > 2);
  const fromName = name
    .toLowerCase()
    .split(/[^a-z0-9]+/i)
    .filter((w) => w.length > 2);
  return Array.from(new Set([...fromSlug, ...fromName]));
}

export function portfolioCategoryDisplayLabel(slug: string, name: string): string {
  return SLUG_DISPLAY_LABELS[slug] ?? name;
}

export function portfolioCategoryPageTitle(name: string, slug: string): string {
  return SLUG_TITLES[slug] ?? `${name} - Portfolio - Senior By Design`;
}

export function portfolioCategoryH1(name: string, slug: string): string {
  return SLUG_H1S[slug] ?? name;
}

export function metaDescriptionForPortfolioCategory(name: string, slug: string): string {
  const custom = SLUG_DESCRIPTIONS[slug];
  if (custom) return clampMetaDescription(custom);
  return clampMetaDescription(
    `Explore Senior By Design's ${name} portfolio—interior design, FF&E, and procurement for senior living and commercial spaces.`
  );
}

export function portfolioCategoryIntro(name: string, slug: string): string {
  const custom = SLUG_INTROS[slug];
  if (custom) return custom;
  return `Senior By Design showcases ${name} interior design work for senior living and commercial clients across the United States.`;
}

export function portfolioCategoryKeywords(name: string, slug: string): string[] {
  return Array.from(new Set([...PORTFOLIO_BASE_KEYWORDS, ...slugTokens(slug, name)]));
}
