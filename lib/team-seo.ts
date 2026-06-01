import { clampMetaDescription, stripHtmlToPlainText } from '@/lib/blog-seo';

export function metaDescriptionForTeamMember(
  member: { name: string; title: string; bio: string },
  max = 160
): string {
  const prefix = `${member.name}, ${member.title} at Senior By Design. `;
  const bioPlain = stripHtmlToPlainText(member.bio);
  const remaining = max - prefix.length;
  if (remaining <= 0) return clampMetaDescription(prefix.trim(), max);
  const bioSnippet =
    bioPlain.length <= remaining
      ? bioPlain
      : clampMetaDescription(bioPlain, remaining).replace(/…$/, '');
  return clampMetaDescription(`${prefix}${bioSnippet}`, max);
}
