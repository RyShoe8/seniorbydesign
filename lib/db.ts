import { Collection } from 'mongodb';
import getClientPromise from './mongodb';

const DB_NAME = process.env.MONGODB_DB_NAME || 'seniorbydesign';

async function getCollection<T>(collectionName: string): Promise<Collection<T>> {
  const client = await getClientPromise();
  const db = client.db(DB_NAME);
  return db.collection<T>(collectionName);
}

export async function getUsersCollection() {
  return getCollection('users');
}

export async function getTeamMembersCollection() {
  return getCollection('teamMembers');
}

export async function getServicesCollection() {
  return getCollection('services');
}

export async function getProjectsCollection() {
  return getCollection('projects');
}

export async function getPortfolioCategoriesCollection() {
  return getCollection('portfolioCategories');
}

export async function getResourcesCollection() {
  return getCollection('resources');
}

export async function getPartnersCollection() {
  return getCollection('partners');
}
