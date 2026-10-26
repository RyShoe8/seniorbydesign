import { timingSafeEqual } from "crypto";
import { collections } from "@/lib/portal/db";
import { json } from "@/lib/portal/server";
import { sendTransactionalEmail } from "@/lib/brevo";
export const dynamic = "force-dynamic";
// Invoke from a scheduler with a dedicated bearer secret; never from the browser.
export async function GET(request: Request) {
  const expected = process.env.PORTAL_NOTIFICATION_SECRET;
  const supplied =
    request.headers.get("authorization")?.replace(/^Bearer /, "") || "";
  if (
    !expected ||
    Buffer.byteLength(supplied) !== Buffer.byteLength(expected) ||
    !timingSafeEqual(Buffer.from(supplied), Buffer.from(expected))
  )
    return json({ error: "Unauthorized" }, 401);
  const recipients = (process.env.PORTAL_NOTIFICATION_EMAILS || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  if (!recipients.length)
    return json({ error: "Configure PORTAL_NOTIFICATION_EMAILS" }, 503);
  const { db } = await collections();
  let sent = 0;
  // Claim first, then send. A crashed delivery stays in sending for staff reconciliation,
  // rather than automatically sending a possibly duplicated commercial notification.
  for (let i = 0; i < 20; i++) {
    const job = await db
      .collection("portalNotifications")
      .findOneAndUpdate(
        { state: "pending" },
        { $set: { state: "sending", attemptedAt: new Date() } },
        { returnDocument: "after" },
      );
    if (!job) break;
    try {
      const origin = process.env.SBD_ADMIN_ORIGIN;
      if (!origin) throw new Error("Missing origin");
      const url = new URL("/admin/portal", origin).href;
      await sendTransactionalEmail(
        recipients.map((email) => ({ email })),
        "SBD portal: project activity",
        "<p>A project has new activity requiring review.</p><p>Sign in to Client Portal management to review the project activity timeline.</p>",
        `A project has new activity. Sign in at ${url}\nProject ID: ${job.projectId}\nEvent: ${job.eventId}`,
      );
      await db
        .collection("portalNotifications")
        .updateOne(
          { _id: job._id },
          { $set: { state: "sent", sentAt: new Date() } },
        );
      sent++;
    } catch {
      await db
        .collection("portalNotifications")
        .updateOne(
          { _id: job._id },
          { $set: { state: "failed", failedAt: new Date() } },
        );
    }
  }
  return json({ sent });
}
