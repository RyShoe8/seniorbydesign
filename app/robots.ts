import { MetadataRoute } from 'next';

const PRIVATE_DISALLOW = ['/admin/', '/api/', '/brochure/view'];

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://seniorbydesign.com';

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: PRIVATE_DISALLOW,
      },
      {
        userAgent: 'GPTBot',
        allow: '/',
        disallow: PRIVATE_DISALLOW,
      },
      {
        userAgent: 'ClaudeBot',
        allow: '/',
        disallow: PRIVATE_DISALLOW,
      },
      {
        userAgent: 'PerplexityBot',
        allow: '/',
        disallow: PRIVATE_DISALLOW,
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
