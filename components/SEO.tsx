import { Metadata } from 'next';

interface SEOProps {
  title: string;
  description: string;
  url?: string;
  image?: string;
  type?: 'website' | 'article' | 'profile';
  publishedTime?: string;
  modifiedTime?: string;
  author?: string;
  schema?: Record<string, any>;
  icons?: Metadata['icons'];
}

export function generateSEOMetadata({
  title,
  description,
  url,
  image = '/images/SBD Logo.webp',
  type = 'website',
  publishedTime,
  modifiedTime,
  author,
  icons,
}: SEOProps): Metadata {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://seniorbydesign.com';
  const fullUrl = url ? `${siteUrl}${url}` : siteUrl;
  const fullImage = image.startsWith('http') ? image : `${siteUrl}${image}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: fullUrl,
      siteName: 'Senior By Design',
      images: [
        {
          url: fullImage,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
      locale: 'en_US',
      type,
      ...(publishedTime && { publishedTime }),
      ...(modifiedTime && { modifiedTime }),
      ...(author && { authors: [author] }),
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [fullImage],
    },
    alternates: {
      canonical: fullUrl,
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    ...(icons && { icons }),
  };
}

interface JSONLDSchemaProps {
  schema: Record<string, any>;
}

export function JSONLDSchema({ schema }: JSONLDSchemaProps) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

// Organization Schema
export function OrganizationSchema() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://seniorbydesign.com';
  
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Senior By Design',
    url: siteUrl,
    logo: `${siteUrl}/images/SBD Logo.webp`,
    description: 'High-end corporate website for designing spaces for seniors',
    address: {
      '@type': 'PostalAddress',
      addressCountry: 'US',
    },
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: '+1-833-773-3744',
      contactType: 'Customer Service',
    },
    sameAs: [
      'https://www.facebook.com/Seniorbydesign',
      'https://www.linkedin.com/company/senior-by-design/',
      'https://www.youtube.com/@SeniorByDesign',
    ],
  };
}

// WebSite Schema with SearchAction
export function WebSiteSchema() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://seniorbydesign.com';
  
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Senior By Design',
    url: siteUrl,
    description: 'From concept to realization we take great pride in designing luxurious, soul-warming interiors distinctly tailored to the unique characteristics of each community we serve.',
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${siteUrl}/blog?search={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };
}

// Breadcrumb Schema
export function BreadcrumbSchema(items: Array<{ name: string; url: string }>) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://seniorbydesign.com';
  
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url.startsWith('http') ? item.url : `${siteUrl}${item.url}`,
    })),
  };
}

// Article Schema (for blog posts)
export function ArticleSchema({
  title,
  description,
  url,
  image,
  publishedTime,
  modifiedTime,
  author,
}: {
  title: string;
  description: string;
  url: string;
  image?: string;
  publishedTime?: string;
  modifiedTime?: string;
  author?: string;
}) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://seniorbydesign.com';
  const fullUrl = url.startsWith('http') ? url : `${siteUrl}${url}`;
  const fullImage = image
    ? image.startsWith('http')
      ? image
      : `${siteUrl}${image}`
    : `${siteUrl}/images/SBD Logo.webp`;

  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: title,
    description,
    image: fullImage,
    datePublished: publishedTime,
    dateModified: modifiedTime || publishedTime,
    author: {
      '@type': 'Organization',
      name: author || 'Senior By Design',
    },
    publisher: {
      '@type': 'Organization',
      name: 'Senior By Design',
      logo: {
        '@type': 'ImageObject',
        url: `${siteUrl}/images/SBD Logo.webp`,
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': fullUrl,
    },
  };
}

// Service Schema
export function ServiceSchema({
  name,
  description,
  url,
  image,
}: {
  name: string;
  description: string;
  url: string;
  image?: string;
}) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://seniorbydesign.com';
  const fullUrl = url.startsWith('http') ? url : `${siteUrl}${url}`;
  const fullImage = image
    ? image.startsWith('http')
      ? image
      : `${siteUrl}${image}`
    : `${siteUrl}/images/SBD Logo.webp`;

  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    serviceType: 'Interior Design',
    provider: {
      '@type': 'Organization',
      name: 'Senior By Design',
    },
    areaServed: {
      '@type': 'Country',
      name: 'United States',
    },
    name,
    description,
    image: fullImage,
    url: fullUrl,
  };
}

// Person Schema (for team members)
export function PersonSchema({
  name,
  jobTitle,
  description,
  url,
  image,
}: {
  name: string;
  jobTitle?: string;
  description?: string;
  url: string;
  image?: string;
}) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://seniorbydesign.com';
  const fullUrl = url.startsWith('http') ? url : `${siteUrl}${url}`;
  const fullImage = image
    ? image.startsWith('http')
      ? image
      : `${siteUrl}${image}`
    : `${siteUrl}/images/SBD Logo.webp`;

  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name,
    jobTitle,
    description,
    image: fullImage,
    url: fullUrl,
    worksFor: {
      '@type': 'Organization',
      name: 'Senior By Design',
    },
  };
}
