import { ObjectId } from "mongodb";
import { collections } from "@/lib/portal/db";
import { body, failure, json, requirePortalActor } from "@/lib/portal/server";
import { PortalError } from "@/lib/portal/policy";
export const dynamic = "force-dynamic";
export async function GET() {
  try {
    await requirePortalActor(true);
    const { db } = await collections();
    return json(
      await db
        .collection("portalNotifications")
        .find({ state: { $ne: "sent" } })
        .sort({ createdAt: -1 })
        .limit(50)
        .toArray(),
    );
  } catch (e) {
    return failure(e);
  }
}
export async function POST(request: Request) {
  try {
    await requirePortalActor(true);
    const data = await body(request, 10000);
    if (typeof data.id !== "string" || !ObjectId.isValid(data.id))
      throw new PortalError("Invalid notification");
    const { db } = await collections();
    await db
      .collection("portalNotifications")
      .updateOne(
        { _id: new ObjectId(data.id), state: "failed" },
        { $set: { state: "pending" } },
      );
    return json({ success: true });
  } catch (e) {
    return failure(e);
  }
}
