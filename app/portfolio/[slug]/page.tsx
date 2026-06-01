import { Metadata } from 'next';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { getPortfolioCategory } from '../../actions';
import PortfolioGallery from '@/components/PortfolioGallery';
import { generateSEOMetadata, JSONLDSchema, BreadcrumbSchema, CollectionPageSchema, ImageGallerySchema } from '@/components/SEO';
import { getPortfolioImageUrl } from '@/lib/image-utils';
import {
  metaDescriptionForPortfolioCategory,
  portfolioCategoryIntro,
  portfolioCategoryKeywords,
} from '@/lib/portfolio-seo';
import heroStyles from '../page.module.css';
import styles from './page.module.css';

type Props = {
  params: { slug: string };
};

function portfolioImageUnoptimized(url: string): boolean {
  const resolved = getPortfolioImageUrl(url);
  return resolved.startsWith('http') || resolved.startsWith('/api/image-proxy');
}

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
    description: metaDescriptionForPortfolioCategory(categoryName, params.slug),
    url: `/portfolio/${params.slug}`,
    image: imageUrl,
    type: 'website',
    keywords: portfolioCategoryKeywords(categoryName, params.slug),
  });
}

export default async function PortfolioDetailPage({ params }: Props) {
  const category = await getPortfolioCategory(params.slug);

  if (!category) {
    notFound();
  }

  const categoryName = category.name || '';
  const description = metaDescriptionForPortfolioCategory(categoryName, params.slug);
  const intro = portfolioCategoryIntro(categoryName, params.slug);

  // Handle both old format (string[]) and new format (PortfolioImage[])
  let images: Array<{ url: string; displayName: string; altText: string }> = [];

  if (category.images && category.images.length > 0) {
    const firstImage = category.images[0];
    if (typeof firstImage === 'string') {
      images = (category.images as unknown as string[]).map((url: string, i: number) => ({
        url,
        displayName: `${categoryName} image ${i + 1}`,
        altText: `${categoryName} image ${i + 1}`,
      }));
    } else {
      images = category.images as Array<{ url: string; displayName: string; altText: string }>;
    }
  }

  const heroImageUrl = images[0]?.url;
  const heroImageSrc = heroImageUrl ? getPortfolioImageUrl(heroImageUrl) : null;
  const heroAlt = images[0]?.altText || images[0]?.displayName || categoryName;

  const imageUrls = images.map((img) => ({
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
        description,
        url: `/portfolio/${params.slug}`,
        images: imageUrls,
        speakableSelectors: ['#portfolio-category-title', '#portfolio-category-intro'],
      })} />
      <JSONLDSchema schema={ImageGallerySchema({
        name: categoryName,
        description,
        images: imageUrls,
      })} />

      <section className={heroStyles.portfolioHero}>
        <div className={heroStyles.portfolioHeroImage}>
          {heroImageSrc ? (
            <Image
              src={heroImageSrc}
              alt={heroAlt}
              fill
              className={heroStyles.heroImage}
              priority
              unoptimized={portfolioImageUnoptimized(heroImageUrl!)}
            />
          ) : (
            <div className={styles.heroPlaceholder} aria-hidden />
          )}
          <h1 id="portfolio-category-title">{categoryName}</h1>
        </div>
      </section>

      <section className={styles.introSection}>
        <div className="container">
          <p id="portfolio-category-intro" className={styles.introText}>
            {intro}
          </p>
        </div>
      </section>

      <PortfolioGallery images={images} categoryName={categoryName} />
    </>
  );
}
