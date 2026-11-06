import { body, failure, json, requirePortalActor } from "@/lib/portal/server";
import { PortalError } from "@/lib/portal/policy";
import { connectWebhook, sheetStatus, syncSheet } from "@/lib/smartsheet/sync";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET() {
  try {
    await requirePortalActor(true);
    return json(await sheetStatus());
  } catch (error) {
    return failure(error);
  }
}
export async function POST(request: Request) {
  try {
    const actor = await requirePortalActor(true);
    const data = await body(request, 2000);
    if (data.action === "preview") return json(await syncSheet({ dryRun: true }));
    if (actor.role !== "admin") throw new PortalError("Administrator required", 403);
    if (data.action === "sync") return json(await syncSheet());
    if (data.action === "connect-webhook") {
      await connectWebhook();
      return json({ success: true });
    }
    throw new PortalError("Unknown Smartsheet action");
  } catch (error) {
    return failure(error);
  }
}
