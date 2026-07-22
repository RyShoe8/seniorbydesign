'use client';

import { useEffect, useRef, useState, type ReactNode, type CSSProperties } from 'react';

type RevealDirection = 'up' | 'down' | 'left' | 'right' | 'fade' | 'scale';

interface SectionRevealProps {
  children: ReactNode;
  direction?: RevealDirection;
  delay?: number;        // ms
  duration?: number;     // ms
  threshold?: number;    // 0–1
  className?: string;
  style?: CSSProperties;
  as?: keyof JSX.IntrinsicElements;
  stagger?: number;      // ms between children
}

const TRANSFORMS: Record<RevealDirection, string> = {
  up: 'translateY(40px)',
  down: 'translateY(-40px)',
  left: 'translateX(40px)',
  right: 'translateX(-40px)',
  fade: 'none',
  scale: 'scale(0.95)',
};

export default function SectionReveal({
  children,
  direction = 'up',
  delay = 0,
  duration = 700,
  threshold = 0.15,
  className,
  style,
  as: Tag = 'div',
  stagger,
}: SectionRevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Respect reduced motion
    const prefersReducedMotion =
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      setVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.unobserve(el);
        }
      },
      { threshold, rootMargin: '0px 0px -40px 0px' }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);

  const baseStyle: CSSProperties = {
    opacity: visible ? 1 : 0,
    transform: visible ? 'none' : TRANSFORMS[direction],
    transition: `opacity ${duration}ms cubic-bezier(0.4, 0, 0.2, 1) ${delay}ms, transform ${duration}ms cubic-bezier(0.4, 0, 0.2, 1) ${delay}ms`,
    willChange: 'opacity, transform',
    ...style,
  };

  // If stagger is set, apply stagger CSS custom property for children
  if (stagger) {
    (baseStyle as Record<string, string>)['--stagger-delay'] = `${stagger}ms`;
  }

  const Component = Tag as any;

  return (
    <Component ref={ref} className={className} style={baseStyle}>
      {children}
    </Component>
  );
}
