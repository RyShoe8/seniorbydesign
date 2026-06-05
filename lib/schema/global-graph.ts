import {
  SITE_URL,
  ORG_ID,
  LOCAL_BUSINESS_ID,
  WEBSITE_ID,
  ORG_NAME,
  ORG_ALTERNATE_NAMES,
  ORG_DESCRIPTION,
  ORG_EMAIL,
  ORG_TELEPHONE,
  ORG_FOUNDING_DATE,
  ORG_EMPLOYEE_COUNT,
  ORG_LOGO_PATH,
  FIRM_HERO_PATH,
  FOUNDER,
  POSTAL_ADDRESS,
  GEO_COORDINATES,
  SAME_AS,
  KNOWS_ABOUT,
  absoluteUrl,
} from './constants';

export function GlobalSchemaGraph(): Record<string, unknown> {
  const founderUrl = absoluteUrl(FOUNDER.urlPath);

  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': ORG_ID,
        name: ORG_NAME,
        alternateName: ORG_ALTERNATE_NAMES,
        url: SITE_URL,
        logo: absoluteUrl(ORG_LOGO_PATH),
        description: ORG_DESCRIPTION,
        foundingDate: ORG_FOUNDING_DATE,
        founder: {
          '@type': 'Person',
          name: FOUNDER.name,
          jobTitle: FOUNDER.jobTitle,
          url: founderUrl,
        },
        address: {
          '@type': 'PostalAddress',
          ...POSTAL_ADDRESS,
        },
        telephone: ORG_TELEPHONE,
        email: ORG_EMAIL,
        sameAs: SAME_AS,
        knowsAbout: KNOWS_ABOUT,
        areaServed: {
          '@type': 'Country',
          name: 'United States',
        },
        numberOfEmployees: {
          '@type': 'QuantitativeValue',
          value: ORG_EMPLOYEE_COUNT,
        },
      },
      {
        '@type': 'LocalBusiness',
        '@id': LOCAL_BUSINESS_ID,
        parentOrganization: { '@id': ORG_ID },
        name: ORG_NAME,
        image: absoluteUrl(FIRM_HERO_PATH),
        priceRange: '$$$',
        currenciesAccepted: 'USD',
        paymentAccepted: 'Invoice',
        address: {
          '@type': 'PostalAddress',
          ...POSTAL_ADDRESS,
        },
        telephone: ORG_TELEPHONE,
        email: ORG_EMAIL,
        openingHours: 'Mo-Fr 09:00-17:00',
        url: SITE_URL,
        geo: {
          '@type': 'GeoCoordinates',
          latitude: GEO_COORDINATES.latitude,
          longitude: GEO_COORDINATES.longitude,
        },
      },
      {
        '@type': 'WebSite',
        '@id': WEBSITE_ID,
        url: SITE_URL,
        name: ORG_NAME,
        publisher: { '@id': ORG_ID },
      },
    ],
  };
}
