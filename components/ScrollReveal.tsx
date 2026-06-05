'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

export default function ScrollReveal() {
  const pathname = usePathname();

  useEffect(() => {
    // Respect the user's reduced-motion preference: leave content fully visible, no observer.
    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion) {
      document
        .querySelectorAll<HTMLElement>('.reveal-on-scroll')
        .forEach((el) => {
          el.style.opacity = '1';
        });
      return;
    }

    // We run this effect whenever the pathname changes, so new pages get observed
    const observerOptions = {
      root: null,
      rootMargin: '0px 0px -50px 0px', // trigger slightly before it fully enters
      threshold: 0.1,
    };

    const observer = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          // Add the animation class
          entry.target.classList.add('animate-fade-in-up');
          // Once animated, we don't need to observe it anymore
          observer.unobserve(entry.target);
        }
      });
    }, observerOptions);

    // Initial setup: hide elements by making them opacity 0 before they animate
    // But we only want to do this for elements that haven't been animated yet
    const elements = document.querySelectorAll('.reveal-on-scroll:not(.animate-fade-in-up)');
    elements.forEach((el) => {
      (el as HTMLElement).style.opacity = '0'; // Ensure it's hidden before animation starts
      observer.observe(el);
    });

    return () => {
      observer.disconnect();
    };
  }, [pathname]);

  return null; // This component doesn't render anything visible
}
