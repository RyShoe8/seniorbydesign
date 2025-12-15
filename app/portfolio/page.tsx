import { Metadata } from 'next';
import Link from 'next/link';
import { getPortfolioCategories, getProjects } from '../actions';
import PortfolioMap from '@/components/PortfolioMap';

export const metadata: Metadata = {
  title: 'Portfolio - Senior By Design',
  description: 'Explore our portfolio of senior living communities and design projects across the United States.',
};

export default async function Portfolio() {
  const categories = await getPortfolioCategories();
  const projects = await getProjects();

  const portfolioTypes = [
    { slug: 'active-adult-55', name: 'Active Adult 55+' },
    { slug: 'senior-living', name: 'Senior Living' },
    { slug: 'remodels', name: 'Remodels' },
    { slug: 'office-remodels', name: 'Office Remodels' },
    { slug: 'memory-support', name: 'Memory Support' },
    { slug: 'model-units', name: 'Model units' },
    { slug: 'multifamily', name: 'Multifamily' },
  ];

  return (
    <>
      <section className="portfolio-hero section-padding">
        <div className="container">
          <div className="hero-image-placeholder">
            <h1>Our Portfolio</h1>
          </div>
          <p className="hero-text">
            Explore our extensive portfolio of beautifully designed senior living communities and spaces across the United States.
          </p>
        </div>
      </section>

      <section className="portfolio-map-section section-padding bg-warm-grey">
        <div className="container">
          <h2>Project Locations</h2>
          <PortfolioMap projects={projects} />
        </div>
      </section>

      <section className="portfolio-categories section-padding">
        <div className="container">
          <div className="portfolio-grid">
            {portfolioTypes.map((type) => {
              const category = categories.find((c) => c.slug === type.slug);
              return (
                <Link
                  key={type.slug}
                  href={`/portfolio/${type.slug}`}
                  className="portfolio-category-card"
                >
                  {category?.images[0] ? (
                    <div className="category-image-wrapper">
                      <img
                        src={category.images[0]}
                        alt={type.name}
                        className="category-image"
                      />
                      <div className="category-overlay">
                        <h3>{type.name}</h3>
                      </div>
                    </div>
                  ) : (
                    <div className="category-placeholder">
                      <h3>{type.name}</h3>
                    </div>
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      <style jsx>{`
        .portfolio-hero {
          background: linear-gradient(135deg, var(--warm-grey-1) 0%, var(--warm-grey-3) 100%);
          text-align: center;
        }

        .hero-image-placeholder {
          height: 300px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--warm-grey-1);
          border-radius: 8px;
          margin-bottom: var(--spacing-md);
        }

        .hero-text {
          font-size: 20px;
          max-width: 700px;
          margin: 0 auto;
        }

        .portfolio-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
          gap: var(--spacing-md);
        }

        .portfolio-category-card {
          display: block;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          transition: transform 0.3s ease;
          height: 400px;
        }

        .portfolio-category-card:hover {
          transform: translateY(-5px);
        }

        .category-image-wrapper {
          position: relative;
          width: 100%;
          height: 100%;
        }

        .category-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .category-overlay {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          background: linear-gradient(to top, rgba(89, 56, 37, 0.9), transparent);
          padding: var(--spacing-md);
        }

        .category-overlay h3 {
          color: #fff;
          margin: 0;
        }

        .category-placeholder {
          width: 100%;
          height: 100%;
          background: var(--warm-grey-1);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .category-placeholder h3 {
          color: var(--sbd-brown);
        }

        @media (max-width: 768px) {
          .portfolio-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </>
  );
}

