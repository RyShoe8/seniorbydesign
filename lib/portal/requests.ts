import type { Project } from "./types";
export const requestStages = ["New Request", "Scoping", "Quote in Progress", "Quote Sent", "Presentation"] as const;
export const requestTypes = ["Remodel", "Model", "New Development"] as const;
export const presentationStages = ["Not started", "Draft", "In preparation", "In review", "Presented"] as const;
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
