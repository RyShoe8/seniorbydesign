import { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { getTeamMember } from '../../actions';
import SeoImage from '@/components/SeoImage';
import Link from 'next/link';
import PageSchema from '@/components/PageSchema';
import { generateSEOMetadata, PersonSchema, BreadcrumbSchema } from '@/components/SEO';
import { metaDescriptionForTeamMember } from '@/lib/team-seo';
import { normalizeSlug } from '@/lib/slug';
import {
  resolveTeamMemberBio,
  teamMemberShouldNoindex,
} from '@/lib/team-bio-fallbacks';
import { heroAlt, STATIC_IMAGES, teamMemberAlt } from '@/lib/image-seo';
import styles from './page.module.css';

type Props = {
  params: { slug: string };
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const decodedSlug = decodeURIComponent(params.slug);
  const member = await getTeamMember(decodedSlug);

  if (!member) {
    return {
      title: 'Team Member Not Found',
    };
  }

  const pathSlug = normalizeSlug(member.slug);
  const memberWithSlug = { ...member, slug: pathSlug };
  const seoMeta = generateSEOMetadata({
    title: `${member.name} - ${member.title} - Senior By Design`,
    description: metaDescriptionForTeamMember(memberWithSlug),
    url: `/team/${pathSlug}`,
    image: member.profileImage,
    type: 'profile',
    keywords: [
      'interior designer',
      member.name,
      member.title,
      'senior living design',
    ],
  });

  if (teamMemberShouldNoindex(pathSlug, member.bio)) {
    return {
      ...seoMeta,
      robots: { index: false, follow: true },
    };
  }

  return seoMeta;
}

export const revalidate = 0;

export default async function TeamMemberPage({ params }: Props) {
  const decodedSlug = decodeURIComponent(params.slug);
  const member = await getTeamMember(decodedSlug);

  if (!member) {
    notFound();
  }

  const pathSlug = normalizeSlug(member.slug);
  if (decodedSlug !== pathSlug) {
    redirect(`/team/${encodeURIComponent(pathSlug)}`);
  }

  const bioText = resolveTeamMemberBio(pathSlug, member.bio);
  const bioParagraphs = bioText.split('\n\n').filter(Boolean);

  const sameAs = [member.linkedin, member.facebook, member.instagram].filter(
    (url): url is string => Boolean(url?.trim())
  );

  const memberWithSlug = { ...member, slug: pathSlug };

  return (
    <div className="team-member-page">
      <PageSchema
        schemas={[
          PersonSchema({
            name: member.name,
            jobTitle: member.title,
            description: metaDescriptionForTeamMember(memberWithSlug, 200),
            url: `/team/${pathSlug}`,
            image: member.profileImage,
            sameAs,
          }),
          BreadcrumbSchema([
            { name: 'Home', url: '/' },
            { name: 'The Team', url: '/team' },
            { name: member.name, url: `/team/${pathSlug}` },
          ]),
        ]}
      />
      <section className={styles.memberHero}>
        <div className={styles.memberHeroImage}>
          <SeoImage
            src={STATIC_IMAGES.teamHero}
            alt={heroAlt('team-member')}
            fill
            className={styles.heroImage}
            priority
          />
          <h1>The Team</h1>
        </div>
      </section>

      <section className="member-content section-padding reveal-on-scroll">
        <div className="container">
          <div className={styles.memberContentWrapper}>
            {member.profileImage && member.profileImage.trim() !== '' && (
              <div className={styles.memberImageContainer}>
                <SeoImage
                  src={member.profileImage}
                  alt={teamMemberAlt(member.name, member.title)}
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
                {bioParagraphs.map((paragraph, i) => (
                  <p key={i}>{paragraph}</p>
                ))}
              </div>

              {(member.linkedin || member.facebook || member.instagram) && (
                <div className={styles.memberSocial}>
                  {member.linkedin && (
                    <a
                      href={member.linkedin}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.socialLink}
                    >
                      LinkedIn
                    </a>
                  )}
                  {member.facebook && (
                    <a
                      href={member.facebook}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.socialLink}
                    >
                      Facebook
                    </a>
                  )}
                  {member.instagram && (
                    <a
                      href={member.instagram}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.socialLink}
                    >
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
