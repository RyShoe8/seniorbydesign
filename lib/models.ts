import { ObjectId } from 'mongodb';

export interface User {
  _id?: ObjectId;
  email: string;
  password: string;
  role: 'admin' | 'user';
  createdAt: Date;
  updatedAt: Date;
}

export interface Service {
  _id?: ObjectId;
  slug: string;
  title: string;
  heroImage?: string;
  body: string;
  images: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface PortfolioCategory {
  _id?: ObjectId;
  slug: string;
  name: string;
  images: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface PortfolioItem {
  _id?: ObjectId;
  slug: string;
  category: string;
  title: string;
  images: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Project {
  _id?: ObjectId;
  name: string;
  zipCode: string;
  latitude?: number;
  longitude?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface TeamMember {
  _id?: ObjectId;
  slug: string;
  name: string;
  title: string;
  bio: string;
  profileImage?: string;
  linkedin?: string;
  facebook?: string;
  instagram?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface BlogPost {
  _id?: ObjectId;
  slug: string;
  title: string;
  excerpt: string;
  body: string;
  featuredImage?: string;
  author: string;
  publishedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Resource {
  _id?: ObjectId;
  name: string;
  link: string;
  note?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Partner {
  _id?: ObjectId;
  name: string;
  logo: string;
  url?: string;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface HomepageContent {
  _id?: ObjectId;
  heroHeadline: string;
  heroSubheadline: string;
  heroVideo?: string;
  portfolioHighlights: string[];
  testimonials: {
    review: string;
    name: string;
    position: string;
    company: string;
  }[];
  partners: string[];
  updatedAt: Date;
}


