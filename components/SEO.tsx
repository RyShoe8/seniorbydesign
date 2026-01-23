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
  keywords,
}: SEOProps & { keywords?: string[] }): Metadata {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://seniorbydesign.com';
  const fullUrl = url ? `${siteUrl}${url}` : siteUrl;
  const fullImage = image.startsWith('http') ? image : `${siteUrl}${image}`;

  const metadata: Metadata = {
    title,
    description,
    keywords: keywords ? keywords.join(', ') : undefined,
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
      creator: '@SeniorByDesign',
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
    other: {
      'apple-mobile-web-app-capable': 'yes',
      'apple-mobile-web-app-status-bar-style': 'black-translucent',
    },
  };

  return metadata;
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
    '@id': `${siteUrl}/#organization`,
    name: 'Senior By Design',
    url: siteUrl,
    logo: {
      '@type': 'ImageObject',
      url: `${siteUrl}/images/SBD Logo.webp`,
      width: 1200,
      height: 630,
    },
    description: 'From concept to realization we take great pride in designing luxurious, soul-warming interiors distinctly tailored to the unique characteristics of each community we serve. Specializing in senior living communities, multifamily, and commercial interior design.',
    foundingDate: '2000',
    numberOfEmployees: {
      '@type': 'QuantitativeValue',
      value: '50-100',
    },
    address: {
      '@type': 'PostalAddress',
      addressCountry: 'US',
    },
    contactPoint: [
      {
        '@type': 'ContactPoint',
        telephone: '+1-833-773-3744',
        contactType: 'Customer Service',
        areaServed: 'US',
        availableLanguage: 'English',
      },
    ],
    sameAs: [
      'https://www.facebook.com/Seniorbydesign',
      'https://www.linkedin.com/company/senior-by-design/',
      'https://www.youtube.com/@SeniorByDesign',
    ],
    knowsAbout: [
      'Interior Design',
      'Senior Living Design',
      'Multifamily Design',
      'Commercial Interior Design',
      'FF&E Services',
      'Space Planning',
      'Furniture Procurement',
    ],
    areaServed: {
      '@type': 'Country',
      name: 'United States',
    },
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
  keywords,
}: {
  title: string;
  description: string;
  url: string;
  image?: string;
  publishedTime?: string;
  modifiedTime?: string;
  author?: string;
  keywords?: string[];
}) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://seniorbydesign.com';
  const fullUrl = url.startsWith('http') ? url : `${siteUrl}${url}`;
  const fullImage = image
    ? image.startsWith('http')
      ? image
      : `${siteUrl}${image}`
    : `${siteUrl}/images/SBD Logo.webp`;

  const schema: any = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: title,
    description,
    image: {
      '@type': 'ImageObject',
      url: fullImage,
      width: 1200,
      height: 630,
    },
    datePublished: publishedTime,
    dateModified: modifiedTime || publishedTime,
    author: {
      '@type': 'Organization',
      name: author || 'Senior By Design',
      url: siteUrl,
    },
    publisher: {
      '@type': 'Organization',
      name: 'Senior By Design',
      logo: {
        '@type': 'ImageObject',
        url: `${siteUrl}/images/SBD Logo.webp`,
        width: 1200,
        height: 630,
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': fullUrl,
    },
    articleSection: 'Interior Design',
    inLanguage: 'en-US',
  };

  if (keywords && keywords.length > 0) {
    schema.keywords = keywords.join(', ');
  }

  return schema;
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

// LocalBusiness Schema (for contact page)
export function LocalBusinessSchema() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://seniorbydesign.com';
  
  return {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    '@id': `${siteUrl}/#organization`,
    name: 'Senior By Design',
    image: `${siteUrl}/images/SBD Logo.webp`,
    url: siteUrl,
    telephone: '+1-833-773-3744',
    priceRange: '$$',
    address: {
      '@type': 'PostalAddress',
      addressCountry: 'US',
    },
    geo: {
      '@type': 'GeoCoordinates',
      addressCountry: 'US',
    },
    sameAs: [
      'https://www.facebook.com/Seniorbydesign',
      'https://www.linkedin.com/company/senior-by-design/',
      'https://www.youtube.com/@SeniorByDesign',
    ],
  };
}

// CollectionPage Schema (for portfolio category pages)
export function CollectionPageSchema({
  name,
  description,
  url,
  images,
}: {
  name: string;
  description?: string;
  url: string;
  images?: Array<{ url: string; altText?: string }>;
}) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://seniorbydesign.com';
  const fullUrl = url.startsWith('http') ? url : `${siteUrl}${url}`;
  
  const schema: any = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name,
    description: description || `Explore our ${name} portfolio showcasing our interior design work.`,
    url: fullUrl,
    mainEntity: {
      '@type': 'ItemList',
      itemListElement: images?.map((img, index) => ({
        '@type': 'ImageObject',
        position: index + 1,
        contentUrl: img.url.startsWith('http') ? img.url : `${siteUrl}${img.url}`,
        name: img.altText || `${name} - Image ${index + 1}`,
      })) || [],
    },
  };
  
  return schema;
}

// ImageGallery Schema (for portfolio pages)
export function ImageGallerySchema({
  name,
  description,
  images,
}: {
  name: string;
  description?: string;
  images: Array<{ url: string; altText?: string; displayName?: string }>;
}) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://seniorbydesign.com';
  
  return {
    '@context': 'https://schema.org',
    '@type': 'ImageGallery',
    name,
    description: description || `Image gallery showcasing ${name} portfolio work.`,
    image: images.map(img => ({
      '@type': 'ImageObject',
      contentUrl: img.url.startsWith('http') ? img.url : `${siteUrl}${img.url}`,
      name: img.altText || img.displayName || name,
      description: img.altText || img.displayName || name,
    })),
  };
}

// VideoObject Schema (for embedded videos)
export function VideoObjectSchema({
  name,
  description,
  thumbnailUrl,
  uploadDate,
  contentUrl,
  embedUrl,
}: {
  name: string;
  description?: string;
  thumbnailUrl?: string;
  uploadDate?: string;
  contentUrl?: string;
  embedUrl: string;
}) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://seniorbydesign.com';
  
  return {
    '@context': 'https://schema.org',
    '@type': 'VideoObject',
    name,
    description: description || name,
    thumbnailUrl: thumbnailUrl ? (thumbnailUrl.startsWith('http') ? thumbnailUrl : `${siteUrl}${thumbnailUrl}`) : undefined,
    uploadDate,
    contentUrl,
    embedUrl,
  };
}

// FAQPage Schema
export function FAQPageSchema(faqs: Array<{ question: string; answer: string }>) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://seniorbydesign.com';
  
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(faq => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };
}
