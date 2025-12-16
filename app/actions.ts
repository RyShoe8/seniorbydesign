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
import { ObjectId } from 'mongodb';

// Homepage
export async function getHomepageContent() {
  const collection = await getHomepageContentCollection();
  const content = await collection.findOne({});
  return content;
}

// Portfolio
export async function getPortfolioCategories() {
  const collection = await getPortfolioCategoriesCollection();
  return await collection.find({}).sort({ name: 1 }).toArray();
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
  const collection = await getPartnersCollection();
  return await collection.find({}).sort({ order: 1 }).toArray();
}

// Team
export async function getTeamMembers() {
  const collection = await getTeamMembersCollection();
  return await collection.find({}).sort({ name: 1 }).toArray();
}

export async function getTeamMember(slug: string) {
  const collection = await getTeamMembersCollection();
  return await collection.findOne({ slug });
}

// Services
export async function getServices() {
  const collection = await getServicesCollection();
  return await collection.find({}).sort({ title: 1 }).toArray();
}

export async function getService(slug: string) {
  const collection = await getServicesCollection();
  return await collection.findOne({ slug });
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
    .toArray();
}

export async function getBlogPost(slug: string) {
  const collection = await getBlogPostsCollection();
  return await collection.findOne({ slug });
}

// Resources
export async function getResources() {
  const collection = await getResourcesCollection();
  return await collection.find({}).sort({ name: 1 }).toArray();
}


