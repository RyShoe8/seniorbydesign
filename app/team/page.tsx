import { Metadata } from 'next';
import Link from 'next/link';
import { getTeamMembers } from '../actions';
import Image from 'next/image';
import styles from './page.module.css';

export const metadata: Metadata = {
  title: 'Team - Senior By Design',
  description: 'SBD founder Reid Bonner, and his team of talented designers have collectively been designing, creating and manufacturing interior products for over 25 years.',
};

export default async function Team() {
  const teamMembers = await getTeamMembers();

  return (
    <>
      <section className={styles.teamHero}>
        <div className={styles.teamHeroImage}>
          <Image
            src="/images/Team/Team Header.webp"
            alt="The Team"
            fill
            className={styles.heroImage}
            priority
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
            }}
          />
          <h1>The Team</h1>
        </div>
      </section>

      <section className="team-intro section-padding">
        <div className="container">
          <h2>We Love What We Do</h2>
          <div className={styles.introContent}>
            <p>
              SBD founder Reid Bonner, and his team of talented designers have collectively been designing, creating and manufacturing interior products for over 25 years. Every detail of our work is given serious consideration, from the overall look of a property, to personally comfort testing and often customizing each seating option we offer. We take great pride in creating beautiful, functional and well-designed senior living communities within our industry. Our unique approach results in luxurious, soul warming interiors that are often found in America&apos;s most beautiful homes.
            </p>
            <p>
              At the very core of what sets SBD apart from other design firms is Reid&apos;s intimate connection to his beloved father and grandmother. It is the first-hand experience, caring for his loved ones and his reflections on the latter years of their shared experiences living within senior living communities that drives and inspires his senior living design aesthetic.
            </p>
            <p>
              After 15 years in the art world, Reid has secured the finest client relationships, thereby allowing SBD the ability to provide original works at unparalleled value. SBD represents the epitome of Reid&apos;s and his team of highly skilled designers, design aesthetic, which is driven by his passion to create communities that reflect the warmth and inspiration of our amazing seniors.
            </p>
          </div>
        </div>
      </section>

      <section className="team-quote section-padding bg-warm-grey">
        <div className="container">
          <blockquote className={styles.quote}>
            &ldquo;We want our choices to create environments that hug and embrace those who live within them; spaces they are proud to call home.&rdquo;
          </blockquote>
          <p className={styles.quoteAuthor}>Reid Bonner, President</p>
        </div>
      </section>

      <section className="team-picture section-padding">
        <div className="container">
          <div className={styles.teamPhotoPlaceholder}>Team Picture</div>
        </div>
      </section>

      <section className="team-members section-padding">
        <div className="container">
          <h2>Meet the experts</h2>
          <div className={styles.teamGrid}>
            {teamMembers.map((member) => (
              <Link
                key={member._id?.toString()}
                href={`/team/${member.slug}`}
                className={styles.teamMemberCard}
              >
                {member.profileImage ? (
                  <div className={styles.memberImageWrapper}>
                    <Image
                      src={member.profileImage}
                      alt={member.name}
                      width={400}
                      height={500}
                      className={styles.memberImage}
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
    </>
  );
}

