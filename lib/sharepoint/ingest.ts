import { createHash, randomUUID } from "crypto";
import { GridFSBucket } from "mongodb";
import { Readable } from "stream";
import { pipeline } from "stream/promises";
import { collections, transaction } from "../portal/db";
import { PortalError } from "../portal/policy";
import type { Actor, Project } from "../portal/types";
import { importedFile, mergeFiles } from "./files";

export function reviseProject(project: Project, documents: Project["documents"]) {
  const replaced = new Set(project.documents.filter(old => !old.historical && documents.find(doc => doc.id === old.id)?.historical).map(doc => doc.id));
  return project.scopes.map(scope => {
    if (!scope.documentId || !replaced.has(scope.documentId)) return scope;
    return { ...scope, approval: "Needs Approval" as const, revision: scope.revision + 1, documentId: undefined, revisionConfirmed: false };
  });
}

export async function ingestFile(projectId: string, version: unknown, input: Record<string, unknown>, bytes: Buffer, actor: Actor, sourceItemId?: string, sourceETag?: string) {
  if (!bytes.length || bytes.length > 25 * 1024 * 1024) throw new PortalError("File must be between 1 byte and 25 MB");
  if (typeof version !== "number" || !Number.isInteger(version)) throw new PortalError("Project changed. Refresh and review the file again.", 409);
  const file = importedFile(input);
  const extension = file.name.split(".").pop()!.toLowerCase();
  const types: Record<string, string> = { pdf: "application/pdf", png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg", webp: "image/webp" };
  if (extension === "pdf" && !bytes.subarray(0, 1024).includes(Buffer.from("%PDF-"))) throw new PortalError("The selected file is not a PDF");
  const c = await collections();
  const bucket = new GridFSBucket(c.db, { bucketName: "portalFileSnapshots" });
  const upload = bucket.openUploadStream(file.name, { metadata: { projectId, actorId: actor.id } });
  await pipeline(Readable.from([bytes]), upload);
  file.storageId = upload.id.toHexString();
  file.contentHash = createHash("sha256").update(bytes).digest("hex");
  file.size = bytes.length;
  file.contentType = types[extension] || "application/octet-stream";
  file.ingestedAt = new Date().toISOString();
  if (sourceItemId) file.sourceItemId = sourceItemId;
  if (sourceETag) file.sourceETag = sourceETag;
  let retained = false;
  try {
    const result = await transaction(async session => {
      const current = await c.projects.findOne({ _id: projectId, version, archived: false }, { session });
      if (!current) throw new PortalError("Project changed. Refresh and review the file again.", 409);
      if (input.replacesId) {
        const prior = current.documents.find(document => document.id === input.replacesId && !document.historical);
        if (!prior) throw new PortalError("The earlier document changed. Review the version selection again.", 409);
        file.sourceKey = prior.sourceKey || createHash("sha256").update(prior.url).digest("hex");
        // Legacy linked documents acquire a family key without changing their URL or bytes.
        prior.sourceKey = file.sourceKey;
      }
      const merged = mergeFiles(current.documents, [file]);
      if (!merged.added) return { added: 0, version: current.version };
      const scopes = reviseProject(current, merged.documents);
      const saved = await c.projects.updateOne({ _id: projectId, version: current.version }, { $set: { documents: merged.documents, scopes, updatedAt: new Date() }, $inc: { version: 1 } }, { session });
      if (!saved.matchedCount) throw new PortalError("Project changed. Refresh and try again.", 409);
      await c.events.insertOne({ _id: randomUUID(), projectId, action: "files-imported", actorId: actor.id, email: actor.email, at: new Date(), note: `Saved ${file.name} as version ${merged.documents.at(-1)?.revision}`, before: { documents: current.documents, scopes: current.scopes }, after: { documents: merged.documents, scopes } }, { session });
      return { added: 1, version: current.version + 1 };
    });
    retained = result.added > 0;
    return result;
  } finally {
    if (!retained) await bucket.delete(upload.id).catch(() => {});
  }
}
