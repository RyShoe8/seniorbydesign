/**
 * Finds a project's folder in Comm - Remodels from its name and its client, with no one pasting links.
 *
 * The library is laid out two ways: a client folder holding one folder per community
 * ("ReNew REIT / Phoenix at Lake Lanier", "ESL / OH - Heritage Crossing"), or a community folder
 * at the top ("VA - Legacy Ridge MC - SRI"). A folder matches when every distinctive word in its
 * name appears in the project's name. Only one clear winner is used; anything uncertain is left
 * for a person, so one client's files can never land on another client's project.
 */

export interface FolderEntry { path: string; name: string; parent: string | null }

const STOP = new Set([
  "the", "at", "of", "and", "a", "an", "in", "on", "for", "by", "to", "with", "sbd", "remodel", "ffe", "ff", "e",
  "project", "projects", "new", "build", "design", "fee", "phase", "llc", "inc",
  // US state codes, which the sheet and the folders do not always agree on (IN vs IL).
  "al", "ak", "az", "ar", "ca", "co", "ct", "de", "fl", "ga", "hi", "id", "il", "ia", "ks", "ky", "la", "me", "md",
  "ma", "mi", "mn", "ms", "mo", "mt", "ne", "nv", "nh", "nj", "nm", "ny", "nc", "nd", "oh", "ok", "or", "pa", "ri",
  "sc", "sd", "tn", "tx", "ut", "vt", "va", "wa", "wv", "wi", "wy",
]);
/** Words in a client's name that say nothing about which client it is. */
const GENERIC_OWNER = new Set(["senior", "living", "healthcare", "health", "care", "group", "management", "managment", "communities", "properties", "remodels", "development", "dev", "ministries", "llc", "inc"]);

export function words(text: string) {
  return text.toLowerCase().replace(/&/g, " and ").replace(/[^a-z0-9]+/g, " ").split(" ")
    .filter(Boolean)
    .map((word) => (word.length > 4 && word.endsWith("s") && !word.endsWith("ss") ? word.slice(0, -1) : word))
    .filter((word) => !STOP.has(word));
}

/** Folders that are never a project's own folder: archives, templates, and the standard subfolders inside a project. */
export function notAProjectFolder(name: string) {
  return /^[~]/.test(name.trim()) ||
    /(do not use|template|archive|completed|holiday)/i.test(name) ||
    /^(quotes?|contracts?|presentations?|presenations?|floor plans?|architectural|photos?|notes?|share(d)? external|flooring|proposals?.*|walk.*|.*photos.*|.*for ai)$/i.test(name.trim());
}

/** "ESL" is Experience Senior Living; "ReNew REIT" is RenewREIT; "Civitas Remodels" is Civitas Senior Healthcare. */
export function sameOwner(folder: string, company: string) {
  const squash = (text: string) => text.toLowerCase().replace(/^\s*\d+\s*-\s*/, "").replace(/[^a-z0-9]/g, "");
  if (!folder.trim() || !company.trim()) return false;
  if (squash(folder) === squash(company)) return true;
  const companyWords = company.replace(/^\s*\d+\s*-\s*/, "").split(/[^A-Za-z0-9]+/).filter(Boolean);
  const acronym = companyWords.filter((word) => !/^(llc|inc)$/i.test(word)).map((word) => word[0].toLowerCase()).join("");
  if (acronym.length >= 2 && squash(folder) === acronym) return true;
  const distinct = (text: string) => new Set(text.toLowerCase().split(/[^a-z0-9]+/).filter((word) => word.length >= 4 && !GENERIC_OWNER.has(word)));
  const a = distinct(folder), b = distinct(company.replace(/^\s*\d+\s*-\s*/, ""));
  return [...a].some((word) => b.has(word));
}

export type FolderMatch = { path: string } | { error: string; candidates: string[] };

export function matchFolder(projectName: string, company: string, index: FolderEntry[]): FolderMatch {
  const project = new Set(words(projectName));
  // A folder may carry the client's name or initials ("VA - Legacy Ridge MC - SRI"); those words are not required.
  const ownerWords = new Set(company.replace(/^\s*\d+\s*-\s*/, "").toLowerCase().split(/[^a-z0-9]+/).filter(Boolean));
  const ranked: { path: string; underOwner: boolean; size: number }[] = [];
  for (const entry of index) {
    if (notAProjectFolder(entry.name)) continue;
    const parent = entry.parent ? index.find((candidate) => candidate.path === entry.parent) : undefined;
    // A folder inside a client folder belongs to that client only.
    if (entry.parent && !(parent && sameOwner(parent.name, company))) continue;
    // The client's own folder is not a project folder.
    if (!entry.parent && sameOwner(entry.name, company)) continue;
    const own = [...new Set(words(entry.name))].filter((word) => !ownerWords.has(word) && !sameOwner(word, company));
    const enough = own.length >= 2 || (own.length === 1 && own[0].length >= 5);
    if (!enough || !own.every((word) => project.has(word))) continue;
    ranked.push({ path: entry.path, underOwner: Boolean(entry.parent), size: own.length });
  }
  if (!ranked.length) return { error: "No folder in Comm - Remodels matches this project's name", candidates: [] };
  // Inside the client's folder beats the top level; then the more specific name wins.
  ranked.sort((a, b) => Number(b.underOwner) - Number(a.underOwner) || b.size - a.size);
  const [best, next] = ranked;
  if (next && next.underOwner === best.underOwner && next.size === best.size)
    return { error: "Several folders match this project equally well", candidates: ranked.filter((entry) => entry.underOwner === best.underOwner && entry.size === best.size).map((entry) => entry.path) };
  return { path: best.path };
}

/**
 * Groups the revisions of one document: "MC FFE Presentation REV 2.pdf", "Rev. 1 7-2-26.pdf" and
 * "6-9-26.pdf" are the same presentation. Revision marks, dates and copy markers are ignored; every
 * other word, including AL and MC, is kept so different documents never merge.
 */
export function documentFamily(name: string) {
  return name.toLowerCase()
    .replace(/\.[a-z0-9]{2,5}$/, "")
    .replace(/\brev(?:ision)?\.?\s*\d+(?:\.\d+)?(?:pdf)?\b/g, " ")
    .replace(/\b(?:v|version)\s*\d+\b/g, " ")
    .replace(/\b\d{1,2}[.\-/]\d{1,2}[.\-/]\d{2,4}\b/g, " ")
    .replace(/\b\d{6,8}\b/g, " ")
    .replace(/\(\d+\)|\bcopy\b|\bfinal\b|\bexecuted\b/g, " ")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .split(" ").filter((word) => word && !["the", "at", "and", "sbd", "pdf"].includes(word))
    .join(" ");
}
/** The revision number in a file name, if it has one ("REV 3", "Rev. 1"). */
export function revisionNumber(name: string) {
  const match = name.match(/\brev(?:ision)?\.?\s*(\d+(?:\.\d+)?)/i);
  return match ? Number(match[1]) : null;
}
