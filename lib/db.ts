import getClientPromise from './mongodb';
import {
  User,
  Service,
  PortfolioCategory,
  PortfolioItem,
  Project,
  TeamMember,
  BlogPost,
  Resource,
  Partner,
  HomepageContent,
  Media,
} from './models';

const DB_NAME = 'seniorbydesign';

export async function getDb() {
  const client = await getClientPromise();
  return client.db(DB_NAME);
}

// Collections
export async function getUsersCollection() {
  const db = await getDb();
  return db.collection<User>('users');
}

export async function getServicesCollection() {
  const db = await getDb();
  return db.collection<Service>('services');
}

export async function getPortfolioCategoriesCollection() {
  const db = await getDb();
  return db.collection<PortfolioCategory>('portfolioCategories');
}

export async function getPortfolioItemsCollection() {
  const db = await getDb();
  return db.collection<PortfolioItem>('portfolioItems');
}

export async function getProjectsCollection() {
  const db = await getDb();
  return db.collection<Project>('projects');
}

export async function getTeamMembersCollection() {
  const db = await getDb();
  return db.collection<TeamMember>('teamMembers');
}

export async function getBlogPostsCollection() {
  const db = await getDb();
  return db.collection<BlogPost>('blogPosts');
}

export async function getResourcesCollection() {
  const db = await getDb();
  return db.collection<Resource>('resources');
}

export async function getPartnersCollection() {
  const db = await getDb();
  return db.collection<Partner>('partners');
}

export async function getHomepageContentCollection() {
  const db = await getDb();
  return db.collection<HomepageContent>('homepageContent');
}

export async function getMediaCollection() {
  const db = await getDb();
  return db.collection<Media>('media');
}




