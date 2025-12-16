'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';

export default function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  const navItems = [
    { href: '/', label: 'Home' },
    { href: '/the-firm', label: 'The Firm' },
    { href: '/services', label: 'Services' },
    { href: '/portfolio', label: 'Portfolio' },
    { href: '/team', label: 'The Team' },
    { href: '/blog', label: 'Blog' },
    { href: '/contact', label: 'Contact' },
  ];

  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isMobileMenuOpen]);

  return (
    <header className="header">
      <div className="header-container">
        <Link href="/" className="header-logo">
          <Image
            src="/images/SBD Logo.webp"
            alt="Senior By Design"
            width={150}
            height={150}
            className="logo-image"
            priority
          />
        </Link>

        {/* Desktop Navigation */}
        <nav className="header-nav desktop-nav">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/' && pathname?.startsWith(item.href));
            return (
              <Link 
                key={item.href} 
                href={item.href} 
                className={`nav-link ${isActive ? 'active' : ''}`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Mobile Menu Button */}
        <button
          className="mobile-menu-button"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label="Toggle menu"
        >
          <span className={`hamburger ${isMobileMenuOpen ? 'open' : ''}`}>
            <span></span>
            <span></span>
            <span></span>
          </span>
        </button>
      </div>

      {/* Mobile Navigation */}
      <nav className={`mobile-nav ${isMobileMenuOpen ? 'open' : ''}`}>
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/' && pathname?.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`mobile-nav-link ${isActive ? 'active' : ''}`}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      <style jsx>{`
        .header {
          position: sticky;
          top: 0;
          z-index: 1000;
          background: #fff;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        .header-container {
          max-width: var(--container-max-width);
          margin: 0 auto;
          padding: 0 var(--container-padding);
          display: flex;
          align-items: center;
          justify-content: space-between;
          height: 100px;
        }

        .header-logo {
          display: flex;
          align-items: center;
          text-decoration: none;
        }

        .logo-image {
          height: 150px;
          width: auto;
        }

        .desktop-nav {
          display: flex;
          gap: 2rem;
        }

        .nav-link {
          font-family: var(--font-body);
          font-size: 19px;
          color: var(--sbd-brown);
          text-decoration: none;
          padding: 0.75rem 1.25rem;
          border-radius: 6px;
          position: relative;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          display: inline-block;
        }

        .nav-link::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(203, 172, 109, 0.1);
          border-radius: 6px;
          opacity: 0;
          transition: opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          z-index: -1;
        }

        .nav-link:hover {
          color: var(--sbd-gold);
          transform: translateY(-3px);
          box-shadow: 0 6px 16px rgba(89, 56, 37, 0.2);
        }

        .nav-link:hover::before {
          opacity: 1;
          background: rgba(203, 172, 109, 0.15);
        }

        .nav-link:active {
          transform: translateY(-1px);
          box-shadow: 0 2px 8px rgba(89, 56, 37, 0.15);
        }

        .nav-link.active {
          color: var(--sbd-gold);
          background-color: rgba(203, 172, 109, 0.15);
          box-shadow: 0 4px 12px rgba(89, 56, 37, 0.15);
          font-weight: 500;
        }

        .nav-link.active:hover {
          background-color: rgba(203, 172, 109, 0.2);
          box-shadow: 0 6px 16px rgba(89, 56, 37, 0.25);
        }

        .mobile-menu-button {
          display: none;
          background: none;
          border: none;
          cursor: pointer;
          padding: 0.5rem;
        }

        .hamburger {
          display: flex;
          flex-direction: column;
          gap: 5px;
          width: 24px;
        }

        .hamburger span {
          display: block;
          height: 2px;
          width: 100%;
          background: var(--sbd-brown);
          transition: all 0.3s ease;
        }

        .hamburger.open span:nth-child(1) {
          transform: rotate(45deg) translate(7px, 7px);
        }

        .hamburger.open span:nth-child(2) {
          opacity: 0;
        }

        .hamburger.open span:nth-child(3) {
          transform: rotate(-45deg) translate(7px, -7px);
        }

        .mobile-nav {
          display: none;
          flex-direction: column;
          background: #fff;
          border-top: 1px solid var(--warm-grey-3);
          padding: 1rem var(--container-padding);
        }

        .mobile-nav.open {
          display: flex;
        }

        .mobile-nav-link {
          padding: 1rem;
          font-family: var(--font-body);
          font-size: 19px;
          color: var(--sbd-brown);
          border-bottom: 1px solid var(--warm-grey-1);
          transition: all 0.3s ease;
          border-radius: 4px;
          margin: 0.25rem 0;
        }

        .mobile-nav-link:hover {
          color: var(--sbd-gold);
          background-color: rgba(203, 172, 109, 0.1);
          box-shadow: 0 2px 8px rgba(89, 56, 37, 0.1);
          transform: translateX(4px);
        }

        .mobile-nav-link.active {
          color: var(--sbd-gold);
          background-color: rgba(203, 172, 109, 0.15);
          font-weight: 600;
        }

        @media (max-width: 768px) {
          .header-container {
            height: 70px;
          }

          .logo-image {
            height: 90px;
          }

          .desktop-nav {
            display: none;
          }

          .mobile-menu-button {
            display: block;
          }

          .mobile-nav {
            position: absolute;
            top: 100%;
            left: 0;
            right: 0;
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
          }
        }
      `}</style>
    </header>
  );
}

