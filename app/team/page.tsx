import Image from 'next/image';
import Link from 'next/link';
import { getTeamMembersCollection } from '@/lib/db';
import styles from './page.module.css';

async function getTeamMembers() {
  try {
    const collection = await getTeamMembersCollection();
    const members = await collection.find({}).toArray();
    return members;
  } catch (error) {
    console.error('Error fetching team members:', error);
    return [];
  }
}

export default async function TeamPage() {
  const teamMembers = await getTeamMembers();

  return (
    <div className={styles.teamPage}>
      {/* Hero Section */}
      <section className={styles.hero}>
        <div className="container">
          <h1 className={styles.heroTitle}>Meet the Experts</h1>
        </div>
      </section>

      {/* Group Photo Section */}
      <section className={styles.groupPhotoSection}>
        <div className="container">
          <div className={styles.groupPhotoWrapper}>
            <Image
              src="/images/The Team/SBD-Group-Photo.webp"
              alt="Senior By Design Team"
              width={1200}
              height={800}
              className={styles.groupPhoto}
              priority
            />
          </div>
        </div>
      </section>

      {/* We Love What We Do Section */}
      <section className={styles.loveSection}>
        <div className="container">
          <h2 className={styles.loveTitle}>We Love What We Do</h2>
          <p className={styles.loveText}>
            Our team is passionate about creating exceptional senior living spaces 
            that combine functionality, comfort, and style. With years of experience 
            and a deep understanding of the unique needs of senior communities, we 
            bring expertise and dedication to every project.
          </p>
        </div>
      </section>

      {/* Team Members Grid */}
      {teamMembers.length > 0 && (
        <section className={styles.membersSection}>
          <div className="container">
            <div className={styles.membersGrid}>
              {teamMembers.map((member: any) => (
                <Link
                  key={member._id}
                  href={`/team/${member.slug}`}
                  className={styles.memberCard}
                >
                  {member.profileImage && (
                    <div className={styles.memberImageWrapper}>
                      <Image
                        src={member.profileImage}
                        alt={member.name}
                        width={400}
                        height={400}
                        className={styles.memberImage}
                      />
                    </div>
                  )}
                  <div className={styles.memberInfo}>
                    <h3 className={styles.memberName}>{member.name}</h3>
                    {member.title && (
                      <p className={styles.memberTitle}>{member.title}</p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
