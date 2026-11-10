import { getDesignGuideContentCollection, getPortfolioCategoriesCollection, getHomepageContentCollection } from '@/lib/db';
import StoryExperience from './StoryExperience';

export const revalidate = 0;

export default async function ExperiencePage() {
  const col = await getDesignGuideContentCollection();
  const content = await col.findOne({});

  // Portfolio photographs and homepage testimonials are always loaded, so the builder's live
  // draft preview can switch between them and custom content before anything is saved.
  let portfolioImages: Array<{ src: string; alt: string; category?: string; caption?: string }> = [];
  {
    const portCol = await getPortfolioCategoriesCollection();
    const categories = await portCol.find({}).sort({ order: 1 }).toArray();
    portfolioImages = categories.flatMap((cat) =>
      (cat.images || []).slice(0, 14).map((img) => ({
        src: img.url,
        alt: img.altText || img.displayName || cat.name,
        category: cat.name,
        caption: img.displayName || undefined,
      }))
    );
  }

  // Fetch testimonials if using existing ones
  let existingTestimonials: Array<{ quote: string; name: string; title?: string; rating?: number }> = [];
  {
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
    <StoryExperience
      content={serialized}
      portfolioImages={portfolioImages}
      existingTestimonials={existingTestimonials}
    />
  );
}
