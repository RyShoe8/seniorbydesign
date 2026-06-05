import { clampMetaDescription } from '@/lib/blog-seo';
import { FIRM_ENTITY_LEAD } from '@/lib/geo-entity';

export const FIRM_TITLE = 'Top Senior Living Interior Design Firm | Senior By Design';

export const FIRM_META_DESCRIPTION = clampMetaDescription(
  'Senior By Design is one of the top senior living interior design firms in the US. Our boutique team brings 25+ years of combined experience designing for independent living, assisted living, and memory care.'
);

export const FIRM_H1 = 'A Senior Living Design Firm Built on Principles, Not Catalogs';

export { FIRM_ENTITY_LEAD };

export const FIRM_INTRO =
  'Senior By Design operates from a 35,000-square-foot warehouse and design center in Dallas, Texas—a facility that distinguishes the firm from catalog-driven competitors. The boutique firm combines senior living interior design expertise with architecture coordination, serving communities across the United States. Senior By Design hand-selects antiques and custom art from markets worldwide and personally tests every chair before it reaches a resident lounge or dining room.';

export const FIRM_COMMUNITIES_SENIOR_LIVING = [
  'Independent Living',
  'Assisted Living',
  'Memory Care',
  'Active Adult',
  'Senior Apartments',
  'Senior Living Remodels',
] as const;

export const FIRM_HUB_SECTION_HEADING = 'Explore Senior By Design';
