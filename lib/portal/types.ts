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
  /** Word for word from the sheet's Project Phase dropdown. */
  projectPhase?: string;
  /** Word for word from the sheet's Status column. */
  sheetStatus?: string;
  /** From the sheet's Notes column. Staff only: never sent to client accounts. */
  internalNotes?: string;
  /** From the sheet's Client Notes column. Written for the client, shown in the portal and emailed when it changes. */
  clientNotes?: string;
  contactName?: string;
  contactEmail?: string;
  progressEstimate?: number;
  /** Staff notes typed in the portal. Staff only: never sent to client accounts. */
  notes?: string;
  summary: string;
  receivedAt: string;
  type: "Remodel" | "Model" | "New Development" | "Finish Board" | "Sales Office" | "FFE Presentation" | "Other";
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
  smartsheet?: SmartsheetLink;
  /** What clients were last emailed about: see lib/portal/client-updates.ts. */
  clientNotified?: { stage: string; phase: string; note: string };
  /** Sheet rows for this project's quotes. Read-only reference, rebuilt on every sync. */
  sheetQuoteRows?: SheetQuoteRow[];
}
export interface SheetQuoteRow {
  rowId: number;
  quote: string;
  name: string;
  install?: string;
  projectPhase?: string;
  /** Every cell on the row. Includes internal notes and budgets, so staff only. */
  details: Record<string, string>;
}
/** Links a project to its Smartsheet row. `snapshot` holds the last agreed value of each mapped field. */
export interface SmartsheetLink {
  rowId: number;
  snapshot: Record<string, string | number | boolean | null>;
  /** Every cell on the row, for staff reference. */
  details?: Record<string, string>;
  syncedAt: Date;
  lastError?: string;
}
export interface ImportProject extends Omit<
  Project,
  | "_id"
  | "version"
  | "updatedAt"
  | "smartsheet"
  | "clientNotified"
  | "sheetQuoteRows"
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
