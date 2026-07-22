import { Metadata } from 'next';
import { generateSEOMetadata, BreadcrumbSchema } from '@/components/SEO';
import PageSchema from '@/components/PageSchema';
import { formatAddressSingleLine, formatPhoneDisplay } from '@/lib/geo-entity';

export const metadata: Metadata = generateSEOMetadata({
  title: 'Contact Us - Senior By Design',
  description: `Contact Senior By Design at ${formatAddressSingleLine()} or ${formatPhoneDisplay()}. Senior living interior design, FF&E, and turnkey services nationwide. Design studios in Dallas and Boulder.`,
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
