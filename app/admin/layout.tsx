'use client';

import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated' && pathname !== '/admin/login') {
      router.push('/admin/login');
    }
  }, [status, router, pathname]);

  // Close mobile menu when pathname changes
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  if (status === 'loading') {
    return (
      <div className="admin-loading">
        <p>Loading...</p>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  const handleLogout = () => {
    signOut({ callbackUrl: '/admin/login' });
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  return (
    <div className="admin-layout">
      <button 
        className="mobile-menu-toggle"
        onClick={toggleMobileMenu}
        aria-label="Toggle menu"
      >
        <span className="hamburger-line"></span>
        <span className="hamburger-line"></span>
        <span className="hamburger-line"></span>
      </button>
      
      {mobileMenuOpen && (
        <div 
          className="admin-sidebar-overlay"
          onClick={closeMobileMenu}
        />
      )}
      
      <aside className={`admin-sidebar ${mobileMenuOpen ? 'mobile-open' : ''}`}>
        <div className="admin-header">
          <h2>Admin Panel</h2>
          <button onClick={handleLogout} className="logout-btn">
            Logout
          </button>
        </div>
        <nav className="admin-nav">
          <Link href="/admin" className={`nav-item ${pathname === '/admin' ? 'active' : ''}`} onClick={closeMobileMenu}>
            Dashboard
          </Link>
          {session.user?.role === 'admin' && (
            <Link href="/admin/users" className={`nav-item ${pathname === '/admin/users' ? 'active' : ''}`} onClick={closeMobileMenu}>
              User
            </Link>
          )}
          <Link href="/admin/portfolio" className={`nav-item ${pathname?.startsWith('/admin/portfolio') ? 'active' : ''}`} onClick={closeMobileMenu}>
            Portfolio
          </Link>
          <Link href="/admin/services" className={`nav-item ${pathname?.startsWith('/admin/services') ? 'active' : ''}`} onClick={closeMobileMenu}>
            Services
          </Link>
          <Link href="/admin/team" className={`nav-item ${pathname?.startsWith('/admin/team') ? 'active' : ''}`} onClick={closeMobileMenu}>
            Team
          </Link>
          <Link href="/admin/projects" className={`nav-item ${pathname === '/admin/projects' ? 'active' : ''}`} onClick={closeMobileMenu}>
            Project Map
          </Link>
          <Link href="/admin/homepage" className={`nav-item ${pathname === '/admin/homepage' ? 'active' : ''}`} onClick={closeMobileMenu}>
            Homepage Content
          </Link>
          <Link href="/admin/resources" className={`nav-item ${pathname === '/admin/resources' ? 'active' : ''}`} onClick={closeMobileMenu}>
            Resources & Links
          </Link>
          <Link href="/admin/blog" className={`nav-item ${pathname?.startsWith('/admin/blog') ? 'active' : ''}`} onClick={closeMobileMenu}>
            Blog
          </Link>
          <Link href="/admin/brochure" className={`nav-item ${pathname === '/admin/brochure' ? 'active' : ''}`} onClick={closeMobileMenu}>
            Brochure Requests
          </Link>
          <Link href="/admin/design-guide" className={`nav-item ${pathname === '/admin/design-guide' ? 'active' : ''}`} onClick={closeMobileMenu}>
            Design Brochure
          </Link>
          <Link href="/admin/media" className={`nav-item ${pathname === '/admin/media' ? 'active' : ''}`} onClick={closeMobileMenu}>
            Media Library
          </Link>
          <Link href="/admin/signature" className={`nav-item ${pathname?.startsWith('/admin/signature') ? 'active' : ''}`} onClick={closeMobileMenu}>
            Signature
          </Link>
        </nav>
      </aside>
      <main className="admin-main">
        {children}
      </main>

      <style jsx>{`
        .admin-layout {
          display: flex;
          min-height: 100vh;
          position: relative;
        }

        .mobile-menu-toggle {
          display: none;
          position: fixed;
          top: 1rem;
          left: 1rem;
          z-index: 1001;
          background: var(--sbd-brown);
          border: none;
          padding: 0.75rem;
          border-radius: 4px;
          cursor: pointer;
          flex-direction: column;
          gap: 4px;
          min-width: 44px;
          min-height: 44px;
          justify-content: center;
          align-items: center;
        }

        .hamburger-line {
          width: 24px;
          height: 2px;
          background: #fff;
          transition: all 0.3s ease;
        }

        .admin-sidebar-overlay {
          display: none;
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          z-index: 999;
        }

        .admin-sidebar {
          width: 250px;
          background: var(--sbd-brown);
          color: #fff;
          padding: var(--spacing-md);
          transition: transform 0.3s ease;
        }

        .admin-header {
          margin-bottom: var(--spacing-lg);
          padding-bottom: var(--spacing-md);
          border-bottom: 1px solid rgba(255, 255, 255, 0.2);
        }

        .admin-header h2 {
          color: #fff;
          margin-bottom: var(--spacing-sm);
        }

        .logout-btn {
          background: var(--sbd-gold);
          color: #fff;
          border: none;
          padding: 0.5rem 1rem;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
          min-height: 44px;
        }

        .admin-nav {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .nav-item {
          padding: 0.75rem 1rem;
          color: var(--warm-grey-1);
          text-decoration: none;
          border-radius: 4px;
          transition: background 0.3s ease;
          min-height: 44px;
          display: flex;
          align-items: center;
        }

        .nav-item:hover,
        .nav-item.active {
          background: rgba(255, 255, 255, 0.1);
        }

        .admin-main {
          flex: 1;
          padding: var(--spacing-xl);
          background: #f5f5f5;
        }

        .admin-loading {
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
        }

        @media (max-width: 768px) {
          .mobile-menu-toggle {
            display: flex;
          }

          .admin-sidebar-overlay {
            display: block;
          }

          .admin-sidebar {
            position: fixed;
            top: 0;
            left: 0;
            bottom: 0;
            width: 280px;
            max-width: 85vw;
            z-index: 1000;
            transform: translateX(-100%);
            box-shadow: 2px 0 8px rgba(0, 0, 0, 0.2);
          }

          .admin-sidebar.mobile-open {
            transform: translateX(0);
          }

          .admin-main {
            padding: var(--spacing-sm) var(--spacing-xs);
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
}
