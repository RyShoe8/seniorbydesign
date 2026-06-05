export const SITE_URL =
  (process.env.NEXT_PUBLIC_SITE_URL || 'https://seniorbydesign.com').replace(/\/+$/, '');

export const ORG_ID = `${SITE_URL}/#organization`;
export const LOCAL_BUSINESS_ID = `${SITE_URL}/#localbusiness`;
export const WEBSITE_ID = `${SITE_URL}/#website`;

export const ORG_NAME = 'Senior By Design';
export const ORG_ALTERNATE_NAMES = ['SBD', 'SBD Interiors'];

export const ORG_DESCRIPTION =
  'Boutique senior living interior design firm specializing in FF&E, space planning, and turnkey design for senior living communities nationwide.';

export const ORG_EMAIL = 'info@seniorbydesign.com';
export const ORG_TELEPHONE = '+18337733744';
export const ORG_FOUNDING_DATE = '2000';
export const ORG_EMPLOYEE_COUNT = '50-100';

export const ORG_LOGO_PATH = '/images/senior-living-logo-design-sbd.webp';
export const FIRM_HERO_PATH = '/images/senior-living-firm-hero-design-sbd.webp';

export const FOUNDER = {
  name: 'Reid Bonner',
  jobTitle: 'President',
  urlPath: '/team/reid-bonner',
};

export const POSTAL_ADDRESS = {
  streetAddress: '5015 Catron Dr',
  addressLocality: 'Dallas',
  addressRegion: 'TX',
  postalCode: '75220',
  addressCountry: 'US',
};

export const GEO_COORDINATES = {
  latitude: 32.8234,
  longitude: -96.8356,
};

export const SAME_AS = [
  'https://www.facebook.com/Seniorbydesign',
  'https://www.linkedin.com/company/senior-by-design/',
  'https://www.youtube.com/@SeniorByDesign',
  'https://www.instagram.com/seniorbydesign',
];

export const KNOWS_ABOUT = [
  'Senior Living Interior Design',
  'Memory Care Design',
  'Active Adult Community Design',
  'Assisted Living Interior Design',
  'FF&E Procurement',
  'Senior Housing Design',
  'Independent Living Design',
  'Senior Living Lobby Design',
  'Senior Living Bathroom Design',
  'Senior Living Apartment Design',
];

export function absoluteUrl(path: string): string {
  if (path.startsWith('http')) return path;
  return `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`;
}
