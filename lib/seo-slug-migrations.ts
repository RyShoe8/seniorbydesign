import { getTeamMembersCollection, getBlogPostsCollection } from '@/lib/db';

/** Known legacy slugs → canonical slugs (one-time Mongo updates on deploy). */
export const SEO_SLUG_MIGRATIONS = [
  { collection: 'team' as const, oldSlug: 'Cynthia', newSlug: 'cynthia-vrba' },
  { collection: 'team' as const, oldSlug: 'Gianna', newSlug: 'gianna-niccolai' },
  {
    collection: 'blog' as const,
    oldSlug: 'The_SBD_Chair_Test_Yes_We_Sit_in_Every_Single_One',
    newSlug: 'the-sbd-chair-test',
  },
];

export async function runSeoSlugMigration(): Promise<void> {
  const teamCollection = await getTeamMembersCollection();
  const blogCollection = await getBlogPostsCollection();

  for (const migration of SEO_SLUG_MIGRATIONS) {
    if (migration.collection === 'team') {
      await teamCollection.updateOne(
        { slug: migration.oldSlug },
        { $set: { slug: migration.newSlug, updatedAt: new Date() } }
      );
    } else {
      await blogCollection.updateOne(
        { slug: migration.oldSlug },
        { $set: { slug: migration.newSlug, updatedAt: new Date() } }
      );
    }
  }
}
