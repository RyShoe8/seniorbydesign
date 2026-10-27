import type { Project } from "./types";
// SBD's prototype defines these phases independently of approval/payment status.
export const requestStages = ["New Request", "Scoping", "Quote in Progress", "Quote Sent", "Presentation", "Awaiting Approval", "Awaiting Deposit", "Ordering", "Procurement", "Installation Planning", "Installed", "Closed"] as const;
export const requestTypes = ["Remodel", "Model", "New Development"] as const;
export const presentationStages = ["Not started", "Draft", "In preparation", "Draft in review", "In review", "Presented", "Approved"] as const;
export function quoteReady(project: { documents: { id: string; category: string; historical: boolean }[] }, scope: Project["scopes"][number]) {
  return Boolean(scope.revisionConfirmed && scope.documentId && project.documents.some(d => d.id === scope.documentId && d.category === "Quotes" && !d.historical));
}
export function requestStage(project: Pick<Project, "scopes" | "request"> & { documents: { id: string; category: string; historical: boolean }[] }) {
  const scopes = project.request?.quoteReferences ? project.scopes.filter(s => project.request!.quoteReferences!.includes(s.quote)) : project.scopes;
  if (scopes.some(s => s.changesRequested)) return "Changes Requested";
  if (scopes.length && scopes.every(s => s.approval === "Approved")) return "Approved";
  if (scopes.some(s => s.approval !== "Approved" && quoteReady(project, s))) return "Awaiting Approval";
  return project.request?.stage || (scopes.length ? "Quote in Progress" : "New Request");
}

export type WorkflowProject = Pick<Project, "scopes" | "request" | "payment" | "order" | "install"> & { documents: { id: string; category: string; historical: boolean }[] };
export function currentScopes(project: Pick<Project, "scopes" | "request">) {
  const references = project.request?.quoteReferences;
  return references ? project.scopes.filter(scope => references.includes(scope.quote)) : project.scopes;
}
export function approvalState(project: WorkflowProject) {
  const scopes = currentScopes(project);
  if (!scopes.length) return "Not requested";
  if (scopes.some(scope => scope.changesRequested)) return "Revision requested";
  if (scopes.every(scope => scope.approval === "Approved")) return "Approved";
  return "Pending";
}
export function projectPhase(project: WorkflowProject) {
  return project.request?.stage || "Not recorded";
}
export function projectWorkflow(project: WorkflowProject) {
  const phase = project.request?.stage;
  const current = phase ? requestStages.indexOf(phase) : -1;
  const sections = ["quotes", "quotes", "quotes", "quotes", "presentation", "approvals", "payment", "orders", "orders", "orders", "orders", "activity"];
  return requestStages.map((label, index) => ({
    id: sections[index], label,
    state: current < 0 ? "pending" : index < current ? "done" : index === current ? "current" : "pending",
    detail: current === index ? "Current phase" : index < current ? "Earlier phase" : "Upcoming",
  }));
}

export const paymentStages = ["Not invoiced", "Deposit requested", "Deposit received", "Partially paid", "Paid", "Overdue"] as const;
export const orderStages = ["Not ordered", "Awaiting deposit", "POs placed", "Vendor acknowledgments", "In production", "In transit", "Partially received", "Received", "Installed"] as const;
export function paymentLabel(project: Pick<Project, "payment" | "paymentDetail">) { return project.paymentDetail || project.payment; }
export function orderLabel(project: Pick<Project, "order" | "orderDetail">) { return project.orderDetail || project.order; }
export function normalizedPayment(value: string): Project["payment"] {
  return value === "Paid" ? "Paid" : ["Deposit requested", "Deposit received", "Partially paid", "Overdue"].includes(value) ? "Awaiting Payment" : "Awaiting Confirmation";
}
export function normalizedOrder(value: string): Project["order"] {
  return ["Received", "Installed"].includes(value) ? "Delivered" : ["POs placed", "Vendor acknowledgments", "In production", "In transit", "Partially received"].includes(value) ? "Ordered" : "Awaiting Confirmation";
}
