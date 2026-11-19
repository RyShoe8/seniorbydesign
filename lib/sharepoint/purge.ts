import { GridFSBucket } from "mongodb";
import { collections } from "../portal/db";
import type { Project } from "../portal/types";

/**
 * Removes every file copy saved in the database and puts each project's document list back the way
 * it was before the first import. The originals stay in SharePoint, so nothing is lost.
 *
 * Deleting comes first: an Atlas cluster over its storage quota still accepts deletes, and only then
 * accepts the updates that put the document lists back. Running this again finishes whatever is left.
 */
export async function purgeFileCopies() {
  const c = await collections();
  const bucket = new GridFSBucket(c.db, { bucketName: "portalFileSnapshots" });
  let deleted = 0, failedDeletes = 0;
  for (const file of await bucket.find({}, { projection: { _id: 1 } }).toArray()) {
    try { await bucket.delete(file._id); deleted++; } catch { failedDeletes++; }
  }
  // Any chunks left without a file record.
  await c.db.collection("portalFileSnapshots.chunks").deleteMany({}).catch(() => undefined);

  const restored: string[] = [], failedRestores: string[] = [];
  const projects = await c.projects.find({ "documents.storageId": { $exists: true } }).toArray();
  for (const project of projects) {
    const first = await c.events.find({ projectId: project._id, action: "files-imported" }).sort({ at: 1 }).limit(1).next();
    const before = (first?.before as { documents?: Project["documents"] } | undefined)?.documents;
    // The list as it was before any file was copied in, or, failing that, today's list without the copies.
    const documents = (before ?? project.documents).filter((doc) => !doc.storageId);
    try {
      await c.projects.updateOne({ _id: project._id }, { $set: { documents }, $unset: { filesSync: "" }, $inc: { version: 1 } });
      restored.push(project.name);
    } catch {
      failedRestores.push(project.name);
    }
  }
  return { deleted, failedDeletes, restored, failedRestores, remaining: await c.projects.countDocuments({ "documents.storageId": { $exists: true } }) };
}
