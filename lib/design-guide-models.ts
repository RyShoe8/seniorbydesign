import { ObjectId } from 'mongodb';

/* ------------------------------------------------------------------ */
/*  Design Guide / "The Senior By Design Experience"                   */
/*  Every field is editable through the admin panel.                    */
/* ------------------------------------------------------------------ */

/** A single statistic counter (e.g. "25+ Years in Business"). */
export interface DGStat {
  value: string;   // numeric or text value ("25+", "500", "98%")
  label: string;   // description beneath the number
  suffix?: string; // optional suffix appended after animated count ("+", "%", etc.)
}

/** A CTA button. */
export interface DGButton {
  label: string;
  href: string;
}

/** An image reference that can be swapped from the admin panel. */
export interface DGImage {
  src: string;     // URL (Vercel Blob, /images/*, or absolute)
  alt: string;
}

/* ---------- Section: Hero ----------------------------------------- */
export interface DGHero {
  headline: string;
  subheadline: string;
  backgroundImage: DGImage;
  ctaPrimary: DGButton;
  ctaSecondary: DGButton;
}

/* ---------- Section: Company Introduction ------------------------- */
export interface DGIntro {
  headline: string;
  body: string;
  stats: DGStat[];
  cards: DGIntroCard[];
}

export interface DGIntroCard {
  icon: string;       // emoji or icon name
  title: string;
  description: string;
  image?: DGImage;
}

/* ---------- Section: Why Senior By Design ------------------------- */
export interface DGWhyUs {
  headline: string;
  subheadline?: string;
  cards: DGWhyUsCard[];
}

export interface DGWhyUsCard {
  icon: string;
  title: string;
  description: string;
}

/* ---------- Section: Services ------------------------------------- */
export interface DGService {
  title: string;
  description: string;
  image: DGImage;
  details: string;   // expanded content (HTML-safe string)
  order: number;
}

export interface DGServicesSection {
  headline: string;
  subheadline?: string;
  items: DGService[];
}

/* ---------- Section: Aging In Place ------------------------------- */
export interface DGAgingInPlace {
  headline: string;
  body: string;
  image?: DGImage;
  stats: DGStat[];
  features: DGAgingFeature[];
}

export interface DGAgingFeature {
  icon: string;
  title: string;
  description: string;
}

/* ---------- Section: Process Timeline ----------------------------- */
export interface DGProcessStep {
  phase: string;      // e.g. "01"
  title: string;
  description: string;
  icon: string;
}

export interface DGProcess {
  headline: string;
  subheadline?: string;
  steps: DGProcessStep[];
}

/* ---------- Section: Portfolio ------------------------------------ */
export interface DGPortfolio {
  headline: string;
  subheadline?: string;
  /** When true, pulls images from the existing portfolioCategories collection. */
  useExistingPortfolio: boolean;
  /** Custom curated images (used when useExistingPortfolio is false). */
  images: DGPortfolioImage[];
}

export interface DGPortfolioImage {
  src: string;
  alt: string;
  category?: string;
  caption?: string;
}

/* ---------- Section: Testimonials --------------------------------- */
export interface DGTestimonial {
  quote: string;
  name: string;
  title?: string;
  image?: DGImage;
  rating?: number;    // 1-5 stars
  videoUrl?: string;  // optional video testimonial
}

export interface DGTestimonialsSection {
  headline: string;
  subheadline?: string;
  /** When true, pulls from existing homepageContent.testimonials. */
  useExistingTestimonials: boolean;
  items: DGTestimonial[];
}

/* ---------- Section: Financing ------------------------------------ */
export interface DGFinancing {
  headline: string;
  body: string;
  examples?: Array<{ label: string; value: string }>;
}

/* ---------- Section: FAQ ------------------------------------------ */
export interface DGFAQ {
  question: string;
  answer: string;
}

export interface DGFAQSection {
  headline: string;
  items: DGFAQ[];
}

/* ---------- Section: CTA / Contact -------------------------------- */
export interface DGCTA {
  headline: string;
  subheadline: string;
  phone: string;
  email: string;
  showConsultationForm: boolean;
  backgroundImage?: DGImage;
}

/* ---------- Top-level document ------------------------------------ */
export interface DesignGuideContent {
  _id?: ObjectId;
  hero: DGHero;
  intro: DGIntro;
  whyUs: DGWhyUs;
  services: DGServicesSection;
  agingInPlace: DGAgingInPlace;
  process: DGProcess;
  portfolio: DGPortfolio;
  testimonials: DGTestimonialsSection;
  financing: DGFinancing;
  faq: DGFAQSection;
  cta: DGCTA;
  updatedAt: Date;
}
