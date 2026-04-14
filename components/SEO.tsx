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
      ...(author && { authors: [{ name: author }] }),
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
        email: 'info@seniorbydesign.com',
      },
    ],
    email: 'info@seniorbydesign.com',
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

// WebSite schema (SearchAction removed until /blog supports the same query contract)
export function WebSiteSchema() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://seniorbydesign.com';

  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Senior By Design',
    url: siteUrl,
    description:
      'From concept to realization we take great pride in designing luxurious, soul-warming interiors distinctly tailored to the unique characteristics of each community we serve.',
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

/** ItemList for index pages (blog/services) to clarify crawlable URL sets. */
export function IndexItemListSchema(options: {
  name: string;
  description?: string;
  items: Array<{ name: string; urlPath: string }>;
}) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://seniorbydesign.com';

  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: options.name,
    ...(options.description ? { description: options.description } : {}),
    numberOfItems: options.items.length,
    itemListElement: options.items.map((it, index) => {
      const itemUrl = it.urlPath.startsWith('http') ? it.urlPath : `${siteUrl}${it.urlPath}`;
      return {
        '@type': 'ListItem',
        position: index + 1,
        name: it.name,
        item: {
          '@type': 'WebPage',
          '@id': `${itemUrl}#webpage`,
          url: itemUrl,
          name: it.name,
        },
      };
    }),
  };
}

// BlogPosting JSON-LD (blog posts; exported as ArticleSchema for backward compatibility)
export function ArticleSchema({
  title,
  description,
  url,
  image,
  publishedTime,
  modifiedTime,
  authorName,
  keywords,
  articleBody,
  wordCount,
}: {
  title: string;
  description: string;
  url: string;
  image?: string;
  publishedTime?: string;
  modifiedTime?: string;
  /** Display author (Person); falls back to organization if empty */
  authorName?: string;
  keywords?: string[];
  articleBody?: string;
  wordCount?: number;
}) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://seniorbydesign.com';
  const orgId = `${siteUrl}/#organization`;
  const fullUrl = url.startsWith('http') ? url : `${siteUrl}${url}`;
  const fullImage = image
    ? image.startsWith('http')
      ? image
      : `${siteUrl}${image}`
    : `${siteUrl}/images/SBD Logo.webp`;

  const byline = authorName?.trim();
  const authorNode = byline
    ? {
        '@type': 'Person',
        name: byline,
      }
    : {
        '@type': 'Organization',
        name: 'Senior By Design',
        url: siteUrl,
      };

  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    '@id': `${fullUrl}#blogposting`,
    headline: title,
    description,
    url: fullUrl,
    image: {
      '@type': 'ImageObject',
      url: fullImage,
      width: 1200,
      height: 630,
    },
    datePublished: publishedTime,
    dateModified: modifiedTime || publishedTime,
    author: authorNode,
    publisher: {
      '@type': 'Organization',
      '@id': orgId,
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
    isAccessibleForFree: true,
    speakable: {
      '@type': 'SpeakableSpecification',
      cssSelector: ['#blog-article-title', '#blog-article-body'],
    },
  };

  if (keywords && keywords.length > 0) {
    schema.keywords = keywords.join(', ');
  }
  if (articleBody) {
    schema.articleBody = articleBody;
  }
  if (wordCount != null && wordCount > 0) {
    schema.wordCount = wordCount;
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

  const orgId = `${siteUrl}/#organization`;

  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    '@id': `${fullUrl}#service`,
    serviceType: 'Interior Design',
    provider: {
      '@type': 'Organization',
      '@id': orgId,
      name: 'Senior By Design',
      url: siteUrl,
    },
    areaServed: {
      '@type': 'Country',
      name: 'United States',
    },
    name,
    description,
    image: fullImage,
    url: fullUrl,
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': fullUrl,
    },
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
    email: 'info@seniorbydesign.com',
    priceRange: '$$',
    description: 'From concept to realization we take great pride in designing luxurious, soul-warming interiors distinctly tailored to the unique characteristics of each community we serve. Specializing in senior living communities, multifamily, and commercial interior design.',
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
    areaServed: {
      '@type': 'Country',
      name: 'United States',
    },
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
