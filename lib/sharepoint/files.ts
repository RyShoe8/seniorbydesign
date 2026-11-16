import { randomUUID } from "crypto";
import { hash, PortalError } from "../portal/policy";
import type { PortalDocument } from "../portal/types";

export const SOURCE_ROOT = "/sites/SBDFiles/Shared Documents/Comm - Remodels";
export const SOURCE_HOST = "seniorbydesign.sharepoint.com";
export const fileCategories = ["Presentations", "Documents", "Quotes", "Contracts"] as const;
export type FileCategory = typeof fileCategories[number];

/** Accept a library-view URL or a direct path, never a sharing link that grants access. */
export function sourcePath(value: string) {
  let url: URL;
  try { url = new URL(value); } catch { throw new PortalError("Enter a SharePoint file or folder link"); }
  if (url.protocol !== "https:" || url.hostname !== SOURCE_HOST || url.port || url.username || url.password)
    throw new PortalError("Use the Senior By Design SharePoint site");
  const path = url.searchParams.get("id") || decodeURIComponent(url.pathname);
  if (path.split("/").some(part => part === ".." || part === ".") || /[\\\x00-\x1f]/.test(path) ||
      !(path === SOURCE_ROOT || path.startsWith(`${SOURCE_ROOT}/`)))
    throw new PortalError("Choose a file or folder inside Comm - Remodels");
  return path;
}
export function sourceUrl(path: string) {
  return `https://${SOURCE_HOST}${path.split("/").map(encodeURIComponent).join("/")}`;
}
export function classifyFile(name: string, path = ""): { category: FileCategory | ""; reason: string } {
  const words = `${path}/${name}`.toLowerCase();
  if (/(budget|costing|margin|internal|working|draft|vendor|purchase.order|archive|completed remodels)/i.test(words))
    return { category: "", reason: "Working, financial, vendor, or archived file: review before sharing" };
  // The file's own name decides first: "FFE Remodel Agreement" is a contract and "FFE Presentation" a presentation,
  // so "FFE" by itself says nothing. The folder is only a fallback.
  const title = name.toLowerCase();
  for (const text of [title, words]) {
    if (/\b(presentations?|finish boards?)\b/.test(text) || (text === title && /\.(pptx?|ppsx?)$/.test(title)))
      return { category: "Presentations", reason: "Presentation name or file type" };
    if (/\b(quotes?|proposals?)\b/.test(text)) return { category: "Quotes", reason: "Quote or proposal" };
    if (/\b(contracts?|agree?ments?|ageements?)\b/.test(text)) return { category: "Contracts", reason: "Contract or agreement" };
  }
  if (/\b(floor[ -]?plans?|drawings?|specifications?)\b/i.test(words)) return { category: "Documents", reason: "Project drawing or specification" };
  return { category: "", reason: "Choose a category after reviewing this file" };
}
export function importedFile(input: Record<string, unknown>): PortalDocument {
  const path = sourcePath(String(input.url || ""));
  if (!/\.(pdf|pptx?|ppsx?|docx?|xlsx?|csv|txt|png|jpe?g|webp)$/i.test(path))
    throw new PortalError("Choose a supported document, presentation, or image file");
  const name = String(input.name || path.split("/").pop()).trim();
  if (!name || name.length > 300) throw new PortalError("File name must be 1–300 characters");
  const category = String(input.category || "") as FileCategory;
  if (!fileCategories.includes(category)) throw new PortalError(`Choose a category for ${name}`);
  const url = sourceUrl(path);
  return { id: randomUUID(), sourceKey: hash(url), name, url, category, historical: false };
}

/** Older documents were saved as typed or pasted links, so compare where they point, not how they were written. */
export function sameAddress(existing: string, incoming: string) {
  if (existing === incoming) return true;
  try { return sourceUrl(sourcePath(existing)) === incoming; } catch { return false; }
}

/** Each revision refers to immutable bytes. Current duplicates do not create a revision. */
export function mergeFiles(existing: PortalDocument[], incoming: PortalDocument[]) {
  const documents = existing.map(document => ({ ...document }));
  let added = 0;
  for (const file of incoming) {
    if (!file.storageId || !file.contentHash) throw new PortalError("A saved file snapshot is required");
    const family = documents.filter(doc => doc.sourceKey === file.sourceKey || sameAddress(doc.url, file.url) ||
      (file.sourceItemId && doc.sourceItemId === file.sourceItemId));
    const prior = family.find(doc => !doc.historical);
    if (prior) {
      if (prior.category !== file.category)
        throw new PortalError(`${file.name} is already registered in ${prior.category}; keep the category when adding a revision`, 409);
      if (prior.contentHash === file.contentHash) continue;
      prior.historical = true;
    }
    documents.push({ ...file, revision: Math.max(0, ...family.map(doc => doc.revision || 1)) + 1 }); added++;
  }
  return { documents, added };
}

export interface ScannedFile { name: string; url: string; category: string; reason: string; eTag?: string; size?: number }
/** Categories that are safe to publish without a person looking first. Quotes and contracts are not: a quote is tied to an approval. */
export const AUTOMATIC: readonly string[] = ["Presentations", "Documents"];

/**
 * Decides what an automatic folder check should do with each file found:
 * save it (new, or changed since the saved copy), skip it (unchanged), or leave it for a person to review.
 */
export function planFiles(documents: PortalDocument[], scanned: ScannedFile[]) {
  const ingest: (ScannedFile & { replacesId?: string })[] = [];
  const review: { name: string; url: string; category: string; reason: string }[] = [];
  let unchanged = 0;
  for (const file of scanned) {
    const current = documents.find(doc => !doc.historical && sameAddress(doc.url, file.url));
    if (!AUTOMATIC.includes(file.category)) {
      // Already published by a person: nothing more to ask them.
      if (!current) review.push({ name: file.name, url: file.url, category: file.category, reason: file.category ? `${file.category} are published after review` : file.reason });
      continue;
    }
    if (current && current.category !== file.category) {
      review.push({ name: file.name, url: file.url, category: current.category, reason: `Published as ${current.category}; the name now suggests ${file.category}` });
      continue;
    }
    if (current?.storageId && current.sourceETag && current.sourceETag === file.eTag) { unchanged++; continue; }
    ingest.push({ ...file, ...(current ? { replacesId: current.id } : {}) });
  }
  return { ingest, review, unchanged };
}
