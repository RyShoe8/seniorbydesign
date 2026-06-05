import { Metadata } from 'next';
import Link from 'next/link';
import { getTeamMembers } from '../actions';
import NewsletterCTA from '@/components/NewsletterCTA';
import PageSchema from '@/components/PageSchema';
import SeoImage from '@/components/SeoImage';
import { generateSEOMetadata, BreadcrumbSchema } from '@/components/SEO';
import { TEAM_INDEX_TITLE, TEAM_INDEX_H1, TEAM_INDEX_META, TEAM_INDEX_INTRO } from '@/lib/team-seo';
import { heroAlt, STATIC_IMAGES, teamMemberAlt } from '@/lib/image-seo';
import styles from './page.module.css';

export const metadata: Metadata = generateSEOMetadata({
  title: TEAM_INDEX_TITLE,
  description: TEAM_INDEX_META,
  url: '/team',
  type: 'website',
  keywords: [
    'senior living interior designers',
    'senior living design experts',
    'interior designers specializing in senior living',
  ],
});

export const revalidate = 0;

export default async function Team() {
  const teamMembers = await getTeamMembers();

  return (
    <>
      <PageSchema
        schemas={[
          BreadcrumbSchema([
            { name: 'Home', url: '/' },
            { name: 'The Team', url: '/team' },
          ]),
        ]}
      />
      <section className={styles.teamHero}>
        <div className={styles.teamHeroImage}>
          <SeoImage
            src={STATIC_IMAGES.teamHero}
            alt={heroAlt('team-index')}
            fill
            className={styles.heroImage}
            priority
          />
          <h1>{TEAM_INDEX_H1}</h1>
        </div>
      </section>

      <section className="team-intro section-padding">
        <div className="container">
          <h2 className={styles.centeredHeading}>We Love What We Do</h2>
          <div className={styles.introContent}>
            <p>{TEAM_INDEX_INTRO}</p>
            <p>
              Every detail of our work is given serious consideration, from the overall look of a
              property to personally comfort-testing and often customizing each seating option we
              offer. We take great pride in creating beautiful, functional and well-designed senior
              living communities within our industry.
            </p>
            <p>
              At the very core of what sets SBD apart from other design firms is Reid&apos;s intimate
              connection to his beloved father and grandmother. It is the first-hand experience,
              caring for his loved ones and his reflections on the latter years of their shared
              experiences living within senior living communities that drives and inspires his senior
              living design aesthetic.
            </p>
          </div>
        </div>
      </section>

      <section className="team-quote section-padding bg-warm-grey">
        <div className="container">
          <blockquote className={styles.quote}>
            &ldquo;We want our choices to create environments that hug and embrace those who live
            within them; spaces they are proud to call home.&rdquo;
          </blockquote>
          <p className={styles.quoteAuthor}>Reid Bonner, President</p>
        </div>
      </section>

      <section className="team-members section-padding">
        <div className="container">
          <h2 className={styles.centeredHeading}>Meet the experts</h2>
          <div className={styles.teamGrid}>
            {teamMembers.map((member, index) => (
              <Link
                key={member._id?.toString() || member.slug}
                href={`/team/${member.slug}`}
                className={styles.teamMemberCard}
              >
                {member.profileImage ? (
                  <div className={styles.memberImageWrapper}>
                    <SeoImage
                      src={member.profileImage}
                      alt={teamMemberAlt(member.name, member.title)}
                      fill
                      className={styles.memberImage}
                      sizes="(max-width: 768px) 250px, 300px"
                      loading={index < 6 ? 'eager' : 'lazy'}
                      unoptimized={true}
                    />
                    <div className={styles.memberInfoOverlay}>
                      <h3>{member.name}</h3>
                      <p>{member.title}</p>
                    </div>
                  </div>
                ) : (
                  <div className={styles.memberPlaceholder}>
                    <div className={styles.memberInfoOverlay}>
                      <h3>{member.name}</h3>
                      <p>{member.title}</p>
                    </div>
                  </div>
                )}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <NewsletterCTA />
    </>
  );
}
