import type { Project } from "./types";
// SBD's prototype defines these phases independently of approval/payment status.
export const requestStages = ["New Request", "Scoping", "Quote in Progress", "Quote Sent", "Presentation", "Awaiting Approval", "Awaiting Deposit", "Ordering", "Procurement", "Installation Planning", "Installed", "Closed"] as const;
export const requestTypes = ["Remodel", "Model", "New Development", "Finish Board", "Sales Office", "FFE Presentation", "Other"] as const;
/** The sheet's Project Phase dropdown, word for word. */
export const projectPhases = ["1. Site Visit & Planning", "2. Concept Design", "3. Schematic Design", "4. Design Dev", "5. Contract Doc", "6. In Pricing", "7. Const Admin", "8. Procurement", "9. Project Closeout", "10. Completed"] as const;
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
  const steps = [
    { label: "Request & scope", id: "quotes", from: 0, to: 1 },
    { label: "Quote & design", id: "quotes", from: 2, to: 4 },
    { label: "Client approval", id: "approvals", from: 5, to: 5 },
    { label: "Payment", id: "payment", from: 6, to: 6 },
    { label: "Ordering & delivery", id: "orders", from: 7, to: 8 },
    { label: "Installation & completion", id: "orders", from: 9, to: 11 },
  ];
  return steps.map(step => ({
    id: step.id, label: step.label,
    state: current < 0 ? "pending" : current > step.to ? "done" : current >= step.from ? "current" : "pending",
    detail: current >= step.from && current <= step.to ? `Current stage: ${phase}` : current > step.to ? "Earlier stage" : "Upcoming",
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

// Display guidance explains stored statuses without inferring an unrecorded phase.
export function nextProjectStep(project: WorkflowProject) {
  const scopes = currentScopes(project);
  if (scopes.some(s => s.changesRequested)) return { label: "SBD to revise the quote", section: "approvals" };
  if (scopes.some(s => s.approval !== "Approved" && quoteReady(project, s))) return { label: "Account administrator to review the quote", section: "approvals" };
  if (scopes.some(s => s.approval !== "Approved")) return { label: "SBD to confirm the quote document for review", section: "quotes" };
  if (!project.request?.stage) return { label: "SBD to confirm the project stage", section: "overview" };
  const phase = project.request.stage;
  if (["New Request", "Scoping", "Quote in Progress"].includes(phase)) return { label: "SBD to prepare the scope and quote", section: "quotes" };
  if (["Quote Sent", "Awaiting Approval"].includes(phase)) return { label: "Review quote and approval details", section: "approvals" };
  if (phase === "Presentation") return { label: "Review the design presentation", section: "presentation" };
  if (phase === "Awaiting Deposit") return { label: "Review deposit and payment details", section: "payment" };
  if (["Ordering", "Procurement", "Installation Planning"].includes(phase)) return { label: "Check order progress and installation timing", section: "orders" };
  return { label: "Review project completion and activity", section: "activity" };
}
export type WaitingOn = "sbd" | "client" | "none";
const CLIENT_PHASES = ["Quote Sent", "Presentation", "Awaiting Approval", "Awaiting Deposit"];
/** Who holds the next move, in the words each audience needs. */
export function projectAction(project: WorkflowProject, staff: boolean): { owner: WaitingOn; label: string; cta: string; section: string } {
  const scopes = currentScopes(project);
  const phase = project.request?.stage;
  const says = (owner: WaitingOn, section: string, forStaff: string, forClient: string, cta: string) =>
    ({ owner, section, cta, label: staff ? forStaff : forClient });
  if (scopes.some(s => s.changesRequested)) return says("sbd", "approvals", "Revise the quote: the client asked for changes", "SBD is revising the quote you commented on", staff ? "Revise quote" : "See quote");
  if (scopes.some(s => s.approval !== "Approved" && quoteReady(project, s))) return says("client", "approvals", "Waiting for the client to approve the quote", "Please review and approve your quote", staff ? "See quote" : "Review quote");
  if (scopes.some(s => s.approval !== "Approved")) return says("sbd", "quotes", "Confirm the quote document so the client can approve it", "SBD is finalizing your quote", staff ? "Confirm document" : "See quote");
  if (!phase) return says("sbd", "overview", "Set the project's stage", "SBD is reviewing this project", "Open project");
  if (["Installed", "Closed"].includes(phase)) return says("none", "activity", "Complete. Nothing is needed", "Complete. Nothing is needed from you", "See history");
  if (CLIENT_PHASES.includes(phase)) {
    if (phase === "Awaiting Deposit") return says("client", "payment", "Waiting for the client's deposit", "Your deposit is the next step", "See payment");
    if (phase === "Presentation") return says("client", "presentation", "Waiting for the client to review the presentation", "Please review your design presentation", staff ? "See presentation" : "Review presentation");
    return says("client", "approvals", "Waiting for the client to review the quote", "Please review your quote", staff ? "See quote" : "Review quote");
  }
  if (["New Request", "Scoping", "Quote in Progress"].includes(phase)) return says("sbd", "quotes", "Prepare the scope and quote", "SBD is preparing your quote", staff ? "Work on quote" : "See request");
  return says("sbd", "orders", phase === "Installation Planning" ? "Schedule the installation" : "Keep orders moving and confirm the install date", phase === "Installation Planning" ? "SBD is planning your installation" : "SBD is ordering your furnishings", staff ? "Update order" : "See progress");
}

/** The six stages of a project, used everywhere a project's progress is shown or filtered. */
export const pipelineGroups = [
  { id: "request", label: "Request", stages: ["New Request", "Scoping"] },
  { id: "quote", label: "Quote & design", stages: ["Quote in Progress", "Quote Sent", "Presentation"] },
  { id: "approval", label: "Approval", stages: ["Awaiting Approval"] },
  { id: "payment", label: "Deposit", stages: ["Awaiting Deposit"] },
  { id: "orders", label: "Ordering", stages: ["Ordering", "Procurement"] },
  { id: "install", label: "Install", stages: ["Installation Planning", "Installed", "Closed"] },
] as const;
export function pipelineGroupIndex(project: Pick<Project, "request">) {
  const stage = project.request?.stage;
  return stage ? pipelineGroups.findIndex(group => (group.stages as readonly string[]).includes(stage)) : -1;
}
export function orderStatusText(project: Pick<Project, "order" | "orderDetail">) {
  return orderLabel(project) === "Awaiting Confirmation" ? "Order confirmation pending" : orderLabel(project);
}
export function paymentStatusText(project: Pick<Project, "payment" | "paymentDetail">) {
  return paymentLabel(project) === "Awaiting Confirmation" ? "Payment status to be confirmed" : paymentLabel(project);
}
