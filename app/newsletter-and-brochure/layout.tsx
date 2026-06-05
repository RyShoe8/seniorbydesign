import { Metadata } from 'next';
import PageSchema from '@/components/PageSchema';
import { generateSEOMetadata, BreadcrumbSchema } from '@/components/SEO';

export const metadata: Metadata = generateSEOMetadata({
  title: 'Newsletter & Brochure - Senior By Design',
  description: 'Join our family and receive our monthly newsletter. Download our digital brochure or have a physical copy sent to you.',
  url: '/newsletter-and-brochure',
  type: 'website',
  keywords: [
    'interior design newsletter',
    'design brochure',
    'senior living design resources',
  ],
});

export default function NewsletterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <PageSchema schemas={[BreadcrumbSchema([
        { name: 'Home', url: '/' },
        { name: 'Newsletter & Brochure', url: '/newsletter-and-brochure' },
      ])]} />
      {children}
    </>
  );
}
