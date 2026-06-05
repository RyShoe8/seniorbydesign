import { normalizeSlug } from '@/lib/slug';
import { wordCountFromPlainText } from '@/lib/word-count';
import { stripHtmlToPlainText } from '@/lib/blog-seo';

const FALLBACK_BIOS: Record<string, string> = {
  'jimmy-hong':
    'Jimmy Hong serves as Chief Financial Officer at Senior By Design, overseeing the financial strategy that supports the firm\'s nationwide senior living interior design projects. With a focus on disciplined budgeting, FF&E cost management, and transparent reporting, Jimmy ensures every procurement and installation engagement stays aligned with owner objectives and project timelines. He works closely with design, warehouse, and installation teams to optimize purchasing decisions across our 35,000-square-foot Dallas design center—helping operators maximize value without compromising quality. Jimmy\'s financial leadership enables Senior By Design to deliver turnkey interiors at scale while maintaining the boutique, hands-on approach that defines the firm.',
  'jc-ralston':
    'JC Ralston leads installation for Senior By Design, managing the field teams that bring senior living interior design projects to life in communities across the United States. From pre-installation staging at our Dallas warehouse through final punch on site, JC coordinates delivery schedules, assembly, and placement of furniture, art, and accessories—ensuring every piece arrives on time and matches the design intent documented in staging photography. His hands-on leadership keeps complex FF&E installations on track for new construction openings and renovation timelines alike. JC\'s experience in senior living environments means he understands the operational realities of occupied buildings, phased work, and the high standards operators expect on move-in day.',
  'alois-skloss':
    'Alois Skloss supervises Senior By Design\'s 35,000-square-foot warehouse and design center in Dallas, Texas—the hub where FF&E for senior living communities is received, inspected, staged, and prepared for installation. He manages inventory flow, quality control, and warehouse operations that keep procurement and installation teams supplied with the antiques, custom art, and commercial-grade furnishings our designers specify. Alois ensures product is stored safely, tracked accurately, and packaged with the staging documentation installation crews need for precise on-site assembly. His leadership supports the firm\'s turnkey model: sourcing worldwide, warehousing locally, and delivering on schedule to communities nationwide.',
};

export function teamBioFallback(slug: string): string | null {
  const key = normalizeSlug(slug);
  return FALLBACK_BIOS[key] ?? null;
}

/** Bio text for display and SEO: DB bio when sufficient, else fallback (or combined). */
export function resolveTeamMemberBio(slug: string, dbBio: string): string {
  const plain = stripHtmlToPlainText(dbBio);
  if (wordCountFromPlainText(plain) >= 100) {
    return plain;
  }
  const fallback = teamBioFallback(slug);
  if (!fallback) {
    return plain;
  }
  if (wordCountFromPlainText(plain) === 0) {
    return fallback;
  }
  return `${plain}\n\n${fallback}`;
}

export function teamMemberBioWordCount(slug: string, dbBio: string): number {
  return wordCountFromPlainText(resolveTeamMemberBio(slug, dbBio));
}

export function teamMemberShouldNoindex(slug: string, dbBio: string): boolean {
  return teamMemberBioWordCount(slug, dbBio) < 100;
}
