import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'The Senior By Design Experience | Senior Living Interior Design',
  description:
    'Explore our interactive design guide. Discover how Senior By Design transforms senior living communities with award-winning interior design, FF&E procurement, and turnkey installation.',
  openGraph: {
    title: 'The Senior By Design Experience',
    description:
      'A boutique senior living interior design firm transforming communities nationwide. Explore our design guide.',
    type: 'website',
  },
};

export default function ExperienceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
