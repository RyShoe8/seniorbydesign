import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getPortfolioCategory } from '../../actions';
import PortfolioGallery from '@/components/PortfolioGallery';
import { generateSEOMetadata, JSONLDSchema, BreadcrumbSchema, CollectionPageSchema, ImageGallerySchema } from '@/components/SEO';

type Props = {
  params: { slug: string };
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const category = await getPortfolioCategory(params.slug);
  
  if (!category) {
    return {
      title: 'Portfolio Category Not Found',
    };
  }

  const categoryName = category.name || 'Portfolio';
  const firstImage = category.images?.[0];
  const imageUrl = typeof firstImage === 'string' ? firstImage : firstImage?.url;

  return generateSEOMetadata({
    title: `${categoryName} - Portfolio - Senior By Design`,
    description: `Explore our ${categoryName} portfolio showcasing our interior design work for senior living communities.`,
    url: `/portfolio/${params.slug}`,
    image: imageUrl,
    type: 'website',
    keywords: [
      'interior design portfolio',
      categoryName.toLowerCase(),
      'senior living design',
      'commercial design',
    ],
  });
}

export default async function PortfolioDetailPage({ params }: Props) {
  const category = await getPortfolioCategory(params.slug);

  if (!category) {
    notFound();
  }

  const categoryName = category.name || '';
  
  // Handle both old format (string[]) and new format (PortfolioImage[])
  let images: Array<{ url: string; displayName: string; altText: string }> = [];
  
  if (category.images && category.images.length > 0) {
    const firstImage = category.images[0];
    if (typeof firstImage === 'string') {
      // Old format: string[] - convert to PortfolioImage[]
      images = (category.images as unknown as string[]).map((url: string, i: number) => ({
        url,
        displayName: `${categoryName} image ${i + 1}`,
        altText: `${categoryName} image ${i + 1}`,
      }));
    } else {
      // New format: PortfolioImage[]
      images = category.images as Array<{ url: string; displayName: string; altText: string }>;
    }
  }

  const imageUrls = images.map(img => ({
    url: img.url,
    altText: img.altText || img.displayName,
  }));

  return (
    <>
      <JSONLDSchema schema={BreadcrumbSchema([
        { name: 'Home', url: '/' },
        { name: 'Portfolio', url: '/portfolio' },
        { name: categoryName, url: `/portfolio/${params.slug}` },
      ])} />
      <JSONLDSchema schema={CollectionPageSchema({
        name: categoryName,
        description: `Explore our ${categoryName} portfolio showcasing our interior design work for senior living communities.`,
        url: `/portfolio/${params.slug}`,
        images: imageUrls,
      })} />
      <JSONLDSchema schema={ImageGallerySchema({
        name: categoryName,
        description: `Image gallery showcasing ${categoryName} portfolio work.`,
        images: imageUrls,
      })} />
      <PortfolioGallery images={images} categoryName={categoryName} />
    </>
  );
}




