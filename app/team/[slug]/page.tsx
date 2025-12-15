import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTeamMember } from '../../actions';
import Image from 'next/image';
import Link from 'next/link';

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
          <div className="member-header">
            {member.profileImage && (
              <div className="member-image">
                <Image
                  src={member.profileImage}
                  alt={member.name}
                  width={400}
                  height={500}
                />
              </div>
            )}
            <div className="member-info">
              <h1>{member.name}</h1>
              <h2 className="member-title">{member.title}</h2>
              {(member.linkedin || member.facebook || member.instagram) && (
                <div className="member-social">
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
          <div className="bio-content">
            {member.bio.split('\n\n').map((paragraph, i) => (
              <p key={i}>{paragraph}</p>
            ))}
          </div>
        </div>
      </section>

      <div className="back-link-container">
        <div className="container">
          <Link href="/team" className="back-link">
            ← Back to Team
          </Link>
        </div>
      </div>

      <style jsx>{`
        .member-header {
          display: grid;
          grid-template-columns: 300px 1fr;
          gap: var(--spacing-xl);
          align-items: start;
        }

        .member-image {
          border-radius: 8px;
          overflow: hidden;
        }

        .member-image img {
          width: 100%;
          height: auto;
        }

        .member-info h1 {
          margin-bottom: var(--spacing-sm);
        }

        .member-title {
          font-size: 30px;
          color: var(--sbd-gold);
          margin-bottom: var(--spacing-md);
        }

        .member-social {
          display: flex;
          gap: var(--spacing-sm);
        }

        .member-social a {
          color: var(--sbd-brown);
          text-decoration: underline;
        }

        .bio-content {
          max-width: 800px;
          margin: 0 auto;
        }

        .bio-content p {
          margin-bottom: var(--spacing-md);
          font-size: 19px;
          line-height: 1.8;
        }

        .back-link-container {
          padding: var(--spacing-lg) 0;
          border-top: 1px solid var(--warm-grey-1);
        }

        .back-link {
          color: var(--sbd-brown);
          font-weight: 500;
        }

        @media (max-width: 768px) {
          .member-header {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}

