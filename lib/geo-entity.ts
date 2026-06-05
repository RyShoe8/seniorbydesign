import { normalizeServiceSlug } from '@/lib/service-slug';
import {
  FOUNDER,
  ORG_EMAIL,
  ORG_NAME,
  ORG_TELEPHONE,
  POSTAL_ADDRESS,
} from '@/lib/schema/constants';

export const SBD_ABOUT_BOILERPLATE =
  'Senior By Design is a Dallas-based boutique senior living interior design firm founded by Reid Bonner. The firm provides interior design, FF&E procurement, space planning, and turnkey installation for independent living, assisted living, memory care, and active adult communities across the United States.';

export const FIRM_ENTITY_LEAD = `Senior By Design is a Dallas-based boutique senior living interior design firm founded by ${FOUNDER.name}, ${FOUNDER.jobTitle}. The firm designs and delivers turnkey interiors for independent living, assisted living, memory care, and active adult communities nationwide.`;

export const CONTACT_INTRO =
  'Senior By Design is a Dallas-based senior living interior design firm serving operators, developers, and owners nationwide. Contact the firm by phone, email, or the form below to discuss interior design, FF&E, or turnkey project services.';

export function formatPhoneDisplay(): string {
  const digits = ORG_TELEPHONE.replace(/\D/g, '');
  if (digits.length === 11 && digits.startsWith('1')) {
    return `(${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
  }
  return '(833) 773-3744';
}

export function formatPhoneTel(): string {
  return ORG_TELEPHONE.replace(/\D/g, '').replace(/^1/, '') || '8337733744';
}

export function formatAddressSingleLine(): string {
  const { streetAddress, addressLocality, addressRegion, postalCode } = POSTAL_ADDRESS;
  return `${streetAddress}, ${addressLocality}, ${addressRegion} ${postalCode}`;
}

export function formatAddressLines(): string[] {
  const { streetAddress, addressLocality, addressRegion, postalCode } = POSTAL_ADDRESS;
  return [streetAddress, `${addressLocality}, ${addressRegion} ${postalCode}`];
}

export { ORG_NAME, ORG_EMAIL };

const SERVICE_GEO_LEADS: Record<string, string> = {
  'interior-environments-and-design':
    'Senior By Design is a Dallas-based boutique senior living interior design firm that provides Interior Environments & Design services for independent living, assisted living, memory care, and active adult communities nationwide. The firm handles space planning, finish selection, furniture specification, and construction documentation for operators and developers.',
  'ffe-services':
    'Senior By Design is a Dallas-based senior living interior design firm that provides FF&E services—furniture, fixtures, and equipment sourcing and specification—for senior living and multifamily communities nationwide. The firm personally tests seating and vets commercial-grade products for durability, comfort, and resident use.',
  'procurement-and-installation':
    'Senior By Design is a Dallas-based senior living interior design firm that provides procurement and installation services for FF&E, art, and accessories. The firm manages purchasing, warehousing at its 35,000-square-foot Dallas design center, and on-site installation for senior living communities nationwide.',
  'overall-design-and-development':
    'Senior By Design is a Dallas-based senior living interior design firm that provides overall design and development services—turnkey project management coordinating owners, architects, and contractors. The firm serves independent living, assisted living, memory care, and active adult community projects nationwide.',
};

export function serviceGeoLead(slug: string): string {
  const key = normalizeServiceSlug(slug);
  return (
    SERVICE_GEO_LEADS[key] ??
    'Senior By Design is a Dallas-based boutique senior living interior design firm serving independent living, assisted living, memory care, and active adult communities nationwide.'
  );
}
