import { Metadata } from 'next';
import { generateSEOMetadata, BreadcrumbSchema } from '@/components/SEO';
import PageSchema from '@/components/PageSchema';

export const metadata: Metadata = generateSEOMetadata({
  title: 'Contact Us - Senior By Design',
  description:
    'Contact Senior By Design at 5015 Catron Dr, Dallas, TX 75220 or (833) 773-3744. Senior living interior design, FF&E, and turnkey services nationwide.',
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
      <PageSchema
        schemas={[
          BreadcrumbSchema([
            { name: 'Home', url: '/' },
            { name: 'Contact', url: '/contact' },
          ]),
        ]}
      />
      {children}
    </>
  );
}
