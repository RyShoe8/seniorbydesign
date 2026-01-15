import { Metadata } from 'next';
import { generateSEOMetadata, JSONLDSchema, BreadcrumbSchema } from '@/components/SEO';

export const metadata: Metadata = generateSEOMetadata({
  title: 'Contact Us - Senior By Design',
  description: 'Get in touch with Senior By Design. Call us at (833) 773-3744 or send us a message.',
  url: '/contact',
  type: 'website',
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
      {children}
    </>
  );
}
