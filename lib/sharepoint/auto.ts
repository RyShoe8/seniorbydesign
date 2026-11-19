import { collections } from "../portal/db";
import { PortalError } from "../portal/policy";
import type { Actor, Project } from "../portal/types";
import { listProjectFolders, readSourceFile, scanFolder, sharepointConfigured } from "./client";
import { planFiles, sourceUrl, type ScannedFile } from "./files";
import { matchFolder, type FolderEntry } from "./match";
import { ingestFile } from "./ingest";

/** Automatic imports are recorded against this name in each project's history. */
const ROBOT: Actor = { id: "sharepoint", email: "SharePoint file sync", memberships: [] };
const MAX_BYTES = 25 * 1024 * 1024;

export interface FileBudget { files: number; until: number }

/** The folder list is read at most every few hours: listing the whole library takes many requests. */
async function folderIndex(force = false): Promise<FolderEntry[]> {
  const c = await collections();
  const store = c.db.collection<{ _id: string; at: Date; folders: FolderEntry[] }>("portalFileIndex");
  const saved = await store.findOne({ _id: "folders" });
  if (!force && saved && Date.now() - saved.at.getTime() < 6 * 3600 * 1000) return saved.folders;
  const folders = await listProjectFolders();
  await store.updateOne({ _id: "folders" }, { $set: { at: new Date(), folders } }, { upsert: true });
  return folders;
}

/**
 * Finds the project's folder by its name and client. A folder set by a person or by the sheet is kept;
 * one the portal found is checked again, so a folder created later or renamed is picked up.
 */
async function findFolder(project: Project, index: FolderEntry[]) {
  if (project.filesFolder && !project.filesFolderAuto) return { folder: project.filesFolder };
  const c = await collections();
  const company = (await c.organizations.findOne({ _id: project.companyId }))?.name || "";
  const match = matchFolder(project.name, company, index);
  if ("error" in match) {
    if (project.filesFolderAuto) await c.projects.updateOne({ _id: project._id }, { $unset: { filesFolder: "", filesFolderAuto: "" } });
    return { error: `${match.error}. Set the folder under Edit project, or in the sheet's Portal Files Folder column.${match.candidates.length ? ` Possible folders: ${match.candidates.map((path) => path.split("/").slice(-2).join(" / ")).join("; ")}` : ""}` };
  }
  const folder = sourceUrl(match.path);
  if (folder !== project.filesFolder)
    await c.projects.updateOne({ _id: project._id }, { $set: { filesFolder: folder, filesFolderAuto: true } });
  return { folder };
}
const spent = (budget: FileBudget) => budget.files <= 0 || Date.now() > budget.until;

/**
 * Brings one project's SharePoint folder into the portal.
 *
 * Presentations and project documents are saved automatically as versioned copies: a new file is added,
 * a changed file becomes the next version, and an unchanged file is skipped without being downloaded.
 * Quotes and contracts are never published automatically, because a quote is tied to a client approval;
 * they, and anything that looks internal or cannot be sorted, are listed for a person to review.
 */
export async function syncProjectFiles(project: Project, budget: FileBudget, index?: FolderEntry[]) {
  const c = await collections();
  let added = 0, error = "", more = false;
  let pending: { name: string; url: string; category: string; reason: string }[] = [];
  try {
    const found = await findFolder(project, index ?? await folderIndex());
    if (!found.folder) throw new PortalError(found.error || "No SharePoint folder found for this project");
    const scanned: ScannedFile[] = await scanFolder(found.folder);
    const plan = planFiles(project.documents, scanned);
    pending = plan.review;
    for (const file of plan.ingest) {
      if (spent(budget)) { more = true; break; }
      if (file.size && file.size > MAX_BYTES) {
        pending.push({ name: file.name, url: file.url, category: file.category, reason: "Larger than 25 MB: too large to save in the portal" });
        continue;
      }
      budget.files--;
      const source = await readSourceFile(file.url);
      const fresh = await c.projects.findOne({ _id: project._id, archived: false });
      if (!fresh) break;
      const result = await ingestFile(
        fresh._id, fresh.version,
        { url: file.url, name: file.name, category: file.category, replacesId: file.replacesId, family: file.family, sourceModified: file.modified, sourceRev: file.sourceRev },
        source.bytes, ROBOT, source.sourceItemId, source.eTag,
      );
      if (result.added) added++;
      // Same contents as the copy already saved (for example, the file was only renamed or re-shared):
      // remember SharePoint's marker so it is not downloaded again next time.
      else if (file.replacesId)
        await c.projects.updateOne({ _id: fresh._id, "documents.id": file.replacesId }, { $set: { "documents.$.sourceETag": source.eTag } });
    }
  } catch (problem) {
    error = problem instanceof PortalError ? problem.message : "The SharePoint folder could not be read";
  }
  await c.projects.updateOne({ _id: project._id }, {
    $set: { filesSync: { at: new Date().toISOString(), added, more, error, pending: pending.slice(0, 60) } },
  });
  return { project: project.name, added, review: pending.length, more, error };
}

/**
 * Checks the SharePoint folder of every project that is on the sheet, finding the folder when needed, least recently
 * checked first. Stops when its budget of files or time is used up; the next run carries on from there.
 */
export async function syncAllFiles(limit: { files?: number; seconds?: number } = {}) {
  if (!sharepointConfigured()) return { configured: false, results: [] };
  const budget: FileBudget = { files: limit.files ?? 8, until: Date.now() + (limit.seconds ?? 40) * 1000 };
  const c = await collections();
  const projects = (await c.projects.find({
    archived: false,
    $or: [{ smartsheet: { $exists: true } }, { "sheetQuoteRows.0": { $exists: true } }],
  }).toArray()).sort((a, b) => (a.filesSync?.at || "").localeCompare(b.filesSync?.at || ""));
  const index = await folderIndex();
  const results = [];
  for (const project of projects) {
    if (spent(budget)) break;
    const result = await syncProjectFiles(project, budget, index);
    if (result) results.push(result);
  }
  return { configured: true, results };
}
