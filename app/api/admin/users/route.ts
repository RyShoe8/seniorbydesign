import { ObjectId } from "mongodb";
import { getUsersCollection } from "@/lib/db";
import { body, failure, json, requireActor } from "@/lib/portal/server";
import { issueToken, validEmail } from "@/lib/portal/accounts";
import {
  adminEmails,
  emailKey,
  PortalError,
  staffRole,
} from "@/lib/portal/policy";
import { collections } from "@/lib/portal/db";
import { rateLimit } from "@/lib/portal/rate-limit";
export const dynamic = "force-dynamic";
export async function GET() {
  try {
    const actor = await requireActor(true);
    if (actor.role !== "admin")
      throw new PortalError("Administrator required", 403);
    const users = await (
      await getUsersCollection()
    )
      .find({ role: { $in: ["admin", "user", "team"] } })
      .project({ password: 0 })
      .toArray();
    const { db } = await collections();
    const invitations = await db
      .collection("accountTokens")
      .find({ kind: "invite", staff: true, usedAt: { $exists: false } })
      .project({ _id: 0, email: 1, delivery: 1, expiresAt: 1, revoked: 1 })
      .toArray();
    return json({
      users: users.map((u) => ({
        ...u,
        role: staffRole(u as { email: string; role: string }),
      })),
      invitations,
    });
  } catch (error) {
    return failure(error);
  }
}
export async function POST(request: Request) {
  try {
    const actor = await requireActor(true);
    if (actor.role !== "admin")
      throw new PortalError("Administrator required", 403);
    const data = await body(request, 10000),
      email = validEmail(data.email);
    await rateLimit(`staff-invite:${actor.id}`, 20);
    if (data.action === "revoke") {
      const { db } = await collections();
      await db
        .collection("accountTokens")
        .updateMany(
          { email, kind: "invite", staff: true, usedAt: { $exists: false } },
          { $set: { revoked: true } },
        );
    } else
      await issueToken(email, {
        kind: "invite",
        staff: true,
        createdBy: actor.id,
      });
    return json({ success: true });
  } catch (error) {
    return failure(error);
  }
}
export async function PUT(request: Request) {
  try {
    const actor = await requireActor(true);
    if (actor.role !== "admin")
      throw new PortalError("Administrator required", 403);
    const data = await body(request, 10000);
    if (
      typeof data.id !== "string" ||
      !ObjectId.isValid(data.id) ||
      (data.role !== undefined && data.role !== "admin" && data.role !== "team") ||
      (data.disabled !== undefined && typeof data.disabled !== "boolean") ||
      (data.role === undefined && data.disabled === undefined)
    )
      throw new PortalError("Invalid account update");
    const users = await getUsersCollection(),
      user = await users.findOne({ _id: new ObjectId(data.id) });
    if (!user || !staffRole(user))
      throw new PortalError("Staff account not found", 404);
    if (adminEmails.includes(emailKey(user.email)))
      throw new PortalError(
        "Ryan and Glenn's administrator accounts are protected",
      );
    if (actor.id === data.id)
      throw new PortalError("Ask another administrator to change your own access");
    await users.updateOne(
      { _id: user._id },
      {
        $set: {
          ...(typeof data.disabled === "boolean" ? { disabled: data.disabled } : {}),
          ...(data.role ? { role: data.role, adminGranted: data.role === "admin" } : {}),
          updatedAt: new Date(),
        },
        $inc: { sessionVersion: 1 },
      },
    );
    return json({ success: true });
  } catch (error) {
    return failure(error);
  }
}
