import { clampMetaDescription, stripHtmlToPlainText } from '@/lib/blog-seo';
import { resolveTeamMemberBio } from '@/lib/team-bio-fallbacks';

export const TEAM_INDEX_TITLE = 'Senior Living Interior Design Team | Senior By Design';

export const TEAM_INDEX_H1 = 'Meet Our Senior Living Design Team';

export const TEAM_INDEX_META = clampMetaDescription(
  'Meet the Senior By Design team—certified interior designers and FF&E specialists with 25+ years of combined experience in senior living design.'
);

export const TEAM_INDEX_INTRO =
  'Senior By Design employs certified senior living interior designers and FF&E specialists with 25+ years of combined experience. The firm\'s team personally tests furnishings, sources custom art worldwide, and delivers turnkey interiors for communities nationwide—bringing the same care to every project that founder Reid Bonner learned caring for his own family in senior living.';

export const BLOG_INDEX_TITLE =
  'Senior Living Design Journal | Insights & Trends | Senior By Design';

export const BLOG_INDEX_META = clampMetaDescription(
  "Senior By Design's blog covering senior living interior design trends, design principles, FF&E insights, and behind-the-scenes stories from our projects."
);

export const BLOG_INDEX_SUBTITLE = 'Senior Living Design Insights, Trends & Principles';

export const BLOG_INDEX_INTRO =
  'Senior By Design publishes The Principled Design Journal to share senior living interior design trends, FF&E insights, and lessons from the firm\'s projects nationwide. Articles cover design principles, procurement, and the people behind the communities Senior By Design serves.';

export function metaDescriptionForTeamMember(
  member: { name: string; title: string; bio: string; slug?: string },
  max = 160
): string {
  const slug = member.slug ?? '';
  const bioPlain = slug
    ? resolveTeamMemberBio(slug, member.bio)
    : stripHtmlToPlainText(member.bio);
  const prefix = `${member.name}, ${member.title} at Senior By Design. `;
  const remaining = max - prefix.length;
  if (remaining <= 0) return clampMetaDescription(prefix.trim(), max);
  const bioSnippet =
    bioPlain.length <= remaining
      ? bioPlain
      : clampMetaDescription(bioPlain, remaining).replace(/…$/, '');
  return clampMetaDescription(`${prefix}${bioSnippet}`, max);
}
