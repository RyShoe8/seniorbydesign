import { randomUUID } from "crypto";
import { collections, transaction } from "@/lib/portal/db";
import { body, failure, json, requireActor } from "@/lib/portal/server";
import { PortalError, text } from "@/lib/portal/policy";
export const dynamic = "force-dynamic";
export async function POST(request: Request) {
  try {
    const actor = await requireActor(true),
      data = await body(request, 20000),
      c = await collections();
    await transaction(async (session) => {
      const p = await c.projects.findOne(
        { _id: text(data.id, "Project ID") },
        { session },
      );
      if (!p) throw new PortalError("Project not found", 404);
      if (p.version !== data.version)
        throw new PortalError("Project changed. Reload before saving.", 409);
      const before = { ...p };
      p.name = text(data.name, "Project name");
      p.location = text(data.location, "Location");
      p.address = text(data.address, "Address", 500);
      p.summary = text(data.summary, "Summary", 4000, true);
      const operatorId = text(data.operatorId, "Operator");
      if (
        !(await c.organizations.findOne(
          { _id: operatorId, type: "operator", active: true },
          { session },
        ))
      )
        throw new PortalError("Choose an active operator");
      if (operatorId !== p.operatorId) p.operatorApproval = false;
      p.operatorId = operatorId;
      if (typeof data.archived !== "boolean")
        throw new PortalError("Archive state required");
      p.archived = data.archived;
      p.version++;
      p.updatedAt = new Date();
      await c.projects.replaceOne({ _id: p._id }, p, { session });
      await c.events.insertOne(
        {
          _id: randomUUID(),
          projectId: p._id,
          action: "project-updated",
          actorId: actor.id,
          email: actor.email,
          at: new Date(),
          note: "Project details updated",
          before,
          after: p,
        },
        { session },
      );
    });
    return json({ success: true });
  } catch (error) {
    return failure(error);
  }
}
