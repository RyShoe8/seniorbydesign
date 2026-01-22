import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const isLoginPage = req.nextUrl.pathname === '/admin/login';
    const isAdminPageRoute = req.nextUrl.pathname.startsWith('/admin');
    const isAdminApiRoute = req.nextUrl.pathname.startsWith('/api/admin');

    // Allow access to login page
    if (isLoginPage) {
      return NextResponse.next();
    }

    // Protect admin page routes
    if (isAdminPageRoute && !token) {
      return NextResponse.redirect(new URL('/admin/login', req.url));
    }

    if (isAdminPageRoute && token?.role !== 'admin') {
      const userManagementRoute = req.nextUrl.pathname.includes('/admin/users');
      if (userManagementRoute) {
        return NextResponse.redirect(new URL('/admin', req.url));
      }
    }

    // Protect admin API routes - return 401 instead of redirect for API calls
    if (isAdminApiRoute && !token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Additional role check for admin API routes (some routes require admin role)
    if (isAdminApiRoute && token?.role !== 'admin') {
      const requiresAdminRole = req.nextUrl.pathname.includes('/api/admin/users');
      if (requiresAdminRole) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const isLoginPage = req.nextUrl.pathname === '/admin/login';
        const isAdminPageRoute = req.nextUrl.pathname.startsWith('/admin');
        const isAdminApiRoute = req.nextUrl.pathname.startsWith('/api/admin');
        
        // Allow login page without authentication
        if (isLoginPage) {
          return true;
        }
        
        // Require authentication for admin page routes
        if (isAdminPageRoute) {
          return !!token;
        }

        // Require authentication for admin API routes
        if (isAdminApiRoute) {
          return !!token;
        }
        
        return true;
      },
    },
  }
);

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*'],
};

