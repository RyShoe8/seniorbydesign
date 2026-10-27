import { collections } from "@/lib/portal/db";
import { failure, json, requirePortalActor } from "@/lib/portal/server";
import { isStaff } from "@/lib/portal/policy";
export const dynamic = "force-dynamic";
export async function GET() {
  try {
    const actor = await requirePortalActor(),
      c = await collections(),
      ids = actor.memberships.map((m) => m.organizationId);
    const projects = await c.projects
      .find(
        isStaff(actor)
          ? {}
          : {
              archived: false,
              $or: [{ companyId: { $in: ids } }, { operatorId: { $in: ids } }],
            },
      )
      .sort({ name: 1 })
      .toArray();
    const orgIds = [
      ...new Set(projects.flatMap((p) => [p.companyId, p.operatorId])),
    ];
    const organizations = await c.organizations
      .find({ _id: { $in: orgIds } })
      .project({ _id: 1, name: 1, type: 1 })
      .toArray();
    return json({
      actor,
      projects: projects.map((p) => ({
        ...p,
        request: p.request ? (isStaff(actor) ? p.request : (({ quotedAmount, ...request }) => request)(p.request)) : undefined,
        documents: p.documents.map(({ url, ...d }) => d),
      })),
      organizations,
    });
  } catch (error) {
    return failure(error);
  }
}
