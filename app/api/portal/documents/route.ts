import { NextResponse } from "next/server";
import { collections } from "@/lib/portal/db";
import { failure, requirePortalActor } from "@/lib/portal/server";
import { canRead, documentUrl, PortalError } from "@/lib/portal/policy";
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
