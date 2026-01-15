import { Metadata } from 'next';
import { generateSEOMetadata, JSONLDSchema, BreadcrumbSchema } from '@/components/SEO';

export const metadata: Metadata = generateSEOMetadata({
  title: 'Newsletter & Brochure - Senior By Design',
  description: 'Join our family and receive our monthly newsletter. Download our digital brochure or have a physical copy sent to you.',
  url: '/newsletter-and-brochure',
  type: 'website',
});

export default function NewsletterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <JSONLDSchema schema={BreadcrumbSchema([
        { name: 'Home', url: '/' },
        { name: 'Newsletter & Brochure', url: '/newsletter-and-brochure' },
      ])} />
      {children}
    </>
  );
}
