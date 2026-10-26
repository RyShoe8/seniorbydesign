import { randomUUID } from "crypto";
import { collections, transaction } from "./db";
import { hash, parseImport, PortalError } from "./policy";
import type { Actor, Project, Organization } from "./types";

interface Preview {
  _id: string;
  actorId: string;
  createdAt: Date;
  expiresAt: Date;
  committed?: boolean;
  rolledBack?: boolean;
  projects: Project[];
  organizations: Organization[];
  versions: Record<string, number>;
  before?: Record<string, Project | null>;
  warnings: string[];
  changes: {
    name: string;
    action: string;
    company: string;
    operator: string;
  }[];
}
function stable(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stable).join(",")}]`;
  if (value && typeof value === "object")
    return `{${Object.entries(value)
      .filter(([key]) => !["version", "updatedAt"].includes(key))
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, v]) => `${JSON.stringify(key)}:${stable(v)}`)
      .join(",")}}`;
  return JSON.stringify(value);
}
export async function previewImport(input: unknown, actor: Actor) {
  const parsed = parseImport(input),
    c = await collections();
  const preview: Preview = {
    _id: randomUUID(),
    actorId: actor.id,
    createdAt: new Date(),
    expiresAt: new Date(Date.now() + 30 * 60000),
    projects: [],
    organizations: [],
    versions: {},
    warnings: parsed.warnings,
    changes: [],
  };
  const orgs = new Map<string, Organization>();
  for (const row of parsed.projects) {
    for (const [id, name, type] of [
      [row.companyId, row.companyName, "company"],
      [row.operatorId, row.operatorName, "operator"],
    ] as const) {
      const found = await c.organizations.findOne({ _id: id });
      if (found && (found.name !== name || !found.active))
        throw new PortalError(
          `Organization ${id} differs from the uploaded name or is inactive. Resolve it in Organizations before importing.`,
        );
      if (!found)
        orgs.set(id, {
          _id: id,
          name,
          type,
          slug: id.split(":")[1],
          active: true,
          version: 1,
          createdAt: new Date(),
        });
    }
    const id = hash(`${row.companyId}/${row.sourceId}`).slice(0, 32);
    const old = await c.projects.findOne({ _id: id });
    const { companyName, operatorName, ...fields } = row;
    const proposed: Project = {
      ...fields,
      _id: id,
      version: (old?.version || 0) + 1,
      updatedAt: new Date(),
      archived: old?.archived || false,
      operatorApproval: old?.operatorApproval || false,
      workflowTouched: old?.workflowTouched || false,
    };
    if (old) {
      // Retain approved quote associations and all earlier document revisions.
      proposed.documents = [
        ...row.documents,
        ...old.documents
          .filter((d) => !row.documents.some((n) => n.id === d.id))
          .map((d) => ({ ...d, historical: true })),
      ];
      proposed.scopes = row.scopes.map((s) => {
        const prior = old.scopes.find((p) => p.quote === s.quote);
        if (!prior) return s;
        const association = proposed.documents.find(
          (d) => d.id === prior.documentId && !d.historical,
        );
        if (prior.documentId && !association)
          return {
            ...s,
            approval: "Needs Approval",
            revision: prior.revision + 1,
          };
        return {
          ...s,
          revision: prior.revision,
          ...(prior.documentId ? { documentId: prior.documentId } : {}),
          ...(prior.revisionConfirmed !== undefined
            ? { revisionConfirmed: prior.revisionConfirmed }
            : {}),
          approval: old.workflowTouched ? prior.approval : s.approval,
        };
      });
      if (old.workflowTouched) {
        proposed.payment = old.payment;
        proposed.order = old.order;
        proposed.install = old.install;
        for (const scope of old.scopes)
          if (!proposed.scopes.some((s) => s.quote === scope.quote))
            proposed.scopes.push(scope);
        preview.warnings.push(
          `${row.name}: live workflow statuses and quote history retained; imported statuses cannot overwrite them.`,
        );
      }
      if (old.operatorId !== proposed.operatorId) {
        proposed.operatorApproval = false;
        preview.warnings.push(
          `${row.name}: operator reassignment changes access and clears operator approval authority.`,
        );
      }
    }
    for (const scope of proposed.scopes) {
      if (
        await c.projects.findOne({
          _id: { $ne: id },
          "scopes.quote": scope.quote,
        })
      )
        throw new PortalError(
          `Quote ${scope.quote} already belongs to another project`,
        );
    }
    const unchanged = !!old && stable(old) === stable(proposed);
    if (unchanged) proposed.version = old.version;
    preview.versions[id] = old?.version || 0;
    preview.projects.push(proposed);
    preview.changes.push({
      name: row.name,
      action: unchanged
        ? "Unchanged"
        : old
          ? "Update (preserve history)"
          : "Create",
      company: companyName,
      operator: operatorName,
    });
  }
  preview.organizations = [...orgs.values()];
  await c.db.collection<Preview>("portalImports").insertOne(preview);
  return {
    id: preview._id,
    changes: preview.changes,
    warnings: preview.warnings,
    newOrganizations: preview.organizations.map((o) => o.name),
    documents: preview.projects.reduce((n, p) => n + p.documents.length, 0),
  };
}
export async function commitImport(id: string, actor: Actor) {
  const c = await collections();
  return transaction(async (session) => {
    const imports = c.db.collection<Preview>("portalImports");
    const preview = await imports.findOne(
      {
        _id: id,
        actorId: actor.id,
        committed: { $ne: true },
        expiresAt: { $gt: new Date() },
      },
      { session },
    );
    if (!preview)
      throw new PortalError(
        "Preview expired or already committed. Preview the upload again.",
        409,
      );
    // Serialize imports to enforce cross-project quote uniqueness under concurrent commits.
    await c.db
      .collection<{ _id: string; version: number }>("portalLocks")
      .updateOne(
        { _id: "imports" },
        { $inc: { version: 1 } },
        { upsert: true, session },
      );
    for (const org of preview.organizations) {
      const existing = await c.organizations.findOne(
        { _id: org._id },
        { session },
      );
      if (existing && (existing.name !== org.name || !existing.active))
        throw new PortalError("Organizations changed. Preview again.", 409);
      if (!existing) await c.organizations.insertOne(org, { session });
    }
    const before: Record<string, Project | null> = {};
    for (const project of preview.projects) {
      for (const orgId of [project.companyId, project.operatorId])
        if (
          !(await c.organizations.findOne(
            { _id: orgId, active: true },
            { session },
          ))
        )
          throw new PortalError(
            "Organization unavailable. Preview again.",
            409,
          );
      for (const scope of project.scopes)
        if (
          await c.projects.findOne(
            { _id: { $ne: project._id }, "scopes.quote": scope.quote },
            { session },
          )
        )
          throw new PortalError(
            "Quote assignment changed. Preview again.",
            409,
          );
      const old = await c.projects.findOne({ _id: project._id }, { session });
      before[project._id] = old;
      if ((old?.version || 0) !== preview.versions[project._id])
        throw new PortalError(
          "A project changed after preview. Preview again.",
          409,
        );
      if (old && project.version === old.version) continue;
      await c.projects.replaceOne({ _id: project._id }, project, {
        upsert: true,
        session,
      });
      await c.events.insertOne(
        {
          _id: randomUUID(),
          projectId: project._id,
          action: "import",
          actorId: actor.id,
          email: actor.email,
          at: new Date(),
          note: "JSON import committed",
          before: old || null,
          after: project,
        },
        { session },
      );
    }
    await imports.updateOne(
      { _id: id },
      { $set: { committed: true, before } },
      { session },
    );
    return { success: true, projects: preview.projects.length };
  });
}
export async function importHistory() {
  return (await collections()).db
    .collection<Preview>("portalImports")
    .find({ committed: true })
    .sort({ createdAt: -1 })
    .limit(50)
    .project({ _id: 1, createdAt: 1, changes: 1, rolledBack: 1 })
    .toArray();
}
export async function rollbackImport(id: string, actor: Actor) {
  const c = await collections();
  return transaction(async (session) => {
    const imports = c.db.collection<Preview>("portalImports");
    const batch = await imports.findOne(
      { _id: id, committed: true, rolledBack: { $ne: true } },
      { session },
    );
    if (!batch?.before)
      throw new PortalError("Import cannot be rolled back", 409);
    await c.db
      .collection<{ _id: string; version: number }>("portalLocks")
      .updateOne(
        { _id: "imports" },
        { $inc: { version: 1 } },
        { upsert: true, session },
      );
    for (const imported of batch.projects) {
      if (imported.version === batch.versions[imported._id]) continue;
      const current = await c.projects.findOne(
        { _id: imported._id },
        { session },
      );
      if (!current || current.version !== imported.version)
        throw new PortalError(
          "A project changed after this import. Resolve its changes individually; rollback would overwrite later work.",
          409,
        );
      const previous = batch.before[imported._id];
      const restored: Project = previous
        ? { ...previous, version: current.version + 1, updatedAt: new Date() }
        : {
            ...current,
            archived: true,
            version: current.version + 1,
            updatedAt: new Date(),
          };
      await c.projects.replaceOne({ _id: current._id }, restored, { session });
      await c.events.insertOne(
        {
          _id: randomUUID(),
          projectId: current._id,
          action: "import-rollback",
          actorId: actor.id,
          email: actor.email,
          at: new Date(),
          note: "Import rolled back; organization memberships retained",
          before: current,
          after: restored,
        },
        { session },
      );
    }
    await imports.updateOne(
      { _id: id },
      { $set: { rolledBack: true } },
      { session },
    );
    return { success: true };
  });
}
