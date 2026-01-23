'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import styles from './Header.module.css';

export default function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setMounted(true);
  }, []);

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

  // Prevent hydration mismatch by not using pathname until mounted
  const currentPathname = mounted ? pathname : null;

  return (
    <header className={styles.header}>
      <div className={styles.headerContainer}>
        <Link href="/" className={styles.headerLogo}>
          <Image
            src="/images/SBD Logo.webp"
            alt="Senior By Design"
            width={200}
            height={200}
            className={styles.logoImage}
            priority
          />
        </Link>

        {/* Desktop Navigation */}
        <nav className={styles.desktopNav}>
          {navItems.map((item) => {
            const isActive = mounted && (currentPathname === item.href || (item.href !== '/' && currentPathname?.startsWith(item.href)));
            return (
              <Link 
                key={item.href} 
                href={item.href} 
                className={`${styles.navLink} ${isActive ? styles.active : ''}`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Mobile Menu Button */}
        <button
          className={styles.mobileMenuButton}
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label="Toggle menu"
        >
          <span className={`${styles.hamburger} ${isMobileMenuOpen ? styles.hamburgerOpen : ''}`}>
            <span></span>
            <span></span>
            <span></span>
          </span>
        </button>
      </div>

      {/* Mobile Navigation */}
      <nav className={`${styles.mobileNav} ${isMobileMenuOpen ? styles.mobileNavOpen : ''}`}>
        <div className={styles.mobileNavHeader}>
          <Link href="/" className={styles.mobileNavLogo} onClick={() => setIsMobileMenuOpen(false)}>
            <Image
              src="/images/SBD Logo.webp"
              alt="Senior By Design"
              width={150}
              height={150}
              className={styles.mobileLogoImage}
              priority
            />
          </Link>
          <button
            className={styles.mobileCloseButton}
            onClick={() => setIsMobileMenuOpen(false)}
            aria-label="Close menu"
          >
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
        <div className={styles.mobileNavLinks}>
          {navItems.map((item) => {
            const isActive = mounted && (currentPathname === item.href || (item.href !== '/' && currentPathname?.startsWith(item.href)));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`${styles.mobileNavLink} ${isActive ? styles.active : ''}`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </header>
  );
}

