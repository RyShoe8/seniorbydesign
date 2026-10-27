import { collections, transaction } from "@/lib/portal/db";
import { body, failure, json, requirePortalActor } from "@/lib/portal/server";
import {
  actionMembership,
  canRead,
  dateOnly,
  enumValue,
  isStaff,
  orders,
  payments,
  PortalError,
  text,
} from "@/lib/portal/policy";
import type { WorkflowEvent } from "@/lib/portal/types";
export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  try {
    const actor = await requirePortalActor(),
      c = await collections(),
      id = new URL(request.url).searchParams.get("project") || "";
    const project = await c.projects.findOne({ _id: id });
    if (!project || !canRead(actor, project))
      throw new PortalError("Project not found", 404);
    const events = await c.events
      .find({ projectId: id })
      .sort({ at: -1 })
      .limit(100)
      .toArray();
    // Never expose raw import snapshots or source URLs through the activity feed.
    return json(
      events.map(
        ({ _id, action, email, at, note, quote, revision, resolution }) => ({
          _id,
          action,
          email,
          at,
          note,
          quote,
          revision,
          resolution,
        }),
      ),
    );
  } catch (error) {
    return failure(error);
  }
}
export async function POST(request: Request) {
  try {
    const actor = await requirePortalActor(),
      data = await body(request, 20000),
      c = await collections();
    const id = text(data.projectId, "Project"),
      action = text(data.action, "Action"),
      eventId = text(data.eventId, "Request ID", 100);
    if (!/^[a-f0-9-]{36}$/.test(eventId))
      throw new PortalError("Invalid request ID");
    const result = await transaction(async (session) => {
      const prior = await c.events.findOne({ _id: eventId }, { session });
      if (prior) {
        if (
          prior.actorId !== actor.id ||
          prior.projectId !== id ||
          prior.action !== action
        )
          throw new PortalError("Request ID already used", 409);
        return { success: true };
      }
      const project = await c.projects.findOne({ _id: id }, { session });
      if (!project || !canRead(actor, project))
        throw new PortalError("Project not found", 404);
      if (project.version !== data.version)
        throw new PortalError(
          "Project changed. Refresh before continuing.",
          409,
        );
      const staff = isStaff(actor),
        membership = actionMembership(actor, project, action === "approve");
      if (!staff && !membership)
        throw new PortalError("Account administrator permission required", 403);
      const note = text(data.note, "Note", 2000, true);
      const event: WorkflowEvent = {
        _id: eventId,
        projectId: id,
        action,
        actorId: actor.id,
        email: actor.email,
        ...(membership ? { organizationId: membership.organizationId } : {}),
        at: new Date(),
        note,
        before: {
          payment: project.payment,
          order: project.order,
          install: project.install,
          scopes: project.scopes.map((s) => ({ ...s })),
        },
        after: null,
      };
      if (
        ["approve", "request-changes", "reopen", "bind-quote"].includes(action)
      ) {
        const scope = project.scopes.find((s) => s.quote === data.quote);
        if (!scope) throw new PortalError("Quote not found");
        event.quote = scope.quote;
        event.revision = scope.revision;
        if (action === "approve") {
          if (staff)
            throw new PortalError(
              "Approval must be submitted by an authorized client/operator account",
            );
          if (scope.approval === "Approved")
            throw new PortalError("This revision is already approved", 409);
          const doc = project.documents.find(
            (d) => d.id === scope.documentId && !d.historical,
          );
          if (
            !doc ||
            !scope.revisionConfirmed ||
            scope.revision !== data.revision
          )
            throw new PortalError(
              "A confirmed current document revision is required",
              409,
            );
          scope.approval = "Approved";
          event.document = { ...doc };
          event.note = "Approved the identified quote and document revision.";
        } else if (action === "bind-quote") {
          if (!staff || data.confirmStableRevision !== true || !note)
            throw new PortalError(
              "SBD must confirm an immutable document revision and supply a note",
              403,
            );
          const doc = project.documents.find(
            (d) =>
              d.id === data.documentId &&
              d.category === "Quotes" &&
              !d.historical,
          );
          if (!doc) throw new PortalError("Select a current quote document");
          if (scope.documentId === doc.id && scope.revisionConfirmed)
            throw new PortalError("This document is already associated");
          scope.documentId = doc.id;
          scope.revision += 1;
          scope.revisionConfirmed = true;
          scope.approval = "Needs Approval";
          event.revision = scope.revision;
          event.document = { ...doc };
        } else {
          if (!note) throw new PortalError("Enter a reason");
          if (action === "reopen") {
            if (!staff)
              throw new PortalError(
                "Only SBD can reopen an approved quote",
                403,
              );
            scope.approval = "Needs Approval";
          }
        }
      } else if (action === "status") {
        if (!staff || !note)
          throw new PortalError("SBD staff and a reason are required", 403);
        if (data.field === "payment")
          project.payment = enumValue(data.value, payments, "Payment");
        else if (data.field === "order") {
          const order = enumValue(data.value, orders, "Order");
          if (
            order === "Ordered" &&
            project.scopes.some((s) => s.approval !== "Approved") &&
            actor.role !== "admin"
          )
            throw new PortalError(
              "All current quotes must be approved before ordering",
            );
          if (
            order === "Delivered" &&
            project.order !== "Ordered" &&
            actor.role !== "admin"
          )
            throw new PortalError(
              "Record the order before confirming delivery",
            );
          project.order = order;
        } else if (data.field === "install")
          project.install = dateOnly(data.value);
        else throw new PortalError("Unknown status field");
      } else if (action === "operator-authority") {
        if (!staff || typeof data.value !== "boolean" || !note)
          throw new PortalError(
            "SBD staff, permission value, and a reason are required",
            403,
          );
        project.operatorApproval = data.value;
      } else if (
        [
          "report-payment",
          "report-delivery",
          "delivery-issue",
          "request-install",
        ].includes(action)
      ) {
        if (!note)
          throw new PortalError(
            "Enter the date, reference, and details of your request",
          );
        if (action === "request-install") {
          const requestedDate = dateOnly(data.value);
          if (!requestedDate)
            throw new PortalError("Enter the requested installation date");
          event.after = { requestedDate };
        }
      } else if (action === "resolve-report") {
        if (!staff || !note)
          throw new PortalError("SBD staff and a response are required", 403);
        const report = await c.events.findOne(
          {
            _id: String(data.requestId),
            projectId: id,
            action: {
              $in: [
                "report-payment",
                "report-delivery",
                "delivery-issue",
                "request-install",
                "request-changes",
              ],
            },
            resolution: { $exists: false },
          },
          { session },
        );
        if (!report) throw new PortalError("Open report not found");
        const resolution = enumValue(
          data.resolution,
          ["accepted", "declined"] as const,
          "Resolution",
        );
        await c.events.updateOne(
          { _id: report._id },
          { $set: { resolution, resolvedBy: actor.id } },
          { session },
        );
        event.requestId = report._id;
        event.resolution = resolution;
        // Resolution and official status are deliberately separate actions, both visible in history.
      } else throw new PortalError("Unknown workflow action");
      project.version++;
      project.workflowTouched = true;
      project.updatedAt = new Date();
      event.after = event.after || {
        payment: project.payment,
        order: project.order,
        install: project.install,
        scopes: project.scopes,
        operatorApproval: project.operatorApproval,
      };
      await c.projects.replaceOne(
        { _id: id, version: Number(data.version) },
        project,
        { session },
      );
      await c.events.insertOne(event, { session });
      await c.db.collection("portalNotifications").insertOne(
        {
          eventId,
          projectId: id,
          action,
          state: "pending",
          createdAt: new Date(),
        },
        { session },
      );
      return { success: true };
    });
    return json(result);
  } catch (error) {
    return failure(error);
  }
}
