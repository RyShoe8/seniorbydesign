import { clampMetaDescription } from '@/lib/blog-seo';

export const HOME_TITLE = 'Senior Living Interior Design Firm | Senior By Design';

export const HOME_META_DESCRIPTION = clampMetaDescription(
  'Senior By Design is a boutique senior living interior design firm specializing in FF&E, space planning, and turnkey interiors for independent living, assisted living, and memory care nationwide.'
);

export const HOME_H1 =
  'Senior Living Interior Design, Crafted for Communities That Care';

export const HOME_HERO_INTRO =
  'Senior By Design is a boutique interior design firm dedicated exclusively to senior living interior design. As a senior living design firm with a national footprint, we partner with operators and developers to create warm, durable environments for independent living, assisted living, and memory care communities. From concept through installation, our FF&E services cover space planning, furniture procurement, custom art, and white-glove delivery—so every lobby, dining room, and resident suite reflects the character of the community it serves.';

export const HOME_WHO_WE_ARE =
  'Founded by Reid Bonner, Senior By Design brings a collaborative, owner-focused approach to every senior living interior design project. The firm\'s team of design experts works closely with leadership, architects, and contractors to align interiors with operational goals, resident needs, and brand identity—delivering spaces that feel residential, not institutional.';

export const HOME_WHAT_MAKES_DIFFERENT =
  'What sets our boutique interior design firm apart is how we source and stand behind every piece. We scour markets worldwide to hand-select antiques, custom art, and commercial-grade furnishings stored in our 35,000-square-foot Dallas warehouse—never relying on catalog shortcuts. Every chair is personally comfort-tested; every finish is vetted for senior living durability. That hands-on FF&E approach means distinctive interiors at exceptional value, with turnkey installation backed by our own warehouse and installation teams.';

export const HOME_FAQ_HEADING =
  'Frequently Asked Questions About Senior Living Interior Design';

export const HOME_HUB_SECTION_HEADING = 'Explore Senior By Design';

export const HOME_SERVICE_TEASERS = [
  {
    slug: 'interior-environments-and-design',
    title: 'Interior Environments & Design',
    description:
      'Space planning, finish selection, and drawing documentation for senior living communities nationwide.',
  },
  {
    slug: 'ffe-services',
    title: 'FF&E Services',
    description:
      'Curated furniture, fixtures, and equipment sourcing with rigorous comfort and durability testing.',
  },
  {
    slug: 'procurement-and-installation',
    title: 'Procurement & Installation',
    description:
      'End-to-end purchasing, warehousing, and white-glove installation from our Dallas design center.',
  },
  {
    slug: 'overall-design-and-development',
    title: 'Overall Design & Development',
    description:
      'Turnkey project management coordinating owners, architects, and contractors through completion.',
  },
] as const;
