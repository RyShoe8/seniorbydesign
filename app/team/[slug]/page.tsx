import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTeamMember } from '../../actions';
import Image from 'next/image';
import Link from 'next/link';
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

  return {
    title: `${member.name} - ${member.title} - Senior By Design`,
    description: member.bio.substring(0, 160),
  };
}

export default async function TeamMemberPage({ params }: Props) {
  const member = await getTeamMember(params.slug);

  if (!member) {
    notFound();
  }

  return (
    <div className="team-member-page">
      <section className="member-hero section-padding">
        <div className="container">
          <div className={styles.memberHeader}>
            {member.profileImage && (
              <div className={styles.memberImage}>
                <Image
                  src={member.profileImage}
                  alt={member.name}
                  width={400}
                  height={500}
                />
              </div>
            )}
            <div className={styles.memberInfo}>
              <h1>{member.name}</h1>
              <h2 className={styles.memberTitle}>{member.title}</h2>
              {(member.linkedin || member.facebook || member.instagram) && (
                <div className={styles.memberSocial}>
                  {member.linkedin && (
                    <a href={member.linkedin} target="_blank" rel="noopener noreferrer">
                      LinkedIn
                    </a>
                  )}
                  {member.facebook && (
                    <a href={member.facebook} target="_blank" rel="noopener noreferrer">
                      Facebook
                    </a>
                  )}
                  {member.instagram && (
                    <a href={member.instagram} target="_blank" rel="noopener noreferrer">
                      Instagram
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="member-bio section-padding">
        <div className="container">
          <div className={styles.bioContent}>
            {member.bio.split('\n\n').map((paragraph, i) => (
              <p key={i}>{paragraph}</p>
            ))}
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

