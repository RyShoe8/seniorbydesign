import type { Project, ProjectRequest } from "./types";
import { dateOnly, enumValue, PortalError, text } from "./policy";
import { requestStages, requestTypes, presentationStages, paymentStages, orderStages, normalizedPayment, normalizedOrder } from "./requests";

export function requestFields(data: Record<string, unknown>, prior?: ProjectRequest): ProjectRequest {
  const receivedAt = dateOnly(data.receivedAt);
  if (!receivedAt) throw new PortalError("Enter the request date");
  const contactEmail = text(data.contactEmail ?? prior?.contactEmail ?? "", "Contact email", 320, true);
  if (contactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail)) throw new PortalError("Enter a valid contact email");
  const progressEstimate = Number(data.progressEstimate ?? prior?.progressEstimate ?? 0);
  if (!Number.isFinite(progressEstimate) || progressEstimate < 0 || progressEstimate > 100) throw new PortalError("Progress estimate must be between 0 and 100");
  const request: ProjectRequest = {
    ...prior,
    summary: text(data.requestSummary ?? data.summary, "Request / scope", 2000), receivedAt,
    type: enumValue(data.type, requestTypes, "Project type"),
    stage: enumValue(data.stage, requestStages, "Current stage"),
    presentation: enumValue(data.presentation, presentationStages, "Presentation"),
    assignedTo: text(data.assignedTo, "SBD owner", 200, true),
    quoteReference: text(data.quoteReference ?? prior?.quoteReference ?? "", "Quote reference", 100, true),
    contactName: text(data.contactName ?? prior?.contactName ?? "", "Client contact", 200, true), contactEmail, progressEstimate,
    notes: text(data.notes ?? prior?.notes ?? "", "Notes", 2000, true),
  };
  if (data.quotedAmount !== undefined) {
    if (data.quotedAmount === "") delete request.quotedAmount;
    else {
      const quotedAmount = Number(data.quotedAmount);
      if (!Number.isFinite(quotedAmount) || quotedAmount < 0 || quotedAmount > 1e10) throw new PortalError("Enter a valid quoted amount");
      request.quotedAmount = quotedAmount;
    }
  }
  return request;
}
export function operationalFields(data: Record<string, unknown>, project: Project, admin: boolean) {
  if (data.paymentDetail !== undefined) {
    const detail = enumValue(data.paymentDetail, [...paymentStages, "Awaiting Confirmation", "Awaiting Payment"], "Payment");
    project.payment = detail === "Awaiting Payment" ? detail : normalizedPayment(detail);
    project.paymentDetail = detail;
  }
  if (data.orderDetail !== undefined) {
    const detail = enumValue(data.orderDetail, [...orderStages, "Awaiting Confirmation", "Ordered", "Delivered"], "Order");
    const order = detail === "Ordered" || detail === "Delivered" ? detail : normalizedOrder(detail);
    const relevant = project.request?.quoteReferences ? project.scopes.filter(scope => project.request!.quoteReferences!.includes(scope.quote)) : project.scopes;
    if (!admin && order !== "Awaiting Confirmation" && detail !== (project.orderDetail || project.order) && (!relevant.length || relevant.some(scope => scope.approval !== "Approved" || scope.changesRequested))) throw new PortalError("Current quotes must be approved before recording orders");
    if (!admin && order === "Delivered" && project.order !== "Ordered" && project.order !== "Delivered") throw new PortalError("Record the order before confirming delivery");
    project.order = order; project.orderDetail = detail;
  }
  if (data.install !== undefined) project.install = dateOnly(data.install);
}
