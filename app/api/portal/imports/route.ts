import { body, failure, json, requirePortalActor } from "@/lib/portal/server";
import {
  previewImport,
  commitImport,
  importHistory,
  rollbackImport,
} from "@/lib/portal/imports";
import { PortalError, text } from "@/lib/portal/policy";
export const dynamic = "force-dynamic";
export async function GET() {
  try {
    await requirePortalActor(true);
    return json(await importHistory());
  } catch (error) {
    return failure(error);
  }
}
export async function POST(request: Request) {
  try {
    const actor = await requirePortalActor(true),
      data = await body(request);
    if (data.action === "preview")
      return json(await previewImport(data.data, actor));
    if (data.action === "commit")
      return json(await commitImport(text(data.id, "Preview ID"), actor));
    if (data.action === "rollback")
      return json(await rollbackImport(text(data.id, "Import ID"), actor));
    throw new PortalError("Unknown import action");
  } catch (error) {
    return failure(error);
  }
}
