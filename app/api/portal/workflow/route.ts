import { collections, transaction } from "@/lib/portal/db";
import { body, failure, json, requirePortalActor } from "@/lib/portal/server";
import {
  actionMembership,
  canRead,
  dateOnly,
  documentUrl,
  hash,
  enumValue,
  isStaff,
  orders,
  payments,
  PortalError,
  text,
} from "@/lib/portal/policy";
import { requestStages, requestTypes, presentationStages } from "@/lib/portal/requests";
import { operationalFields } from "@/lib/portal/project-fields";
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
          paymentDetail: project.paymentDetail,
          order: project.order,
          orderDetail: project.orderDetail,
          install: project.install,
          scopes: project.scopes.map((s) => ({ ...s })),
          request: project.request ? { ...project.request } : null,
        },
        after: null,
      };
      if (action === "submit-request" || action === "update-request") {
        if (action === "update-request" && !staff) throw new PortalError("Only SBD can manage the request pipeline", 403);
        if (action === "submit-request" && project.request) throw new PortalError("This project already has a request. Ask SBD to update its scope.", 409);
        const receivedAt = action === "submit-request" ? new Date().toISOString().slice(0, 10) : dateOnly(data.receivedAt);
        if (!receivedAt) throw new PortalError("Enter the date received");
        const priorRequest = project.request;
        const quoteReferences = action === "submit-request" ? [] : project.request?.quoteReferences || project.scopes.map(s => s.quote);
        project.request = {
          ...priorRequest,
          quoteReferences,
          summary: text(data.summary, "Request summary", 2000),
          type: enumValue(data.type, requestTypes, "Project type"),
          receivedAt,
          stage: staff && action === "update-request" ? enumValue(data.stage, requestStages, "Request stage") : "New Request",
          assignedTo: staff ? text(data.assignedTo, "Assigned to", 200, true) : "",
          presentation: staff && action === "update-request" ? enumValue(data.presentation, presentationStages, "Presentation status") : "Not started",
        };
        if (staff && data.quotedAmount !== undefined && data.quotedAmount !== "") {
          const amount = Number(data.quotedAmount);
          if (!Number.isFinite(amount) || amount < 0 || amount > 1e10) throw new PortalError("Enter a valid quoted amount");
          project.request.quotedAmount = amount;
        }
        event.note = action === "submit-request" ? project.request.summary : text(data.note, "Update note", 2000);
      } else if (action === "add-quote-document") {
        if (!staff) throw new PortalError("Only SBD can attach quote documents", 403);
        const url = documentUrl(data.url);
        const document = { id: hash(url).slice(0, 32), name: text(data.name, "Document name", 300), url, category: "Quotes", historical: false };
        if (project.documents.some(d => d.id === document.id)) throw new PortalError("This document link is already attached", 409);
        if (!note) throw new PortalError("Enter a document note");
        project.documents.push(document);
        event.document = { ...document };
      } else if (action === "add-quote") {
        if (!staff) throw new PortalError("Only SBD can add quotes", 403);
        const quote = text(data.quote, "Quote reference", 100);
        // Serialize quote assignment with imports and other project assignments.
        await c.db.collection<{ _id: string; version: number }>("portalLocks").updateOne(
          { _id: "imports" }, { $inc: { version: 1 } }, { upsert: true, session },
        );
        if (project.scopes.some(s => s.quote === quote) || await c.projects.findOne({ _id: { $ne: id }, "scopes.quote": quote }, { session }))
          throw new PortalError("Quote reference is already in use", 409);
        if (!note || data.confirmStableRevision !== true) throw new PortalError("Confirm the fixed document revision and enter a note");
        const doc = project.documents.find(d => d.id === data.documentId && d.category === "Quotes" && !d.historical);
        if (!doc) throw new PortalError("Select a current quote document");
        project.scopes.push({ code: text(data.code, "Care type", 40), label: text(data.label, "Scope label", 200), quote,
          approval: "Needs Approval", revision: 1, documentId: doc.id, revisionConfirmed: true, changesRequested: false });
        if (project.request?.quoteReferences && !project.request.quoteReferences.includes(quote)) project.request.quoteReferences.push(quote);
        event.quote = quote; event.revision = 1; event.document = { ...doc };
      } else if (
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
          if (project.request?.quoteReferences && !project.request.quoteReferences.includes(scope.quote)) throw new PortalError("SBD must publish this quote for the current request before approval", 409);
          if (scope.changesRequested) throw new PortalError("SBD must address the requested changes before approval", 409);
          const doc = project.documents.find(
            (d) => d.id === scope.documentId && d.category === "Quotes" && !d.historical,
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
          scope.changesRequested = false;
          if (project.request?.quoteReferences && !project.request.quoteReferences.includes(scope.quote)) project.request.quoteReferences.push(scope.quote);
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
            if (!scope.changesRequested && scope.approval !== "Approved") throw new PortalError("This quote is already awaiting approval", 409);
            scope.approval = "Needs Approval";
            scope.changesRequested = false;
            if (project.request?.quoteReferences && !project.request.quoteReferences.includes(scope.quote)) project.request.quoteReferences.push(scope.quote);
          } else {
            if (staff) throw new PortalError("Change requests must come from a client or operator account", 403);
            if (project.request?.quoteReferences && !project.request.quoteReferences.includes(scope.quote)) throw new PortalError("SBD must publish this quote for the current request before approval", 409);
          if (scope.changesRequested) throw new PortalError("Changes have already been requested", 409);
            scope.approval = "Needs Approval";
            scope.changesRequested = true;
          }
        }
      } else if (action === "status") {
        if (!staff || !note)
          throw new PortalError("SBD staff and a reason are required", 403);
        if (data.field === "payment") {
          if (payments.includes(data.value as typeof payments[number])) {
            project.payment = enumValue(data.value, payments, "Payment");
            delete project.paymentDetail;
          } else operationalFields({ paymentDetail: data.value }, project, actor.role === "admin");
        }
        else if (data.field === "order") {
          if (!orders.includes(data.value as typeof orders[number])) {
            operationalFields({ orderDetail: data.value }, project, actor.role === "admin");
          } else {
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
          delete project.orderDetail;
          }
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
        paymentDetail: project.paymentDetail,
        order: project.order,
        orderDetail: project.orderDetail,
        install: project.install,
        scopes: project.scopes,
        operatorApproval: project.operatorApproval,
        request: project.request,
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
