'use client';

import { usePathname } from 'next/navigation';
import Header from './Header';
import Footer from './Footer';
import ScrollReveal from './ScrollReveal';

export default function ConditionalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isAdminRoute = pathname?.startsWith('/admin');
  const isImmersiveRoute = pathname === '/experience' || pathname?.startsWith('/brochure/view');

  if (isAdminRoute || isImmersiveRoute) {
    return <>{children}</>;
  }

  return (
    <>
      <ScrollReveal />
      <Header />
      <main>{children}</main>
      <Footer />
    </>
  );
}





