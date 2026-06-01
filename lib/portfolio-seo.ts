import { clampMetaDescription } from '@/lib/blog-seo';

export const PORTFOLIO_BASE_KEYWORDS = [
  'interior design portfolio',
  'senior living design',
  'commercial interior design',
  'Senior By Design',
];

const SLUG_DESCRIPTIONS: Record<string, string> = {
  'senior-living':
    'Browse Senior By Design’s senior living portfolio—luxury interiors, FF&E, and turnkey design for communities nationwide.',
  'memory-support':
    'Memory care and support environment design by Senior By Design—safe, dignified interiors tailored to residents and staff.',
  'active-adult':
    'Active adult community interior design portfolio from Senior By Design—welcoming spaces that feel like home.',
  'multi-family':
    'Multifamily residential interior design by Senior By Design—model units, common areas, and amenity spaces.',
  'remodels':
    'Senior living remodel projects by Senior By Design—refreshing existing communities with thoughtful, durable interiors.',
  'office-remodels':
    'Office remodel interiors by Senior By Design—functional, brand-aligned workspaces for senior living operators.',
  'model-units':
    'Model unit design and staging by Senior By Design—showcase spaces that help prospects envision life in community.',
};

const SLUG_INTROS: Record<string, string> = {
  'senior-living':
    'Explore completed senior living interior design projects by Senior By Design—communities designed for comfort, elegance, and long-term wearability.',
  'memory-support':
    'View memory care and support environment projects by Senior By Design—interiors that balance safety, warmth, and resident dignity.',
  'active-adult':
    'Discover active adult community interiors by Senior By Design—spaces that inspire connection, independence, and pride of place.',
  'multi-family':
    'See multifamily residential design work by Senior By Design—model units and shared spaces crafted for lasting appeal.',
  'remodels':
    'Browse senior living remodel portfolios from Senior By Design—transforming existing properties with flexible, collaborative design.',
  'office-remodels':
    'Review office remodel projects by Senior By Design—workspaces that support teams serving senior living communities.',
  'model-units':
    'Tour model unit design and staging by Senior By Design—turnkey interiors that help sales teams tell a compelling story.',
};

function slugTokens(slug: string, name: string): string[] {
  const fromSlug = slug
    .split('-')
    .filter((w) => w.length > 2);
  const fromName = name
    .toLowerCase()
    .split(/[^a-z0-9]+/i)
    .filter((w) => w.length > 2);
  return Array.from(new Set([...fromSlug, ...fromName]));
}

export function metaDescriptionForPortfolioCategory(name: string, slug: string): string {
  const custom = SLUG_DESCRIPTIONS[slug];
  if (custom) return clampMetaDescription(custom);
  return clampMetaDescription(
    `Explore Senior By Design’s ${name} portfolio—interior design, FF&E, and procurement for senior living and commercial spaces.`
  );
}

export function portfolioCategoryIntro(name: string, slug: string): string {
  const custom = SLUG_INTROS[slug];
  if (custom) return custom;
  return `Explore our ${name} portfolio showcasing interior design work by Senior By Design for senior living and commercial clients across the United States.`;
}

export function portfolioCategoryKeywords(name: string, slug: string): string[] {
  return Array.from(new Set([...PORTFOLIO_BASE_KEYWORDS, ...slugTokens(slug, name)]));
}
