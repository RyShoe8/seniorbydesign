import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const isLoginPage = req.nextUrl.pathname === '/admin/login';
    const isAdminRoute = req.nextUrl.pathname.startsWith('/admin');

    // Allow access to login page
    if (isLoginPage) {
      return NextResponse.next();
    }

    // Protect other admin routes
    if (isAdminRoute && !token) {
      return NextResponse.redirect(new URL('/admin/login', req.url));
    }

    if (isAdminRoute && token?.role !== 'admin') {
      const userManagementRoute = req.nextUrl.pathname.includes('/admin/users');
      if (userManagementRoute) {
        return NextResponse.redirect(new URL('/admin', req.url));
      }
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const isLoginPage = req.nextUrl.pathname === '/admin/login';
        const isAdminRoute = req.nextUrl.pathname.startsWith('/admin');
        
        // Allow login page without authentication
        if (isLoginPage) {
          return true;
        }
        
        // Require authentication for other admin routes
        if (isAdminRoute) {
          return !!token;
        }
        return true;
      },
    },
  }
);

export const config = {
  matcher: ['/admin/:path*'],
};

