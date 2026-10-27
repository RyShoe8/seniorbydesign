import { collections, transaction } from "@/lib/portal/db";
import { body, failure, json, requirePortalActor } from "@/lib/portal/server";
import {
  canManageOrganization,
  issueToken,
  validEmail,
} from "@/lib/portal/accounts";
import {
  isStaff,
  PortalError,
  slug,
  text,
  enumValue,
} from "@/lib/portal/policy";
import { rateLimit } from "@/lib/portal/rate-limit";
export const dynamic = "force-dynamic";
export async function GET() {
  try {
    const actor = await requirePortalActor(),
      c = await collections();
    const organizations = await c.organizations
      .find(
        isStaff(actor)
          ? {}
          : {
              _id: { $in: actor.memberships.map((m) => m.organizationId) },
              active: true,
            },
      )
      .sort({ name: 1 })
      .toArray();
    const manageable = organizations.filter(
      (o) =>
        isStaff(actor) ||
        actor.memberships.some(
          (m) => m.organizationId === o._id && m.role === "admin",
        ),
    );
    const members = await c.memberships
      .find({ organizationId: { $in: manageable.map((o) => o._id) } })
      .toArray();
    const invitations = await c.db
      .collection("accountTokens")
      .find({
        kind: "invite",
        organizationId: { $in: manageable.map((o) => o._id) },
        usedAt: { $exists: false },
      })
      .project({
        _id: 0,
        email: 1,
        organizationId: 1,
        role: 1,
        delivery: 1,
        expiresAt: 1,
        revoked: 1,
      })
      .toArray();
    return json({ organizations, members, invitations, actor });
  } catch (error) {
    return failure(error);
  }
}
export async function POST(request: Request) {
  try {
    const actor = await requirePortalActor(),
      data = await body(request, 20000),
      c = await collections();
    if (data.action === "create") {
      if (!isStaff(actor)) throw new PortalError("SBD staff required", 403);
      const type = enumValue(
          data.type,
          ["company", "operator"] as const,
          "Organization type",
        ),
        key = slug(data.slug, "Organization slug");
      const org = {
        _id: `${type}:${key}`,
        type,
        slug: key,
        name: text(data.name, "Organization name"),
        active: true,
        version: 1,
        createdAt: new Date(),
      };
      if (await c.organizations.findOne({ _id: org._id }))
        throw new PortalError("This organization slug already exists", 409);
      await c.organizations.insertOne(org);
      return json({ success: true });
    }
    const id = text(data.organizationId, "Organization");
    await canManageOrganization(actor, id);
    if (data.action === "rename") {
      if (!isStaff(actor)) throw new PortalError("SBD staff required", 403);
      await c.organizations.updateOne(
        { _id: id },
        {
          $set: { name: text(data.name, "Organization name") },
          $inc: { version: 1 },
        },
      );
      return json({ success: true });
    }
    if (data.action === "invite" || data.action === "revoke-invite") {
      const email = validEmail(data.email);
      await rateLimit(`invite:${actor.id}`, 30);
      if (data.action === "revoke-invite") {
        await c.db
          .collection("accountTokens")
          .updateMany(
            {
              email,
              organizationId: id,
              kind: "invite",
              usedAt: { $exists: false },
            },
            { $set: { revoked: true } },
          );
        return json({ success: true });
      }
      const hasAdmin = await c.memberships.findOne({
        organizationId: id,
        role: "admin",
        active: true,
      });
      const role =
        !hasAdmin && isStaff(actor)
          ? "admin"
          : enumValue(data.role, ["admin", "member"] as const, "Role");
      await issueToken(email, {
        kind: "invite",
        organizationId: id,
        role,
        createdBy: actor.id,
      });
      return json({ success: true });
    }
    if (data.action === "membership") {
      const memberId = text(data.memberId, "Membership ID"),
        role = enumValue(data.role, ["admin", "member"] as const, "Role");
      if (typeof data.active !== "boolean")
        throw new PortalError("Active status required");
      const active = data.active;
      await transaction(async (session) => {
        await c.organizations.updateOne(
          { _id: id },
          { $inc: { version: 1 } },
          { session },
        );
        const member = await c.memberships.findOne(
          { _id: memberId, organizationId: id },
          { session },
        );
        if (!member) throw new PortalError("Membership not found", 404);
        if (
          member.role === "admin" &&
          member.active &&
          (!active || role !== "admin") &&
          (await c.memberships.countDocuments(
            { organizationId: id, role: "admin", active: true },
            { session },
          )) <= 1
        )
          throw new PortalError(
            "Keep at least one active account administrator",
          );
        await c.memberships.updateOne(
          { _id: memberId },
          { $set: { role, active } },
          { session },
        );
        await c.db
          .collection("portalAudit")
          .insertOne(
            {
              actorId: actor.id,
              action: "membership",
              memberId,
              role,
              active,
              at: new Date(),
            },
            { session },
          );
      });
      return json({ success: true });
    }
    throw new PortalError("Unknown organization action");
  } catch (error) {
    return failure(error);
  }
}
