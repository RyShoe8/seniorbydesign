'use client';

import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
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

  useEffect(() => {
    if (status === 'unauthenticated' && pathname !== '/admin/login') {
      router.push('/admin/login');
    }
  }, [status, router, pathname]);

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

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div className="admin-header">
          <h2>Admin Panel</h2>
          <button onClick={handleLogout} className="logout-btn">
            Logout
          </button>
        </div>
        <nav className="admin-nav">
          <Link href="/admin" className={`nav-item ${pathname === '/admin' ? 'active' : ''}`}>
            Dashboard
          </Link>
          {session.user?.role === 'admin' && (
            <Link href="/admin/users" className={`nav-item ${pathname === '/admin/users' ? 'active' : ''}`}>
              User Management
            </Link>
          )}
          <Link href="/admin/portfolio" className={`nav-item ${pathname?.startsWith('/admin/portfolio') ? 'active' : ''}`}>
            Portfolio Management
          </Link>
          <Link href="/admin/services" className={`nav-item ${pathname?.startsWith('/admin/services') ? 'active' : ''}`}>
            Services Management
          </Link>
          <Link href="/admin/team" className={`nav-item ${pathname?.startsWith('/admin/team') ? 'active' : ''}`}>
            Team Management
          </Link>
          <Link href="/admin/projects" className={`nav-item ${pathname === '/admin/projects' ? 'active' : ''}`}>
            Project Map
          </Link>
          <Link href="/admin/homepage" className={`nav-item ${pathname === '/admin/homepage' ? 'active' : ''}`}>
            Homepage Content
          </Link>
          <Link href="/admin/partners" className={`nav-item ${pathname === '/admin/partners' ? 'active' : ''}`}>
            Partners
          </Link>
          <Link href="/admin/resources" className={`nav-item ${pathname === '/admin/resources' ? 'active' : ''}`}>
            Resources & Links
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
        }

        .admin-sidebar {
          width: 250px;
          background: var(--sbd-brown);
          color: #fff;
          padding: var(--spacing-md);
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
          .admin-sidebar {
            width: 200px;
          }
        }
      `}</style>
    </div>
  );
}
