import { Metadata } from 'next';
import Link from 'next/link';
import { getPortfolioCategories, getProjects } from '../actions';
import PortfolioMap from '@/components/PortfolioMap';
import NewsletterCTA from '@/components/NewsletterCTA';
import PortfolioCategoryImage from '@/components/PortfolioCategoryImage';
import PageSchema from '@/components/PageSchema';
import SeoImage from '@/components/SeoImage';
import { generateSEOMetadata, BreadcrumbSchema } from '@/components/SEO';
import {
  PORTFOLIO_INDEX_TITLE,
  PORTFOLIO_INDEX_H1,
  PORTFOLIO_INDEX_META,
  PORTFOLIO_INDEX_INTRO,
  portfolioCategoryDisplayLabel,
} from '@/lib/portfolio-seo';
import { portfolioAltText, ensureImageAlt, heroAlt, STATIC_IMAGES } from '@/lib/image-seo';
import styles from './page.module.css';

export const metadata: Metadata = generateSEOMetadata({
  title: PORTFOLIO_INDEX_TITLE,
  description: PORTFOLIO_INDEX_META,
  url: '/portfolio',
  type: 'website',
  keywords: [
    'senior living interior design portfolio',
    'senior living design',
    'memory care interior design',
    'active adult community interior design',
  ],
});

export const revalidate = 0;

export default async function Portfolio() {
  const categories = await getPortfolioCategories();
  const projectsData = await getProjects();
  const projects = projectsData.map((p) => ({
    ...p,
    _id: p._id?.toString(),
  }));

  return (
    <>
      <PageSchema
        schemas={[
          BreadcrumbSchema([
            { name: 'Home', url: '/' },
            { name: 'Portfolio', url: '/portfolio' },
          ]),
        ]}
      />
      <section className={styles.portfolioHero}>
        <div className={styles.portfolioHeroImage}>
          <SeoImage
            src={STATIC_IMAGES.portfolioHero}
            alt={heroAlt('portfolio-index')}
            fill
            className={styles.heroImage}
            priority
          />
          <h1>{PORTFOLIO_INDEX_H1}</h1>
        </div>
      </section>

      <section className="portfolio-intro section-padding bg-warm-grey reveal-on-scroll">
        <div className="container">
          <p className={styles.portfolioIntro}>{PORTFOLIO_INDEX_INTRO}</p>
        </div>
      </section>

      <section className="portfolio-map-section section-padding bg-warm-grey reveal-on-scroll">
        <div className="container">
          <h2>Project Locations</h2>
          <PortfolioMap projects={projects.map((p) => ({ ...p, _id: p._id?.toString() }))} />
        </div>
      </section>

      <NewsletterCTA />

      <section className="portfolio-categories section-padding reveal-on-scroll">
        <div className="container">
          <h2 className={styles.sectionHeading}>Project Categories</h2>
          <div className={styles.portfolioGrid}>
            {categories.map((category) => {
              const displayName = category.name || '';
              const linkSlug = category.slug || '';
              const label = portfolioCategoryDisplayLabel(linkSlug, displayName);

              const firstImage = category.images?.[0];
              const imageUrl = typeof firstImage === 'string' ? firstImage : firstImage?.url;
              const imageAlt =
                typeof firstImage === 'string'
                  ? portfolioAltText({ slug: linkSlug, displayName: label })
                  : ensureImageAlt(
                      typeof firstImage === 'object' ? firstImage?.altText : undefined,
                      portfolioAltText({ slug: linkSlug, displayName: label })
                    );

              return (
                <Link
                  key={category._id?.toString() || category.slug || displayName}
                  href={`/portfolio/${linkSlug}`}
                  className={styles.portfolioCategoryCard}
                >
                  {imageUrl ? (
                    <div className={styles.categoryImageWrapper}>
                      <PortfolioCategoryImage src={imageUrl} alt={imageAlt} displayName={label} />
                    </div>
                  ) : (
                    <div className={styles.categoryPlaceholder}>
                      <h3>{label}</h3>
                    </div>
                  )}
                </Link>
              );
            })}
          </div>
          <div className={styles.servicesCta}>
            <Link href="/services" className="btn">
              Explore Our Services
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
