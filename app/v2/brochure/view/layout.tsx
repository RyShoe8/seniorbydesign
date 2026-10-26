import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Brochure Viewer - Senior By Design',
  description: 'View our interactive brochure',
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false,
    },
  },
};

export default function BrochureViewerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
