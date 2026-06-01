import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTeamMember } from '../../actions';
import Image from 'next/image';
import Link from 'next/link';
import { generateSEOMetadata, JSONLDSchema, PersonSchema, BreadcrumbSchema } from '@/components/SEO';
import { metaDescriptionForTeamMember } from '@/lib/team-seo';
import styles from './page.module.css';

type Props = {
  params: { slug: string };
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const member = await getTeamMember(params.slug);
  
  if (!member) {
    return {
      title: 'Team Member Not Found',
    };
  }

  return generateSEOMetadata({
    title: `${member.name} - ${member.title} - Senior By Design`,
    description: metaDescriptionForTeamMember(member),
    url: `/team/${member.slug}`,
    image: member.profileImage,
    type: 'profile',
    keywords: [
      'interior designer',
      member.name,
      member.title,
      'senior living design',
    ],
  });
}

export const revalidate = 0; // Always fetch fresh data

export default async function TeamMemberPage({ params }: Props) {
  const member = await getTeamMember(params.slug);

  if (!member) {
    notFound();
  }

  return (
    <div className="team-member-page">
      <JSONLDSchema schema={PersonSchema({
        name: member.name,
        jobTitle: member.title,
        description: metaDescriptionForTeamMember(member, 200),
        url: `/team/${member.slug}`,
        image: member.profileImage,
      })} />
      <JSONLDSchema schema={BreadcrumbSchema([
        { name: 'Home', url: '/' },
        { name: 'The Team', url: '/team' },
        { name: member.name, url: `/team/${member.slug}` },
      ])} />
      <section className={styles.memberHero}>
        <div className={styles.memberHeroImage}>
          <Image
            src="/images/The Team/The Team Hero.jpg"
            alt="The Team"
            fill
            className={styles.heroImage}
            priority
          />
          <h1>The Team</h1>
        </div>
      </section>

      <section className="member-content section-padding">
        <div className="container">
          <div className={styles.memberContentWrapper}>
            {member.profileImage && member.profileImage.trim() !== '' && (
              <div className={styles.memberImageContainer}>
                <Image
                  src={member.profileImage}
                  alt={member.name}
                  width={400}
                  height={500}
                  className={styles.memberProfileImage}
                  unoptimized={true}
                />
              </div>
            )}
            <div className={styles.memberDetails}>
              <h2 className={styles.memberName}>{member.name}</h2>
              <h3 className={styles.memberTitle}>{member.title}</h3>
              
              <div className={styles.bioContent}>
                {member.bio.split('\n\n').map((paragraph, i) => (
                  <p key={i}>{paragraph}</p>
                ))}
              </div>

              {(member.linkedin || member.facebook || member.instagram) && (
                <div className={styles.memberSocial}>
                  {member.linkedin && (
                    <a href={member.linkedin} target="_blank" rel="noopener noreferrer" className={styles.socialLink}>
                      LinkedIn
                    </a>
                  )}
                  {member.facebook && (
                    <a href={member.facebook} target="_blank" rel="noopener noreferrer" className={styles.socialLink}>
                      Facebook
                    </a>
                  )}
                  {member.instagram && (
                    <a href={member.instagram} target="_blank" rel="noopener noreferrer" className={styles.socialLink}>
                      Instagram
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <div className={styles.backLinkContainer}>
        <div className="container">
          <Link href="/team" className={styles.backLink}>
            ← Back to Team
          </Link>
        </div>
      </div>
    </div>
  );
}

