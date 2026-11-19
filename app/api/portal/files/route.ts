import { body, checkOrigin, failure, json, requirePortalActor } from "@/lib/portal/server";
import { collections } from "@/lib/portal/db";
import { PortalError } from "@/lib/portal/policy";
import { ingestFile } from "@/lib/sharepoint/ingest";
import { readSourceFile, scanFolder, sharepointConfigured } from "@/lib/sharepoint/client";
import { syncAllFiles, syncProjectFiles } from "@/lib/sharepoint/auto";
import { purgeFileCopies } from "@/lib/sharepoint/purge";

export const dynamic = "force-dynamic";
export const maxDuration = 60;
export async function GET() {
  try { await requirePortalActor(true); return json({ configured: sharepointConfigured() }); }
  catch (error) { return failure(error); }
}
export async function POST(request: Request) {
  try {
    const actor = await requirePortalActor(true);
    if (actor.role !== "admin") throw new PortalError("Administrator required to publish project files", 403);
    checkOrigin(request);
    const multipart = request.headers.get("content-type")?.startsWith("multipart/form-data");
    let data: Record<string, unknown>, uploaded: File | null = null;
    if (multipart) {
      const reader = request.body?.getReader();
      if (!reader) throw new PortalError("File required");
      const chunks: Uint8Array[] = []; let size = 0;
      while (true) {
        const { done, value } = await reader.read(); if (done) break;
        size += value.byteLength;
        if (size > 4 * 1024 * 1024) { await reader.cancel(); throw new PortalError("Uploads are limited to 4 MB. Import larger files through the Microsoft connection.", 413); }
        chunks.push(value);
      }
      const form = await new Response(Buffer.concat(chunks), { headers: { "Content-Type": request.headers.get("content-type")! } }).formData();
      data = Object.fromEntries(form);
      const file = form.get("file");
      if (!file || typeof file === "string") throw new PortalError("Select the downloaded source file");
      uploaded = file;
      data.version = Number(data.version);
    } else data = await body(request, 10000);
    // Removes every file copy kept in the database; the originals stay in SharePoint.
    if (data.action === "purge-copies") {
      if (data.confirm !== "DELETE COPIES") throw new PortalError("Confirmation required");
      return json(await purgeFileCopies());
    }
    // Checks every synced project at once, from the Smartsheet sync page.
    if (data.action === "sync-all") {
      if (!sharepointConfigured()) throw new PortalError("Automatic file sync needs the Microsoft connection to be set up first", 503);
      try {
        return json(await syncAllFiles({ files: 10, seconds: 40 }));
      } catch (problem) {
        // Administrators see what went wrong, so a failed run can be fixed rather than guessed at.
        if (problem instanceof PortalError) throw problem;
        const detail = problem instanceof Error ? `${problem.name}: ${problem.message}` : String(problem);
        console.error("File sync failed", problem);
        return json({ error: `File sync failed (${detail.replace(/mongodb(\+srv)?:\/\/\S+/gi, "[database]").slice(0, 200)})` }, 500);
      }
    }
    const id = String(data.projectId || "");
    const target = await (await collections()).projects.findOne({ _id: id, archived: false });
    if (!target) throw new PortalError("Active project not found", 404);
    if (data.action === "sync") {
      if (process.env.SHAREPOINT_FILE_SYNC !== "on") throw new PortalError("File sync is paused while file storage is moved out of the database", 503);
      if (!sharepointConfigured()) throw new PortalError("Automatic file sync needs the Microsoft connection to be set up first", 503);
      return json(await syncProjectFiles(target, { files: 10, until: Date.now() + 45000 }));
    }
    if (data.action === "scan") return json({ files: await scanFolder(String(data.folder || "")) });
    if (data.action !== "publish") throw new PortalError("Unknown file action");
    const file = uploaded ? { bytes: Buffer.from(await uploaded.arrayBuffer()), sourceItemId: undefined, eTag: undefined } : await readSourceFile(String(data.url || ""));
    return json(await ingestFile(id, data.version, data, file.bytes, actor, file.sourceItemId, file.eTag));
  } catch (error) { return failure(error); }
}
