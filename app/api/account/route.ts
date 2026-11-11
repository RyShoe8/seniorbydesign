import bcrypt from "bcryptjs";
import { ObjectId } from "mongodb";
import {
  currentActor,
  body,
  failure,
  json,
  requireActor,
} from "@/lib/portal/server";
import {
  acceptToken,
  issueToken,
  validEmail,
  passwordValue,
} from "@/lib/portal/accounts";
import { rateLimit } from "@/lib/portal/rate-limit";
import { getUsersCollection } from "@/lib/db";
import { PortalError, staffRole, text } from "@/lib/portal/policy";
export const dynamic = "force-dynamic";
export async function POST(request: Request) {
  try {
    const data = await body(request, 10000);
    if (data.action === "inspect") {
      const { collections } = await import("@/lib/portal/db");
      const { hash } = await import("@/lib/portal/policy");
      const token = String(data.token || "");
      if (!/^[a-f0-9]{64}$/.test(token)) throw new PortalError("Invalid or expired link");
      await rateLimit(`inspect:${hash(token)}`, 30);
      const { db } = await collections();
      const entry = await db.collection<{ _id: string; kind: string; revoked?: boolean; usedAt?: Date; expiresAt: Date }>("accountTokens").findOne({ _id: hash(token), revoked: { $ne: true }, usedAt: { $exists: false }, expiresAt: { $gt: new Date() } });
      if (!entry) throw new PortalError("Invalid or expired link");
      return json({ invitation: entry.kind === "invite" });
    }
    if (data.action === "reset") {
      const email = validEmail(data.email);
      await rateLimit(`reset:${email}`, 3);
      const users = await (
        await getUsersCollection()
      )
        .find({
          $expr: { $eq: [{ $toLower: "$email" }, email] },
          disabled: { $ne: true },
        })
        .limit(2)
        .toArray();
      if (users.length === 1) {
        try {
          await issueToken(email, {
            kind: "reset",
            createdBy: "password-reset",
            staff: !!staffRole(users[0]),
          });
        } catch {
          /* Identical public response; delivery state is retained for staff. */
        }
      }
      return json({
        message:
          "If an active account exists, you will receive a password reset email.",
      });
    }
    if (data.action === "accept") {
      await rateLimit(`token:${String(data.token).slice(0, 64)}`, 10);
      return json(
        await acceptToken(
          String(data.token),
          data.password,
          await currentActor(),
          { fullName: data.fullName, position: data.position, phone: data.phone },
        ),
      );
    }
    if (data.action === "change-password") {
      const actor = await requireActor();
      await rateLimit(`change:${actor.id}`, 5);
      const users = await getUsersCollection(),
        user = await users.findOne({ _id: new ObjectId(actor.id) });
      if (
        !user ||
        typeof data.currentPassword !== "string" ||
        !(await bcrypt.compare(data.currentPassword, user.password))
      )
        throw new PortalError("Current password is incorrect");
      await users.updateOne(
        { _id: user._id },
        {
          $set: {
            password: await bcrypt.hash(passwordValue(data.password), 12),
            updatedAt: new Date(),
          },
          $inc: { sessionVersion: 1 },
        },
      );
      return json({ message: "Password changed. Please sign in again." });
    }
    if (data.action === "me") {
      const actor = await requireActor();
      const user = await (await getUsersCollection()).findOne({ _id: new ObjectId(actor.id) });
      if (!user) throw new PortalError("Please sign in", 401);
      return json({ email: user.email, fullName: user.fullName || "", position: user.position || "", phone: user.phone || "", staff: !!staffRole(user) });
    }
    if (data.action === "update-profile") {
      const actor = await requireActor();
      await rateLimit(`profile:${actor.id}`, 20);
      const profile = {
        fullName: text(data.fullName, "Full name", 150),
        position: text(data.position ?? "", "Position", 150, true),
        phone: text(data.phone ?? "", "Phone", 50, true),
      };
      await (await getUsersCollection()).updateOne({ _id: new ObjectId(actor.id) }, { $set: { ...profile, updatedAt: new Date() } });
      const { memberships } = await import("@/lib/portal/db").then((m) => m.collections());
      await memberships.updateMany({ userId: actor.id }, { $set: profile });
      return json({ message: "Your details are saved." });
    }
    if (data.action === "change-email") {
      const actor = await requireActor();
      await rateLimit(`email:${actor.id}`, 5);
      const email = validEmail(data.email);
      const users = await getUsersCollection(),
        user = await users.findOne({ _id: new ObjectId(actor.id) });
      if (
        !user ||
        typeof data.currentPassword !== "string" ||
        !(await bcrypt.compare(data.currentPassword, user.password))
      )
        throw new PortalError("Current password is incorrect");
      if (email === user.email.toLowerCase()) throw new PortalError("That is already your email address");
      const taken = await users.findOne({ _id: { $ne: user._id }, $expr: { $eq: [{ $toLower: "$email" }, email] } });
      if (taken) throw new PortalError("Another account already uses that email address", 409);
      await users.updateOne(
        { _id: user._id },
        { $set: { email, updatedAt: new Date() }, $inc: { sessionVersion: 1 } },
      );
      const { memberships } = await import("@/lib/portal/db").then((m) => m.collections());
      await memberships.updateMany({ userId: actor.id }, { $set: { email } });
      return json({ message: "Email changed. Please sign in again with your new email." });
    }
    throw new PortalError("Unknown account action");
  } catch (error) {
    return failure(error);
  }
}
