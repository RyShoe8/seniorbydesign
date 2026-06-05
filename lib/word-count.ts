/** Word count for plain text (team bios, excerpts, etc.). */
export function wordCountFromPlainText(text: string | undefined | null): number {
  const t = (text ?? '').trim();
  if (!t) return 0;
  return t.split(/\s+/).filter(Boolean).length;
}
