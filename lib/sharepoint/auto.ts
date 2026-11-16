import { collections } from "../portal/db";
import { PortalError } from "../portal/policy";
import type { Actor, Project } from "../portal/types";
import { readSourceFile, scanFolder, sharepointConfigured } from "./client";
import { planFiles, type ScannedFile } from "./files";
import { ingestFile } from "./ingest";

/** Automatic imports are recorded against this name in each project's history. */
const ROBOT: Actor = { id: "sharepoint", email: "SharePoint file sync", memberships: [] };
const MAX_BYTES = 25 * 1024 * 1024;

export interface FileBudget { files: number; until: number }
const spent = (budget: FileBudget) => budget.files <= 0 || Date.now() > budget.until;

/**
 * Brings one project's SharePoint folder into the portal.
 *
 * Presentations and project documents are saved automatically as versioned copies: a new file is added,
 * a changed file becomes the next version, and an unchanged file is skipped without being downloaded.
 * Quotes and contracts are never published automatically, because a quote is tied to a client approval;
 * they, and anything that looks internal or cannot be sorted, are listed for a person to review.
 */
export async function syncProjectFiles(project: Project, budget: FileBudget) {
  const c = await collections();
  let added = 0, error = "", more = false;
  let pending: { name: string; url: string; category: string; reason: string }[] = [];
  try {
    if (!project.filesFolder) return null;
    const scanned: ScannedFile[] = await scanFolder(project.filesFolder);
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
        { url: file.url, name: file.name, category: file.category, replacesId: file.replacesId },
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
 * Checks the SharePoint folder of every project that is on the sheet and has a folder set, least recently
 * checked first. Stops when its budget of files or time is used up; the next run carries on from there.
 */
export async function syncAllFiles(limit: { files?: number; seconds?: number } = {}) {
  if (!sharepointConfigured()) return { configured: false, results: [] };
  const budget: FileBudget = { files: limit.files ?? 8, until: Date.now() + (limit.seconds ?? 40) * 1000 };
  const c = await collections();
  const projects = (await c.projects.find({
    archived: false, filesFolder: { $exists: true, $ne: "" },
    $or: [{ smartsheet: { $exists: true } }, { "sheetQuoteRows.0": { $exists: true } }],
  }).toArray()).sort((a, b) => (a.filesSync?.at || "").localeCompare(b.filesSync?.at || ""));
  const results = [];
  for (const project of projects) {
    if (spent(budget)) break;
    const result = await syncProjectFiles(project, budget);
    if (result) results.push(result);
  }
  return { configured: true, results };
}
