import { randomUUID } from "crypto";
import { collections, transaction } from "@/lib/portal/db";
import { body, failure, json, requirePortalActor } from "@/lib/portal/server";
import { PortalError, text } from "@/lib/portal/policy";
export const dynamic = "force-dynamic";
export async function POST(request: Request) {
  try {
    const actor = await requirePortalActor(true),
      data = await body(request, 20000),
      c = await collections();
    if (data.action === "create") {
      const id = randomUUID();
      const name = text(data.name, "Project name");
      const companyId = text(data.companyId, "Company");
      const operatorId = text(data.operatorId, "Operator");
      const location = text(data.location, "Location");
      const address = text(data.address, "Address", 500);
      const summary = text(data.summary, "Summary", 4000, true);
      await transaction(async (session) => {
        for (const [organizationId, type] of [[companyId, "company"], [operatorId, "operator"]]) {
          if (!(await c.organizations.findOne({ _id: organizationId, type: type as "company" | "operator", active: true }, { session })))
            throw new PortalError(`Choose an active ${type}`);
        }
        const project = {
          _id: id, sourceId: id, name, companyId, operatorId, location, address, summary,
          scopes: [], documents: [], payment: "Awaiting Confirmation" as const,
          order: "Awaiting Confirmation" as const, install: null, version: 1,
          archived: false, operatorApproval: false, workflowTouched: false, updatedAt: new Date(),
        };
        await c.projects.insertOne(project, { session });
        await c.events.insertOne({ _id: randomUUID(), projectId: id, action: "project-created",
          actorId: actor.id, email: actor.email, at: new Date(), note: "Project created", before: null, after: project }, { session });
      });
      return json({ id });
    }
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
