import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getPortfolioCategory } from '../../actions';
import PortfolioGallery from '@/components/PortfolioGallery';
import RelatedServices from '@/components/RelatedServices';
import SeeOurWork from '@/components/SeeOurWork';
import PageSchema from '@/components/PageSchema';
import SeoImage from '@/components/SeoImage';
import { generateSEOMetadata, BreadcrumbSchema, CollectionPageSchema, CreativeWorkSchema } from '@/components/SEO';
import { absoluteUrl } from '@/lib/schema/constants';
import { getPortfolioImageUrl } from '@/lib/image-utils';
import {
  metaDescriptionForPortfolioCategory,
  portfolioCategoryIntro,
  portfolioCategoryKeywords,
  portfolioCategoryPageTitle,
  portfolioCategoryH1,
} from '@/lib/portfolio-seo';
import { portfolioAltText, ensureImageAlt, heroAlt } from '@/lib/image-seo';
import {
  primaryServiceLinkForPortfolio,
  serviceLinksForPortfolio,
  portfolioLinksForPortfolio,
} from '@/lib/internal-links';
import crossLinkStyles from '@/components/CrossLinks.module.css';
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
    title: portfolioCategoryPageTitle(categoryName, params.slug),
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
  const pageH1 = portfolioCategoryH1(categoryName, params.slug);
  const description = metaDescriptionForPortfolioCategory(categoryName, params.slug);
  const intro = portfolioCategoryIntro(categoryName, params.slug);
  const primaryService = primaryServiceLinkForPortfolio(params.slug);

  // Handle both old format (string[]) and new format (PortfolioImage[])
  let images: Array<{ url: string; displayName: string; altText: string }> = [];

  if (category.images && category.images.length > 0) {
    const firstImage = category.images[0];
    if (typeof firstImage === 'string') {
      images = (category.images as unknown as string[]).map((url: string, i: number) => {
        const alt = portfolioAltText({
          slug: params.slug,
          displayName: categoryName,
          index: i,
        });
        return {
          url,
          displayName: `${categoryName} image ${i + 1}`,
          altText: alt,
        };
      });
    } else {
      images = (category.images as Array<{ url: string; displayName: string; altText: string }>).map(
        (img, i) => ({
          ...img,
          altText: ensureImageAlt(
            img.altText,
            portfolioAltText({
              slug: params.slug,
              displayName: categoryName,
              storedAlt: img.altText,
              index: i,
            })
          ),
        })
      );
    }
  }

  const heroImageUrl = images[0]?.url;
  const heroImageSrc = heroImageUrl ? getPortfolioImageUrl(heroImageUrl) : null;
  const heroAltText =
    images[0]?.altText ||
    portfolioAltText({ slug: params.slug, displayName: categoryName }) ||
    heroAlt('portfolio-category');

  const imageUrls = images.map((img) => ({
    url: img.url,
    altText: img.altText || img.displayName,
  }));

  const creativeWorkImages = images.map((img) =>
    img.url.startsWith('http') ? img.url : absoluteUrl(getPortfolioImageUrl(img.url))
  );

  const keywords = portfolioCategoryKeywords(categoryName, params.slug).join(', ');

  return (
    <>
      <PageSchema
        schemas={[
          BreadcrumbSchema([
            { name: 'Home', url: '/' },
            { name: 'Portfolio', url: '/portfolio' },
            { name: categoryName, url: `/portfolio/${params.slug}` },
          ]),
          CollectionPageSchema({
            name: pageH1,
            description,
            url: `/portfolio/${params.slug}`,
            images: imageUrls,
            speakableSelectors: ['#portfolio-category-title', '#portfolio-category-intro'],
          }),
          CreativeWorkSchema({
            name: pageH1,
            description: intro,
            url: `/portfolio/${params.slug}`,
            images: creativeWorkImages,
            keywords,
          }),
        ]}
      />

      <section className={heroStyles.portfolioHero}>
        <div className={heroStyles.portfolioHeroImage}>
          {heroImageSrc ? (
            <SeoImage
              src={heroImageSrc}
              alt={heroAltText}
              fill
              className={heroStyles.heroImage}
              priority
              unoptimized={portfolioImageUnoptimized(heroImageUrl!)}
            />
          ) : (
            <div className={styles.heroPlaceholder} aria-hidden />
          )}
          <h1 id="portfolio-category-title">{pageH1}</h1>
        </div>
      </section>

      <section className={`${styles.introSection} reveal-on-scroll`}>
        <div className="container">
          <p id="portfolio-category-intro" className={styles.introText}>
            {intro}
          </p>
          <p className={styles.serviceCrossLink}>
            Explore our{' '}
            <Link href={primaryService.href} className={crossLinkStyles.inlineServiceLink}>
              {primaryService.label}
            </Link>{' '}
            service for communities like this.
          </p>
        </div>
      </section>

      <PortfolioGallery images={images} categoryName={categoryName} />

      <RelatedServices links={serviceLinksForPortfolio(params.slug)} />
      <SeeOurWork links={portfolioLinksForPortfolio(params.slug)} />
    </>
  );
}
