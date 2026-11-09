'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from './PreviewLink';
import styles from './ServicesShowcase.module.css';

export type ShowcaseService = {
  slug: string;
  title: string;
  description: string;
  image: string;
  position?: string;
};

/** A numbered list of services beside one photograph that changes with the row in focus. */
export default function ServicesShowcase({
  services,
  eyebrow,
  heading,
}: {
  services: ShowcaseService[];
  eyebrow: string;
  heading: string;
}) {
  const [active, setActive] = useState(0);

  return (
    <div className={styles.showcase}>
      <div className={styles.frame} aria-hidden="true">
        {services.map((service, index) => (
          <div
            key={service.slug}
            className={`${styles.photo} ${index === active ? styles.photoActive : ''}`}
          >
            <Image
              src={service.image}
              alt=""
              fill
              sizes="(max-width: 900px) 100vw, 540px"
              style={service.position ? { objectPosition: service.position } : undefined}
            />
          </div>
        ))}
      </div>

      <div className={styles.content}>
        <span className={styles.eyebrow}>{eyebrow}</span>
        <h2 className={styles.heading}>{heading}</h2>
        <ol className={styles.list}>
          {services.map((service, index) => (
            <li key={service.slug}>
              <Link
                href={`/services/${service.slug}`}
                className={`${styles.row} ${index === active ? styles.rowActive : ''}`}
                onMouseEnter={() => setActive(index)}
                onFocus={() => setActive(index)}
              >
                <span className={styles.number} aria-hidden="true">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <span className={styles.text}>
                  <h3 className={styles.title}>{service.title}</h3>
                  <span className={styles.description}>{service.description}</span>
                </span>
                <span className={styles.arrow} aria-hidden="true">→</span>
              </Link>
            </li>
          ))}
        </ol>
        <Link href="/services" className={`sbd-text-link ${styles.all}`}>
          View all services <span aria-hidden="true">→</span>
        </Link>
      </div>
    </div>
  );
}
