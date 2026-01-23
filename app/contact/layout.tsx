import { Metadata } from 'next';
import { generateSEOMetadata, JSONLDSchema, BreadcrumbSchema, LocalBusinessSchema } from '@/components/SEO';

export const metadata: Metadata = generateSEOMetadata({
  title: 'Contact Us - Senior By Design',
  description: 'Get in touch with Senior By Design. Call us at (833) 773-3744 or send us a message.',
  url: '/contact',
  type: 'website',
  keywords: [
    'contact Senior By Design',
    'interior design consultation',
    'senior living design services',
    'commercial design contact',
  ],
});

export default function ContactLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <JSONLDSchema schema={BreadcrumbSchema([
        { name: 'Home', url: '/' },
        { name: 'Contact', url: '/contact' },
      ])} />
      <JSONLDSchema schema={LocalBusinessSchema()} />
      {children}
    </>
  );
}
