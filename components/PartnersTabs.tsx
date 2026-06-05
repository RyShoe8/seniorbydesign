'use client';

import { useMemo, useState } from 'react';
import SeoImage from '@/components/SeoImage';
import { partnerLogoAlt, ensureImageAlt } from '@/lib/image-seo';
import styles from '@/app/page.module.css';

type Partner = {
  _id?: string;
  name: string;
  logo: string;
  displayName?: string;
  altText?: string;
  url?: string;
  category?: 'Owner and Operators' | 'Architects' | 'Construction Partners';
};

const categories = [
  { key: 'all', label: 'All' },
  { key: 'Owner and Operators', label: 'Owner and Operators' },
  { key: 'Architects', label: 'Architects' },
  { key: 'Construction Partners', label: 'Construction Partners' },
] as const;

type CategoryKey = typeof categories[number]['key'];

export default function PartnersTabs({ partners }: { partners: Partner[] }) {
  const [activeTab, setActiveTab] = useState<CategoryKey>('all');

  const filteredPartners = useMemo(() => {
    if (activeTab === 'all') {
      return partners;
    }
    return partners.filter((partner) => partner.category === activeTab);
  }, [activeTab, partners]);

  return (
    <div className={styles.partnersSection}>
      <div className={styles.partnersTabs} role="tablist" aria-label="Partner categories">
        {categories.map((category) => (
          <button
            key={category.key}
            type="button"
            role="tab"
            aria-selected={activeTab === category.key}
            className={`${styles.partnersTab} ${
              activeTab === category.key ? styles.partnersTabActive : ''
            }`}
            onClick={() => setActiveTab(category.key)}
          >
            {category.label}
          </button>
        ))}
      </div>

      {filteredPartners.length > 0 ? (
        <div className={styles.partnersGrid}>
          {filteredPartners.map((partner) => {
            if (!partner || !partner.logo) return null;
            const logoUrl = partner.logo;
            const partnerName = partner.displayName || partner.name || 'Partner';
            const altText = ensureImageAlt(partner.altText, partnerLogoAlt(partnerName));

            return (
              <div key={partner._id || partner.logo} className={styles.partnerLogo}>
                {partner.url ? (
                  <a href={partner.url} target="_blank" rel="noopener noreferrer">
                    <SeoImage
                      src={logoUrl}
                      alt={altText}
                      width={320}
                      height={180}
                      style={{
                        maxWidth: '100%',
                        maxHeight: '180px',
                        width: 'auto',
                        height: 'auto',
                        objectFit: 'contain',
                      }}
                      unoptimized={logoUrl.startsWith('http')}
                    />
                  </a>
                ) : (
                  <SeoImage
                    src={logoUrl}
                    alt={altText}
                    width={320}
                    height={180}
                    style={{
                      maxWidth: '100%',
                      maxHeight: '180px',
                      width: 'auto',
                      height: 'auto',
                      objectFit: 'contain',
                    }}
                    unoptimized={logoUrl.startsWith('http')}
                  />
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <p className={styles.partnersEmptyState}>
          No partners to show in this category yet.
        </p>
      )}
    </div>
  );
}
