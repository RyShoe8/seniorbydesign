"use client";

import { useEffect, useRef, useState } from "react";
import SeoImage from "./SeoImage";
import styles from "./HeroCarousel.module.css";

export type HeroSlide = { src: string; alt: string; position?: string };

const INTERVAL_MS = 6000;

export default function HeroCarousel({
  slides,
  sizes,
}: {
  slides: HeroSlide[];
  sizes: string;
}) {
  const [active, setActive] = useState(0);
  const [leaving, setLeaving] = useState<number | null>(null);
  // Starts playing; visitors who prefer reduced motion start paused (see effect below).
  const [paused, setPaused] = useState(false);
  const [held, setHeld] = useState(false);
  const activeRef = useRef(0);

  const goTo = (next: number) => {
    const current = activeRef.current;
    if (next === current) return;
    activeRef.current = next;
    setLeaving(current);
    setActive(next);
  };

  useEffect(() => {
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches)
      setPaused(true);
  }, []);

  useEffect(() => {
    if (paused || held || slides.length < 2) return;
    const timer = window.setInterval(() => {
      if (!document.hidden) goTo((activeRef.current + 1) % slides.length);
    }, INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [paused, held, slides.length]);

  return (
    <div
      className={styles.carousel}
      role="group"
      aria-roledescription="carousel"
      aria-label="Senior By Design interiors"
      onMouseEnter={() => setHeld(true)}
      onMouseLeave={() => setHeld(false)}
      onFocus={() => setHeld(true)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setHeld(false);
      }}
    >
      {slides.map((slide, index) => (
        <div
          key={slide.src}
          className={`${styles.slide} ${index === active ? styles.active : index === leaving ? styles.leaving : ""}`}
          role="group"
          aria-roledescription="slide"
          aria-label={`${index + 1} of ${slides.length}`}
          aria-hidden={index !== active}
        >
          <SeoImage
            src={slide.src}
            alt={slide.alt}
            fill
            priority={index === 0}
            sizes={sizes}
            style={slide.position ? { objectPosition: slide.position } : undefined}
          />
        </div>
      ))}
      {slides.length > 1 && (
        <div className={styles.controls}>
          <button
            type="button"
            className={styles.playPause}
            onClick={() => setPaused(!paused)}
            aria-label={paused ? "Play slideshow" : "Pause slideshow"}
          >
            <span aria-hidden="true">{paused ? "▶" : "❚❚"}</span>
          </button>
          {slides.map((slide, index) => (
            <button
              type="button"
              key={slide.src}
              className={`${styles.dot} ${index === active ? styles.dotActive : ""}`}
              onClick={() => goTo(index)}
              aria-label={`Show image ${index + 1} of ${slides.length}`}
              aria-current={index === active ? "true" : undefined}
            />
          ))}
        </div>
      )}
    </div>
  );
}
