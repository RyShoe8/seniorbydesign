'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';

export default function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems = [
    { href: '/', label: 'Home' },
    { href: '/the-firm', label: 'The Firm' },
    { href: '/services', label: 'Services' },
    { href: '/portfolio', label: 'Portfolio' },
    { href: '/team', label: 'Team' },
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
            src="/images/SBD_Logo.webp"
            alt="Senior By Design"
            width={150}
            height={150}
            className="logo-image"
            priority
          />
        </Link>

        {/* Desktop Navigation */}
        <nav className="header-nav desktop-nav">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} className="nav-link">
              {item.label}
            </Link>
          ))}
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
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="mobile-nav-link"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            {item.label}
          </Link>
        ))}
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
          transition: color 0.3s ease;
        }

        .nav-link:hover {
          color: var(--sbd-gold);
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
          padding: 1rem 0;
          font-family: var(--font-body);
          font-size: 19px;
          color: var(--sbd-brown);
          border-bottom: 1px solid var(--warm-grey-1);
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

