import { getDesignGuideContentCollection, getPortfolioCategoriesCollection, getHomepageContentCollection } from '@/lib/db';
import ExperienceClient from './ExperienceClient';

export const revalidate = 0;

export default async function ExperiencePage() {
  const col = await getDesignGuideContentCollection();
  const content = await col.findOne({});

  // Fetch portfolio images if using existing portfolio
  let portfolioImages: Array<{ src: string; alt: string; category?: string; caption?: string }> = [];
  if (content?.portfolio?.useExistingPortfolio) {
    const portCol = await getPortfolioCategoriesCollection();
    const categories = await portCol.find({}).sort({ order: 1 }).toArray();
    portfolioImages = categories.flatMap((cat) =>
      (cat.images || []).map((img) => ({
        src: img.url,
        alt: img.altText || img.displayName || cat.name,
        category: cat.name,
        caption: img.displayName || undefined,
      }))
    );
  }

  // Fetch testimonials if using existing ones
  let existingTestimonials: Array<{ quote: string; name: string; title?: string; rating?: number }> = [];
  if (content?.testimonials?.useExistingTestimonials) {
    const homeCol = await getHomepageContentCollection();
    const homepageContent = await homeCol.findOne({});
    if (homepageContent?.testimonials) {
      existingTestimonials = homepageContent.testimonials.map((t) => ({
        quote: t.review,
        name: t.name,
        title: [t.position, t.company].filter(Boolean).join(', ') || undefined,
      }));
    }
  }

  // Serialize for client (strip ObjectId, Date)
  const serialized = content
    ? JSON.parse(JSON.stringify(content))
    : null;

  return (
    <ExperienceClient
      content={serialized}
      portfolioImages={portfolioImages}
      existingTestimonials={existingTestimonials}
    />
  );
}
