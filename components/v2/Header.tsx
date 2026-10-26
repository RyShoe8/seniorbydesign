"use client";

import { useState, useEffect } from "react";
import Link from "@/components/v2/PreviewLink";
import { usePathname } from "next/navigation";
import SeoImage from "@/components/v2/SeoImage";
import { logoAlt } from "@/lib/image-seo";
import styles from "./Header.module.css";

export default function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname()?.replace(/^\/v2(?=\/|$)/, "") || "/";

  useEffect(() => {
    setMounted(true);
  }, []);

  const navItems = [
    { href: "/", label: "Home" },
    { href: "/senior-living-design-firm", label: "The Firm" },
    { href: "/services", label: "Services" },
    { href: "/portfolio", label: "Portfolio" },
    { href: "/team", label: "The Team" },
    { href: "/blog", label: "Blog" },
    { href: "/contact", label: "Contact" },
  ];

  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isMobileMenuOpen]);

  useEffect(() => {
    const close = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsMobileMenuOpen(false);
    };
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, []);

  useEffect(() => { setIsMobileMenuOpen(false); }, [pathname]);

  const currentPathname = mounted ? pathname : null;

  return (
    <header className={styles.header}>
      <div className={styles.headerContainer}>
        <Link href="/" className={styles.headerLogo}>
          <SeoImage
            src="/images/sbd-logo-transparent.png"
            alt={logoAlt()}
            width={200}
            height={200}
            className={styles.logoImage}
            priority
          />
        </Link>

        <nav className={styles.desktopNav} aria-label="Main navigation">
          {navItems.map((item) => {
            const isActive =
              mounted &&
              (currentPathname === item.href ||
                (item.href !== "/" && currentPathname?.startsWith(item.href)));
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                className={`${styles.navLink} ${isActive ? styles.active : ""} ${item.href === "/contact" ? styles.contactLink : ""}`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <button
          className={styles.mobileMenuButton}
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
          aria-expanded={isMobileMenuOpen}
          aria-controls="mobile-navigation"
        >
          <span
            className={`${styles.hamburger} ${isMobileMenuOpen ? styles.hamburgerOpen : ""}`}
          >
            <span></span>
            <span></span>
            <span></span>
          </span>
        </button>
      </div>

      <nav
        id="mobile-navigation"
        aria-label="Mobile navigation"
        className={`${styles.mobileNav} ${isMobileMenuOpen ? styles.mobileNavOpen : ""}`}
      >
        <div className={styles.mobileNavHeader}>
          <Link
            href="/"
            className={styles.mobileNavLogo}
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <SeoImage
              src="/images/sbd-logo-transparent.png"
              alt={logoAlt()}
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
            <svg
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M18 6L6 18M6 6L18 18"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
        <div className={styles.mobileNavLinks}>
          {navItems.map((item) => {
            const isActive =
              mounted &&
              (currentPathname === item.href ||
                (item.href !== "/" && currentPathname?.startsWith(item.href)));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`${styles.mobileNavLink} ${isActive ? styles.active : ""}`}
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
