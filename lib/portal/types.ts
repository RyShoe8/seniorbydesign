export type OrganizationType = "company" | "operator";
export type MembershipRole = "admin" | "member";
export interface Organization {
  _id: string;
  type: OrganizationType;
  slug: string;
  name: string;
  active: boolean;
  version: number;
  createdAt: Date;
}
export interface Membership {
  _id: string;
  userId: string;
  organizationId: string;
  role: MembershipRole;
  active: boolean;
  email: string;
}
export interface Scope {
  code: string;
  label: string;
  quote: string;
  approval: "Approved" | "Needs Approval";
  revision: number;
  documentId?: string;
  revisionConfirmed?: boolean;
}
export interface PortalDocument {
  id: string;
  name: string;
  url: string;
  category: string;
  historical: boolean;
}
export interface Project {
  _id: string;
  sourceId: string;
  companyId: string;
  operatorId: string;
  name: string;
  location: string;
  address: string;
  summary: string;
  scopes: Scope[];
  documents: PortalDocument[];
  payment: "Awaiting Confirmation" | "Awaiting Payment" | "Paid";
  order: "Awaiting Confirmation" | "Ordered" | "Delivered";
  install: string | null;
  version: number;
  archived: boolean;
  operatorApproval: boolean;
  workflowTouched: boolean;
  updatedAt: Date;
}
export interface ImportProject extends Omit<
  Project,
  | "_id"
  | "version"
  | "updatedAt"
  | "operatorApproval"
  | "workflowTouched"
  | "archived"
> {
  companyName: string;
  operatorName: string;
}
export interface Actor {
  id: string;
  email: string;
  role?: string;
  memberships: Membership[];
}
export interface WorkflowEvent {
  _id: string;
  projectId: string;
  action: string;
  actorId: string;
  email: string;
  organizationId?: string;
  at: Date;
  note: string;
  before: unknown;
  after: unknown;
  quote?: string;
  revision?: number;
  document?: PortalDocument;
  requestId?: string;
  resolution?: "accepted" | "declined";
  resolvedBy?: string;
}
