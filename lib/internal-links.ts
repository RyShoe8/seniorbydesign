import { portfolioCategoryDisplayLabel } from '@/lib/portfolio-seo';
import { normalizeServiceSlug } from '@/lib/service-slug';

export type InternalLink = {
  href: string;
  label: string;
  description?: string;
};

export type HubLink = {
  href: string;
  label: string;
  description: string;
};

export const HUB_LINKS: HubLink[] = [
  {
    href: '/senior-living-design-firm',
    label: 'The Firm',
    description: 'Our story, design center, and approach to senior living interiors.',
  },
  {
    href: '/services',
    label: 'Services',
    description: 'Interior design, FF&E, procurement, and turnkey development.',
  },
  {
    href: '/portfolio',
    label: 'Portfolio',
    description: 'Browse projects by community type and design specialty.',
  },
  {
    href: '/team',
    label: 'The Team',
    description: 'Meet the designers behind every Senior By Design project.',
  },
  {
    href: '/blog',
    label: 'Blog',
    description: 'Insights from The Principled Design Journal.',
  },
  {
    href: '/contact',
    label: 'Contact',
    description: 'Start a conversation about your next community project.',
  },
];

export const FIRM_HUB_LINKS: HubLink[] = HUB_LINKS.filter((l) =>
  ['/team', '/services', '/portfolio', '/contact'].includes(l.href)
);

const SERVICE_LABELS: Record<string, string> = {
  'interior-environments-and-design': 'Interior Environments & Design',
  'ffe-services': 'FF&E Services',
  'procurement-and-installation': 'Procurement & Installation',
  'overall-design-and-development': 'Overall Design & Development',
};

const PORTFOLIO_TO_SERVICES: Record<string, string[]> = {
  'memory-support': ['interior-environments-and-design', 'ffe-services'],
  'active-adult': ['interior-environments-and-design', 'ffe-services'],
  'senior-living': ['interior-environments-and-design', 'overall-design-and-development'],
  remodels: ['procurement-and-installation', 'interior-environments-and-design'],
  'model-units': ['ffe-services', 'overall-design-and-development'],
  'multi-family': ['interior-environments-and-design'],
  'office-remodels': ['interior-environments-and-design'],
};

const SERVICE_TO_PORTFOLIO: Record<string, string[]> = {
  'interior-environments-and-design': ['senior-living', 'multi-family', 'office-remodels'],
  'ffe-services': ['model-units', 'senior-living', 'active-adult'],
  'procurement-and-installation': ['remodels', 'senior-living'],
  'overall-design-and-development': ['senior-living', 'model-units', 'remodels'],
};

const SERVICE_TO_SIBLING_SERVICES: Record<string, string[]> = {
  'interior-environments-and-design': ['ffe-services', 'overall-design-and-development'],
  'ffe-services': ['interior-environments-and-design', 'procurement-and-installation'],
  'procurement-and-installation': ['ffe-services', 'overall-design-and-development'],
  'overall-design-and-development': ['interior-environments-and-design', 'procurement-and-installation'],
};

const PORTFOLIO_TO_SIBLING_PORTFOLIO: Record<string, string[]> = {
  'senior-living': ['memory-support', 'active-adult', 'model-units'],
  'memory-support': ['senior-living', 'remodels', 'model-units'],
  'active-adult': ['senior-living', 'model-units', 'multi-family'],
  'model-units': ['senior-living', 'active-adult', 'remodels'],
  remodels: ['senior-living', 'memory-support', 'model-units'],
  'multi-family': ['senior-living', 'active-adult', 'office-remodels'],
  'office-remodels': ['multi-family', 'senior-living', 'remodels'],
};

const COMMUNITY_LABEL_LINKS: Record<string, string> = {
  'Independent Living': '/portfolio/senior-living',
  'Assisted Living': '/portfolio/remodels',
  'Memory Care': '/portfolio/memory-support',
  'Active Adult': '/portfolio/active-adult',
  'Senior Apartments': '/portfolio/multi-family',
  Remodels: '/portfolio/remodels',
  'New Construction': '/services/overall-design-and-development',
  'Senior Living Remodels': '/portfolio/remodels',
};

const BLOG_EXPLICIT_LINKS: Record<string, InternalLink[]> = {
  'the-sbd-chair-test': [
    serviceLink('ffe-services'),
    portfolioLink('model-units'),
  ],
};

const DEFAULT_BLOG_LINKS: InternalLink[] = [
  serviceLink('interior-environments-and-design'),
  portfolioLink('senior-living'),
];

function serviceLink(slug: string): InternalLink {
  const key = normalizeServiceSlug(slug);
  return {
    href: `/services/${key}`,
    label: SERVICE_LABELS[key] ?? slug,
  };
}

function portfolioLink(slug: string, name = ''): InternalLink {
  return {
    href: `/portfolio/${slug}`,
    label: portfolioCategoryDisplayLabel(slug, name || slug),
  };
}

function toServiceLinks(slugs: string[]): InternalLink[] {
  return slugs.map((slug) => serviceLink(slug));
}

function toPortfolioLinks(slugs: string[]): InternalLink[] {
  return slugs.map((slug) => portfolioLink(slug));
}

export function communityLabelLink(label: string): InternalLink | null {
  const href = COMMUNITY_LABEL_LINKS[label];
  if (!href) return null;
  if (href.startsWith('/services/')) {
    const slug = href.replace('/services/', '');
    return serviceLink(slug);
  }
  const portfolioSlug = href.replace('/portfolio/', '');
  return portfolioLink(portfolioSlug, label);
}

export function serviceLinksForPortfolio(portfolioSlug: string): InternalLink[] {
  const slugs = PORTFOLIO_TO_SERVICES[portfolioSlug] ?? ['interior-environments-and-design'];
  return toServiceLinks(slugs);
}

export function primaryServiceLinkForPortfolio(portfolioSlug: string): InternalLink {
  return serviceLinksForPortfolio(portfolioSlug)[0];
}

export function portfolioLinksForService(serviceSlug: string): InternalLink[] {
  const key = normalizeServiceSlug(serviceSlug);
  const slugs = SERVICE_TO_PORTFOLIO[key] ?? ['senior-living', 'model-units'];
  return toPortfolioLinks(slugs);
}

export function relatedServiceLinksForService(serviceSlug: string): InternalLink[] {
  const key = normalizeServiceSlug(serviceSlug);
  const slugs = SERVICE_TO_SIBLING_SERVICES[key] ?? ['interior-environments-and-design'];
  return toServiceLinks(slugs.slice(0, 2));
}

export function portfolioLinksForPortfolio(portfolioSlug: string): InternalLink[] {
  const slugs = PORTFOLIO_TO_SIBLING_PORTFOLIO[portfolioSlug] ?? ['senior-living', 'model-units'];
  return toPortfolioLinks(slugs.slice(0, 3));
}

type BlogContextParams = {
  slug: string;
  title: string;
  excerpt?: string;
};

function uniqueLinks(links: InternalLink[]): InternalLink[] {
  const seen = new Set<string>();
  return links.filter((link) => {
    if (seen.has(link.href)) return false;
    seen.add(link.href);
    return true;
  });
}

export function blogContextualLinks({ slug, title, excerpt }: BlogContextParams): InternalLink[] {
  const normalizedSlug = slug.trim().toLowerCase();
  const explicit = BLOG_EXPLICIT_LINKS[normalizedSlug];
  if (explicit && explicit.length >= 2) {
    return explicit;
  }

  const text = `${title} ${excerpt ?? ''}`.toLowerCase();
  const links: InternalLink[] = explicit ? [...explicit] : [];

  if (/\b(memory|dementia|alzheimer)\b/.test(text)) {
    links.push(portfolioLink('memory-support'), serviceLink('interior-environments-and-design'));
  } else if (/\b(assisted living|assisted-living)\b/.test(text)) {
    links.push(portfolioLink('remodels'), serviceLink('interior-environments-and-design'));
  } else if (/\b(active adult|55\+|55 plus)\b/.test(text)) {
    links.push(portfolioLink('active-adult'), serviceLink('ffe-services'));
  } else if (/\b(model unit|staging|showcase)\b/.test(text)) {
    links.push(portfolioLink('model-units'), serviceLink('ffe-services'));
  } else if (/\b(ffe|ff&e|furniture|chair|seating|procurement)\b/.test(text)) {
    links.push(serviceLink('ffe-services'), portfolioLink('model-units'));
  } else if (/\b(install|warehouse|procurement)\b/.test(text)) {
    links.push(serviceLink('procurement-and-installation'), portfolioLink('remodels'));
  } else if (/\b(development|construction|new build|turnkey)\b/.test(text)) {
    links.push(serviceLink('overall-design-and-development'), portfolioLink('senior-living'));
  } else if (/\b(remodel|renovation|refresh)\b/.test(text)) {
    links.push(portfolioLink('remodels'), serviceLink('procurement-and-installation'));
  } else if (/\b(independent living|senior living|lobby|common area)\b/.test(text)) {
    links.push(portfolioLink('senior-living'), serviceLink('interior-environments-and-design'));
  } else if (/\b(multifamily|multi-family|apartment)\b/.test(text)) {
    links.push(portfolioLink('multi-family'), serviceLink('interior-environments-and-design'));
  }

  const merged = uniqueLinks([...links, ...DEFAULT_BLOG_LINKS]);
  return merged.slice(0, 4);
}
