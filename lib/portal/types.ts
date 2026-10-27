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
  fullName?: string;
  position?: string;
  phone?: string;
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
  changesRequested?: boolean;
}
export interface PortalDocument {
  id: string;
  name: string;
  url: string;
  category: string;
  historical: boolean;
}
export interface ProjectRequest {
  quoteReferences?: string[];
  quoteReference?: string;
  contactName?: string;
  contactEmail?: string;
  progressEstimate?: number;
  notes?: string;
  summary: string;
  receivedAt: string;
  type: "Remodel" | "Model" | "New Development";
  stage: "New Request" | "Scoping" | "Quote in Progress" | "Quote Sent" | "Presentation" | "Awaiting Approval" | "Awaiting Deposit" | "Ordering" | "Procurement" | "Installation Planning" | "Installed" | "Closed";
  assignedTo: string;
  presentation: "Not started" | "Draft" | "In preparation" | "Draft in review" | "In review" | "Presented" | "Approved";
  quotedAmount?: number;
}
export interface Project {
  _id: string;
  sourceId: string;
  request?: ProjectRequest;
  companyId: string;
  operatorId: string;
  name: string;
  location: string;
  address: string;
  summary: string;
  scopes: Scope[];
  documents: PortalDocument[];
  paymentDetail?: string;
  orderDetail?: string;
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
  portalAccess?: boolean;
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
