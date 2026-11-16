import { NextResponse } from "next/server";
import { collections } from "@/lib/portal/db";
import { failure, requirePortalActor } from "@/lib/portal/server";
import { canRead, documentUrl, PortalError } from "@/lib/portal/policy";
import { GridFSBucket, ObjectId } from "mongodb";
import { Readable } from "stream";
export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  try {
    const actor = await requirePortalActor(),
      c = await collections(),
      params = new URL(request.url).searchParams;
    const project = await c.projects.findOne({
      _id: params.get("project") || "",
    });
    if (!project || !canRead(actor, project))
      throw new PortalError("Document not found", 404);
    const doc = project.documents.find((d) => d.id === params.get("document"));
    if (!doc) throw new PortalError("Document not found", 404);
    if (doc.storageId) {
      if (!ObjectId.isValid(doc.storageId)) throw new PortalError("Document snapshot unavailable", 404);
      const bucket = new GridFSBucket(c.db, { bucketName: "portalFileSnapshots" });
      const id = new ObjectId(doc.storageId);
      const stored = await bucket.find({ _id: id, "metadata.projectId": project._id }).next();
      if (!stored) throw new PortalError("Document snapshot unavailable", 404);
      return new Response(Readable.toWeb(bucket.openDownloadStream(id)) as ReadableStream, {
        headers: {
          "Content-Type": doc.contentType || "application/octet-stream",
          "Content-Length": String(stored.length),
          "Content-Disposition": `${doc.contentType === "application/pdf" ? "inline" : "attachment"}; filename*=UTF-8''${encodeURIComponent(doc.name)}`,
          "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff",
          "Content-Security-Policy": "sandbox", "X-Robots-Tag": "noindex, nofollow",
        },
      });
    }
    return NextResponse.redirect(documentUrl(doc.url), {
      status: 302,
      headers: {
        "Cache-Control": "private, no-store",
        "Referrer-Policy": "no-referrer",
        "X-Robots-Tag": "noindex, nofollow",
      },
    });
  } catch (error) {
    return failure(error);
  }
}
