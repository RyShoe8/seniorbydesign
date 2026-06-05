import { Metadata } from 'next';
import { ORG_ID, SITE_URL, absoluteUrl } from '@/lib/schema/constants';

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
  image = '/images/senior-living-logo-design-sbd.webp',
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

// Organization Schema (legacy export; global graph is canonical via SchemaMarkup)
export function OrganizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': ORG_ID,
    name: 'Senior By Design',
    url: SITE_URL,
    logo: absoluteUrl('/images/senior-living-logo-design-sbd.webp'),
    description:
      'Boutique senior living interior design firm specializing in FF&E, space planning, and turnkey design for senior living communities nationwide.',
    foundingDate: '2000',
    numberOfEmployees: { '@type': 'QuantitativeValue', value: '50-100' },
    email: 'info@seniorbydesign.com',
    telephone: '+18337733744',
    sameAs: [
      'https://www.facebook.com/Seniorbydesign',
      'https://www.linkedin.com/company/senior-by-design/',
      'https://www.youtube.com/@SeniorByDesign',
      'https://www.instagram.com/seniorbydesign',
    ],
    areaServed: { '@type': 'Country', name: 'United States' },
  };
}

// WebSite schema (legacy export; global graph is canonical via SchemaMarkup)
export function WebSiteSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${SITE_URL}/#website`,
    name: 'Senior By Design',
    url: SITE_URL,
    publisher: { '@id': ORG_ID },
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

// Article JSON-LD for blog posts
export function ArticleSchema({
  title,
  description,
  url,
  image,
  publishedTime,
  modifiedTime,
  authorName: _authorName,
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
  authorName?: string;
  keywords?: string[];
  articleBody?: string;
  wordCount?: number;
}) {
  const fullUrl = url.startsWith('http') ? url : `${SITE_URL}${url}`;
  const fullImage = image
    ? image.startsWith('http')
      ? image
      : absoluteUrl(image)
    : absoluteUrl('/images/senior-living-logo-design-sbd.webp');

  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    '@id': `${fullUrl}#article`,
    headline: title,
    description,
    url: fullUrl,
    image: fullImage,
    datePublished: publishedTime,
    dateModified: modifiedTime || publishedTime,
    author: { '@id': ORG_ID },
    publisher: { '@id': ORG_ID },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': fullUrl,
    },
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
    : `${siteUrl}/images/senior-living-logo-design-sbd.webp`;

  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    '@id': `${fullUrl}#service`,
    serviceType: 'Interior Design',
    provider: { '@id': ORG_ID },
    areaServed: {
      '@type': 'Country',
      name: 'United States',
    },
    audience: {
      '@type': 'Audience',
      audienceType:
        'Senior Living Operators, Senior Housing Developers, Senior Living Communities',
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
  sameAs,
}: {
  name: string;
  jobTitle?: string;
  description?: string;
  url: string;
  image?: string;
  sameAs?: string[];
}) {
  const fullUrl = url.startsWith('http') ? url : `${SITE_URL}${url}`;
  const fullImage = image
    ? image.startsWith('http')
      ? image
      : absoluteUrl(image)
    : absoluteUrl('/images/senior-living-logo-design-sbd.webp');

  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name,
    jobTitle,
    description,
    image: fullImage,
    url: fullUrl,
    worksFor: { '@id': ORG_ID },
  };

  if (sameAs && sameAs.length > 0) {
    schema.sameAs = sameAs;
  }

  return schema;
}

// CreativeWork Schema (portfolio category pages)
export function CreativeWorkSchema({
  name,
  description,
  url,
  images,
  keywords,
}: {
  name: string;
  description: string;
  url: string;
  images: string[];
  keywords?: string;
}) {
  const fullUrl = url.startsWith('http') ? url : `${SITE_URL}${url}`;
  const imageUrls = images.map((img) => (img.startsWith('http') ? img : absoluteUrl(img)));

  return {
    '@context': 'https://schema.org',
    '@type': 'CreativeWork',
    '@id': `${fullUrl}#creativework`,
    name,
    description,
    url: fullUrl,
    creator: { '@id': ORG_ID },
    image: imageUrls,
    keywords: keywords || 'senior living interior design',
    genre: 'Interior Design Portfolio',
  };
}

// LocalBusiness Schema (legacy; use global graph via SchemaMarkup)
export function LocalBusinessSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    '@id': `${SITE_URL}/#localbusiness`,
    name: 'Senior By Design',
    url: SITE_URL,
    telephone: '+18337733744',
    email: 'info@seniorbydesign.com',
  };
}

// CollectionPage Schema (for portfolio category pages)
export function CollectionPageSchema({
  name,
  description,
  url,
  images,
  speakableSelectors,
}: {
  name: string;
  description?: string;
  url: string;
  images?: Array<{ url: string; altText?: string }>;
  speakableSelectors?: string[];
}) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://seniorbydesign.com';
  const fullUrl = url.startsWith('http') ? url : `${siteUrl}${url}`;
  const orgId = `${siteUrl}/#organization`;

  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    '@id': `${fullUrl}#collectionpage`,
    name,
    description: description || `Explore our ${name} portfolio showcasing our interior design work.`,
    url: fullUrl,
    inLanguage: 'en-US',
    isAccessibleForFree: true,
    publisher: {
      '@type': 'Organization',
      '@id': orgId,
      name: 'Senior By Design',
      url: siteUrl,
    },
    isPartOf: {
      '@type': 'WebSite',
      '@id': `${siteUrl}/#website`,
      name: 'Senior By Design',
      url: siteUrl,
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': fullUrl,
    },
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

  if (speakableSelectors && speakableSelectors.length > 0) {
    schema.speakable = {
      '@type': 'SpeakableSpecification',
      cssSelector: speakableSelectors,
    };
  }

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
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };
}
