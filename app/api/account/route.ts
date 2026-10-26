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
import { PortalError, staffRole } from "@/lib/portal/policy";
export const dynamic = "force-dynamic";
export async function POST(request: Request) {
  try {
    const data = await body(request, 10000);
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
    throw new PortalError("Unknown account action");
  } catch (error) {
    return failure(error);
  }
}
