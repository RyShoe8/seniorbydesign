import { MetadataRoute } from 'next';
import {
  getPortfolioCategories,
  getServices,
  getTeamMembers,
  getBlogPosts,
} from './actions';
import { normalizeServiceSlug } from '@/lib/service-slug';
import { teamMemberBioWordCount } from '@/lib/team-bio-fallbacks';

// Revalidate sitemap periodically; blog admin APIs also call revalidatePath('/sitemap.xml')
export const revalidate = 300;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://seniorbydesign.com';

  // Note: Admin pages (/admin/*) and API routes (/api/*) are explicitly excluded from the sitemap
  // They are protected by authentication middleware and should not be indexed by search engines

  try {
    // Static pages
    const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/senior-living-design-firm`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/experience`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/services`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/portfolio`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/team`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/blog`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/newsletter-and-brochure`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${baseUrl}/privacy-policy`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
  ];

    // Dynamic portfolio categories
    const portfolioCategories = await getPortfolioCategories().catch(() => []);
    const portfolioPages: MetadataRoute.Sitemap = portfolioCategories
      .filter((category) => category.slug) // Only include categories with valid slugs
      .map((category) => ({
        url: `${baseUrl}/portfolio/${encodeURIComponent(category.slug)}`,
        lastModified: category.updatedAt ? new Date(category.updatedAt) : new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.8,
      }));

    // Dynamic services
    const services = await getServices().catch(() => []);
    const servicePages: MetadataRoute.Sitemap = services
      .filter((service) => service.slug) // Only include services with valid slugs
      .map((service) => ({
        url: `${baseUrl}/services/${encodeURIComponent(normalizeServiceSlug(service.slug))}`,
        lastModified: service.updatedAt ? new Date(service.updatedAt) : new Date(),
        changeFrequency: 'monthly' as const,
        priority: 0.7,
      }));

    // Dynamic team members — omit thin bios (< 100 words) from sitemap
    const teamMembers = await getTeamMembers().catch(() => []);
    const teamPages: MetadataRoute.Sitemap = teamMembers
      .filter(
        (member) => member.slug && teamMemberBioWordCount(member.slug, member.bio) >= 100
      )
      .map((member) => ({
        url: `${baseUrl}/team/${encodeURIComponent(member.slug)}`,
        lastModified: member.updatedAt ? new Date(member.updatedAt) : new Date(),
        changeFrequency: 'monthly' as const,
        priority: 0.6,
      }));

    // Dynamic blog posts - only include published posts
    const blogPosts = await getBlogPosts().catch(() => []);
    const blogPages: MetadataRoute.Sitemap = blogPosts
      .filter((post) => post.slug && post.publishedAt) // Only include published posts with valid slugs
      .map((post) => ({
        url: `${baseUrl}/blog/${encodeURIComponent(post.slug)}`,
        lastModified: post.updatedAt 
          ? new Date(post.updatedAt) 
          : post.publishedAt 
            ? new Date(post.publishedAt) 
            : new Date(),
        changeFrequency: 'monthly' as const,
        priority: 0.7,
      }));

    return [
      ...staticPages,
      ...portfolioPages,
      ...servicePages,
      ...teamPages,
      ...blogPages,
    ];
  } catch (error) {
    // If there's an error, return at least the static pages
    console.error('Error generating sitemap:', error);
    return [
      {
        url: baseUrl,
        lastModified: new Date(),
        changeFrequency: 'daily',
        priority: 1,
      },
    ];
  }
}
