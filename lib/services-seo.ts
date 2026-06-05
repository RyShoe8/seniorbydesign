import { clampMetaDescription } from '@/lib/blog-seo';
import { normalizeServiceSlug } from '@/lib/service-slug';

export const SERVICES_INDEX_TITLE =
  'Senior Living Interior Design Services | FF&E, Space Planning & More | Senior By Design';

export const SERVICES_INDEX_H1 = 'Senior Living Interior Design Services';

export const SERVICES_INDEX_META = clampMetaDescription(
  'Full-service senior living interior design services from Senior By Design—space planning, FF&E procurement, installation, and turnkey design for communities nationwide.'
);

export const SERVICES_INDEX_INTRO =
  'Senior By Design delivers comprehensive senior living interior design services for operators, developers, and owners building or refreshing communities nationwide. Our team specializes in assisted living interior design and independent living interior design—from initial programming and space planning through finish selection, FF&E procurement, and white-glove installation. Whether you need senior living commercial design for a new build or a phased renovation, we bring senior living architecture design coordination, durable specifications, and a boutique sourcing model that goes far beyond catalog furniture. Every engagement is tailored to your community type, budget, and timeline.';

export const SERVICES_WHO_WE_DESIGN_FOR = [
  'Independent Living',
  'Assisted Living',
  'Memory Care',
  'Active Adult',
  'Senior Apartments',
  'Remodels',
  'New Construction',
] as const;

export type ServicePromotionCopy = {
  slug: string;
  description: string;
};

export const SERVICE_PROMOTION_COPY: ServicePromotionCopy[] = [
  {
    slug: 'interior-environments-and-design',
    description:
      'Our Interior Environments & Design service is the foundation of every successful senior living interior design project. Senior By Design provides commercial interior design experience spanning senior living communities, medical facilities, public spaces, and hospitality—translating operator goals into cohesive interior programs. We begin with surveying and space assessment, then develop interior programming, renovation and FF&E budgeting, and detailed space planning supported by full drawing documentation. Our designers lead material and finish selection, palette specification, casework design, furniture selection, interior detailing, signage design, branding integration, and equipment coordination. Construction supervision keeps design intent intact from concept through occupancy. For assisted living interior design and independent living interior design alike, we balance warmth and durability—specifying finishes and furnishings that perform under daily use while creating environments residents are proud to call home.',
  },
  {
    slug: 'ffe-services',
    description:
      'At Senior By Design, FF&E is far more than sourcing furniture—it is a highly curated, hands-on process rooted in performance, comfort, and design integrity. We source furniture, finishes, and equipment from around the world, focusing exclusively on commercial-grade products appropriate for senior living and multifamily environments. We rigorously vet not only our vendors but their products as well. It is not uncommon for us to review a catalog of hundreds of seating options, travel directly to the factory, and determine that only a small percentage truly meet our standards for durability, comfort, scale, and long-term use. Our senior living FF&E team prepares preliminary furniture layouts and budget figures for every area, then procures and delivers furniture, art, and accessories in preparation for installation. Every piece is evaluated from the perspective of senior residents—ensuring spaces are beautiful, comfortable, and built to last.',
  },
  {
    slug: 'procurement-and-installation',
    description:
      'Procurement & Installation is where Senior By Design’s turnkey model delivers measurable value. We manage the full lifecycle of FF&E—from inventory survey and purchasing management through pre-installation warehousing at our 35,000-square-foot Dallas design center and on-site installation by our experienced teams. Our approach saves operators money by eliminating third-party receivers, ensures product arrives on schedule, and packages each delivery with staging photography for precise assembly in the field. We handle artwork selection, purchase, and installation alongside accessory curation that completes the design story in every common area and model unit. Because we warehouse product ourselves, we maintain quality control at every handoff and offer a worldwide assortment of furnishings at competitive pricing. The result is a seamless transition from design approval to move-in day—without the delays and coordination headaches that often plague large-scale senior living projects.',
  },
  {
    slug: 'overall-design-and-development',
    description:
      'Overall Design & Development brings every discipline together under one accountable partner. Senior By Design’s design and dedicated procurement teams re-imagine environments to create a better way of living—and no two projects are alike. With 175+ senior living communities designed and over $100M in acquisitions procured, we provide project management, coordination with owners, architects, and contractors, contract and construction administration, scheduling, specifications, budgeting, and quality control from kickoff through final punch. We serve as the single point of contact for interior design decisions, FF&E milestones, and installation logistics—keeping complex builds on track and aligned with the operator’s vision. Whether you are developing a new independent living tower, refreshing an assisted living wing, or planning a memory care addition, our development-focused service model ensures design, procurement, and delivery move in lockstep toward a successful opening.',
  },
];

type ServiceDetailOverride = {
  title: string;
  h1: string;
  intro: string;
};

const SERVICE_DETAIL_OVERRIDES: Record<string, ServiceDetailOverride> = {
  'ffe-services': {
    title: 'Senior Living FF&E Services | Furniture, Fixtures & Equipment | Senior By Design',
    h1: 'Senior Living FF&E Services',
    intro:
      'Senior By Design provides senior living FF&E services built on rigorous vetting—not catalog shortcuts. The firm handles senior living furniture procurement and sourcing from factories worldwide, comfort-testing every seating option and specifying commercial-grade pieces for high-traffic senior living environments.',
  },
  'interior-environments-and-design': {
    title: 'Senior Living Interior Environments & Design | Senior By Design',
    h1: 'Senior Living Interior Environments & Design',
    intro:
      'Senior By Design delivers senior living interior design for communities that demand both beauty and performance. The Interior Environments & Design service covers assisted living interior design, independent living interior design, and shared amenity spaces—from space planning and finish selection through furniture specification and construction documentation.',
  },
  'procurement-and-installation': {
    title: 'Senior Living Procurement & Installation | Senior By Design',
    h1: 'Senior Living Procurement & Installation',
    intro:
      'Senior By Design manages FF&E procurement and installation for senior living communities nationwide. The firm handles purchasing, warehousing at its Dallas design center, and on-site installation—eliminating third-party receivers and keeping projects on schedule.',
  },
  'overall-design-and-development': {
    title: 'Senior Living Overall Design & Development | Senior By Design',
    h1: 'Senior Living Overall Design & Development',
    intro:
      'Senior By Design provides overall design and development services for senior living projects nationwide. The firm coordinates owners, architects, and contractors as a single point of contact for interior design, FF&E milestones, and installation logistics from kickoff through opening.',
  },
};

export function serviceDetailSeo(slug: string): ServiceDetailOverride | null {
  const key = normalizeServiceSlug(slug);
  return SERVICE_DETAIL_OVERRIDES[key] ?? null;
}

export function servicePageTitle(serviceTitle: string, slug: string): string {
  return serviceDetailSeo(slug)?.title ?? `${serviceTitle} - Senior By Design`;
}

export function servicePageH1(serviceTitle: string, slug: string): string {
  return serviceDetailSeo(slug)?.h1 ?? serviceTitle;
}

export function servicePageIntro(slug: string): string | null {
  return serviceDetailSeo(slug)?.intro ?? null;
}
