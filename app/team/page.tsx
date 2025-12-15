import { Metadata } from 'next';
import Link from 'next/link';
import { getTeamMembers } from '../actions';
import Image from 'next/image';

export const metadata: Metadata = {
  title: 'Team - Senior By Design',
  description: 'SBD founder Reid Bonner, and his team of talented designers have collectively been designing, creating and manufacturing interior products for over 25 years.',
};

export default async function Team() {
  const teamMembers = await getTeamMembers();

  return (
    <>
      <section className="team-hero section-padding">
        <div className="container">
          <div className="hero-image-placeholder">
            <h1>The Team</h1>
          </div>
        </div>
      </section>

      <section className="team-intro section-padding">
        <div className="container">
          <h2>We Love What We Do</h2>
          <div className="intro-content">
            <p>
              SBD founder Reid Bonner, and his team of talented designers have collectively been designing, creating and manufacturing interior products for over 25 years. Every detail of our work is given serious consideration, from the overall look of a property, to personally comfort testing and often customizing each seating option we offer. We take great pride in creating beautiful, functional and well-designed senior living communities within our industry. Our unique approach results in luxurious, soul warming interiors that are often found in America's most beautiful homes.
            </p>
            <p>
              At the very core of what sets SBD apart from other design firms is Reid's intimate connection to his beloved father and grandmother. It is the first-hand experience, caring for his loved ones and his reflections on the latter years of their shared experiences living within senior living communities that drives and inspires his senior living design aesthetic.
            </p>
            <p>
              After 15 years in the art world, Reid has secured the finest client relationships, thereby allowing SBD the ability to provide original works at unparalleled value. SBD represents the epitome of Reid's and his team of highly skilled designers, design aesthetic, which is driven by his passion to create communities that reflect the warmth and inspiration of our amazing seniors.
            </p>
          </div>
        </div>
      </section>

      <section className="team-quote section-padding bg-warm-grey">
        <div className="container">
          <blockquote className="quote">
            "We want our choices to create environments that hug and embrace those who live within them; spaces they are proud to call home."
          </blockquote>
          <p className="quote-author">Reid Bonner, President</p>
        </div>
      </section>

      <section className="team-picture section-padding">
        <div className="container">
          <div className="team-photo-placeholder">Team Picture</div>
        </div>
      </section>

      <section className="team-members section-padding">
        <div className="container">
          <h2>Meet the experts</h2>
          <div className="team-grid">
            {teamMembers.map((member) => (
              <Link
                key={member._id?.toString()}
                href={`/team/${member.slug}`}
                className="team-member-card"
              >
                {member.profileImage ? (
                  <div className="member-image-wrapper">
                    <Image
                      src={member.profileImage}
                      alt={member.name}
                      width={400}
                      height={500}
                      className="member-image"
                    />
                    <div className="member-info-overlay">
                      <h3>{member.name}</h3>
                      <p>{member.title}</p>
                    </div>
                  </div>
                ) : (
                  <div className="member-placeholder">
                    <div className="member-info-overlay">
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

      <style jsx>{`
        .team-hero {
          background: linear-gradient(135deg, var(--warm-grey-1) 0%, var(--warm-grey-3) 100%);
        }

        .hero-image-placeholder {
          height: 400px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--warm-grey-1);
          border-radius: 8px;
        }

        .hero-image-placeholder h1 {
          color: var(--sbd-brown);
        }

        .intro-content {
          max-width: 900px;
          margin: 0 auto;
        }

        .intro-content p {
          margin-bottom: var(--spacing-md);
          font-size: 19px;
          line-height: 1.8;
        }

        .quote {
          font-size: 36px;
          font-style: italic;
          font-weight: 300;
          color: var(--sbd-brown);
          text-align: center;
          margin-bottom: var(--spacing-md);
          line-height: 1.4;
        }

        .quote-author {
          text-align: center;
          font-size: 20px;
          color: var(--sbd-gold);
          font-weight: 600;
        }

        .team-photo-placeholder {
          width: 100%;
          height: 500px;
          background: var(--warm-grey-1);
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--warm-grey-3);
          border-radius: 8px;
        }

        .team-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: var(--spacing-md);
        }

        .team-member-card {
          position: relative;
          border-radius: 8px;
          overflow: hidden;
          aspect-ratio: 3/4;
          cursor: pointer;
          transition: transform 0.3s ease;
        }

        .team-member-card:hover {
          transform: translateY(-5px);
        }

        .member-image-wrapper,
        .member-placeholder {
          width: 100%;
          height: 100%;
          position: relative;
        }

        .member-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .member-placeholder {
          background: var(--warm-grey-1);
        }

        .member-info-overlay {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          background: linear-gradient(to top, rgba(89, 56, 37, 0.9), transparent);
          padding: var(--spacing-md);
          color: #fff;
        }

        .member-info-overlay h3 {
          color: #fff;
          margin-bottom: 0.25rem;
          font-size: 24px;
        }

        .member-info-overlay p {
          color: var(--sbd-gold);
          font-size: 16px;
          margin: 0;
        }

        @media (max-width: 768px) {
          .quote {
            font-size: 28px;
          }

          .team-grid {
            grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
          }
        }
      `}</style>
    </>
  );
}

