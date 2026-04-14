'use server';

import {
  getHomepageContentCollection,
  getPortfolioCategoriesCollection,
  getPartnersCollection,
  getTeamMembersCollection,
  getServicesCollection,
  getProjectsCollection,
  getPortfolioItemsCollection,
  getBlogPostsCollection,
  getResourcesCollection,
} from '@/lib/db';
import { blogPreviewTokensMatch } from '@/lib/blog-preview';
import { normalizeServiceSlug } from '@/lib/service-slug';

/** One-time per process: persist lowercase canonical service slugs in MongoDB. */
let serviceSlugMigration: Promise<void> | null = null;

async function runServiceSlugCanonicalMigration() {
  const collection = await getServicesCollection();
  const docs = await collection.find({}).toArray();
  for (const d of docs) {
    if (!d.slug || typeof d.slug !== 'string') continue;
    const canon = normalizeServiceSlug(d.slug);
    if (canon && d.slug !== canon) {
      await collection.updateOne(
        { _id: d._id },
        { $set: { slug: canon, updatedAt: new Date() } }
      );
    }
  }
}

function ensureServiceSlugMigration(): Promise<void> {
  if (!serviceSlugMigration) {
    serviceSlugMigration = runServiceSlugCanonicalMigration().catch((err) => {
      console.error('[services] Canonical slug migration failed:', err);
      serviceSlugMigration = null;
      return undefined;
    });
  }
  return serviceSlugMigration;
}

// Homepage
export async function getHomepageContent() {
  const collection = await getHomepageContentCollection();
  const content = await collection.findOne({});
  return content;
}

// Portfolio
export async function getPortfolioCategories() {
  const collection = await getPortfolioCategoriesCollection();
  
  // Handle migration for existing records without order field
  const categories = await collection.find({}).sort({ name: 1 }).toArray();
  const itemsWithoutOrder = categories.filter(cat => cat.order === undefined);
  
  if (itemsWithoutOrder.length > 0) {
    // Maintain current alphabetical order as default
    itemsWithoutOrder.forEach(async (cat, index) => {
      await collection.updateOne(
        { _id: cat._id },
        { $set: { order: index + 1 } }
      );
    });
  }
  
  // Always sort by order, fallback to name for items without order
  return await collection.find({}).sort({ order: 1, name: 1 }).toArray();
}

export async function getPortfolioCategory(slug: string) {
  const collection = await getPortfolioCategoriesCollection();
  return await collection.findOne({ slug });
}

export async function getPortfolioItem(slug: string) {
  const collection = await getPortfolioItemsCollection();
  return await collection.findOne({ slug });
}

// Partners
export async function getPartners() {
  try {
    const collection = await getPartnersCollection();
    const partners = await collection.find({}).sort({ order: 1 }).toArray();
    return partners;
  } catch (error) {
    return [];
  }
}

// Team
export async function getTeamMembers() {
  const collection = await getTeamMembersCollection();
  
  // Handle migration for existing records without order field
  const members = await collection.find({}).sort({ name: 1 }).toArray();
  const itemsWithoutOrder = members.filter(member => member.order === undefined);
  
  if (itemsWithoutOrder.length > 0) {
    // Maintain current alphabetical order as default
    itemsWithoutOrder.forEach(async (member, index) => {
      await collection.updateOne(
        { _id: member._id },
        { $set: { order: index + 1 } }
      );
    });
  }
  
  // Always sort by order, fallback to name for items without order
  return await collection.find({}).sort({ order: 1, name: 1 }).toArray();
}

export async function getTeamMember(slug: string) {
  const collection = await getTeamMembersCollection();
  return await collection.findOne({ slug });
}

// Services
export async function getServices() {
  await ensureServiceSlugMigration();
  const collection = await getServicesCollection();
  return await collection.find({}).sort({ title: 1 }).toArray();
}

export async function getService(slug: string) {
  await ensureServiceSlugMigration();
  const collection = await getServicesCollection();
  let decoded: string;
  try {
    decoded = decodeURIComponent(slug);
  } catch {
    decoded = slug;
  }
  const normalized = normalizeServiceSlug(decoded);

  const exact = await collection.findOne({ slug: decoded });
  if (exact) return exact;

  if (normalized) {
    const caseInsensitive = await collection.findOne({
      $expr: { $eq: [{ $toLower: '$slug' }, normalized] },
    });
    if (caseInsensitive) return caseInsensitive;
  }

  return null;
}

/** Published posts excluding one slug, most recent first (for related links). */
export async function getRelatedBlogPosts(currentSlug: string, limit = 3) {
  const posts = await getBlogPosts();
  return posts.filter((p) => p.slug && p.slug !== currentSlug).slice(0, limit);
}

// Projects
export async function getProjects() {
  const collection = await getProjectsCollection();
  return await collection.find({}).toArray();
}

// Blog
export async function getBlogPosts() {
  const collection = await getBlogPostsCollection();
  return await collection
    .find({ publishedAt: { $exists: true } })
    .sort({ publishedAt: -1 })
    .toArray()
    .then(posts => posts.filter(post => post.publishedAt != null));
}

export async function getPublishedBlogPost(slug: string) {
  const collection = await getBlogPostsCollection();
  const post = await collection.findOne({
    slug,
    publishedAt: { $exists: true },
  });
  if (!post?.publishedAt) {
    return null;
  }
  return post;
}

export async function getBlogPostForPreview(slug: string, token: string) {
  const collection = await getBlogPostsCollection();
  const post = await collection.findOne({ slug });
  if (!post || !blogPreviewTokensMatch(post.previewToken, token)) {
    return null;
  }
  return post;
}

// Resources
export async function getResources() {
  const collection = await getResourcesCollection();
  return await collection.find({}).sort({ name: 1 }).toArray();
}




