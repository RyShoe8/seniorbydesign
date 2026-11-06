import { dateOnly, PortalError } from "../portal/policy";
import { normalizedPayment, paymentLabel, projectPhases, requestTypes } from "../portal/requests";
import type { Project, ProjectRequest } from "../portal/types";

export type SyncValue = string | number | boolean | null;
export interface SheetColumn {
  id: number;
  title: string;
  type?: string;
  options?: string[];
  formula?: string;
  systemColumnType?: string;
  locked?: boolean;
}
export interface SheetCell { columnId: number; value?: unknown; displayValue?: string; formula?: string }
export interface SheetRow { id: number; cells: SheetCell[] }
export interface CellWrite { columnId: number; value: string | number | boolean; strict: false }
export interface MapContext {
  orgName(id: string): string | null;
  /** Returns the organization's id; a name not yet in the portal gets a new one. */
  orgId(name: string, type: "company" | "operator"): string;
}

const normalizeTitle = (title: string) => title.toLowerCase().replace(/[^a-z0-9%#]+/g, " ").trim();

// ---- The sheet's Status column ----------------------------------------------
type Stage = ProjectRequest["stage"];
/**
 * Status says where the job stands commercially. Values with no meaning for the
 * portal's stage (Active, RUSH, On Hold) leave the stage as it is.
 */
const STATUS_STAGES: Record<string, Stage> = {
  prospect: "New Request", "not started": "New Request", "ntq need to quote": "Scoping", quoting: "Quote in Progress",
  "ffe pres": "Presentation", "awaiting approval": "Awaiting Approval", approved: "Ordering", "invoiced np": "Awaiting Deposit",
  paid: "Procurement", installed: "Installed", completed: "Closed", cancelled: "Closed",
};
export const stageFromStatus = (status: string): Stage | null => STATUS_STAGES[normalizeTitle(status)] ?? null;
const STATUS_PAYMENTS: Record<string, string> = { "invoiced np": "Deposit requested", paid: "Paid" };

/** Sheet multi-select values, reduced to the portal's single project type. */
function projectType(value: string): (typeof requestTypes)[number] {
  const picks = value.split(",").map((part) => normalizeTitle(part));
  const table: [string, (typeof requestTypes)[number]][] = [
    ["new build", "New Development"], ["remodel", "Remodel"], ["model", "Model"], ["sales office", "Sales Office"],
    ["finish board", "Finish Board"], ["ffe pres", "FFE Presentation"],
  ];
  return table.find(([label]) => picks.includes(label))?.[1] ?? "Other";
}

// ---- Field map --------------------------------------------------------------
function requestOf(project: Project): ProjectRequest {
  project.request ??= {
    summary: project.summary || project.name,
    receivedAt: new Date().toISOString().slice(0, 10),
    type: "Remodel",
    stage: "New Request",
    assignedTo: "",
    presentation: "Not started",
    quoteReferences: project.scopes.map((scope) => scope.quote),
  };
  return project.request;
}
const required = (value: SyncValue, label: string) => {
  if (value === null || value === "") throw new PortalError(`${label} cannot be blank`);
  return String(value);
};
const asText = (max: number, label: string) => (value: SyncValue) => {
  const textValue = value === null ? null : String(value).trim();
  if (textValue && textValue.length > max) throw new PortalError(`${label} is longer than ${max} characters`);
  return textValue || null;
};
const asDate = (value: SyncValue) => {
  if (value === null || value === "") return null;
  const raw = String(value).trim();
  return dateOnly(/^\d{4}-\d{2}-\d{2}T/.test(raw) ? raw.slice(0, 10) : raw);
};
const asNumber = (label: string, max: number) => (value: SyncValue) => {
  if (value === null || value === "") return null;
  const number = typeof value === "number" ? value : Number(String(value).replace(/[$,%\s]/g, ""));
  if (!Number.isFinite(number) || number < 0 || number > max) throw new PortalError(`${label} is not a valid number`);
  return number;
};
/** "002-Experience Senior Living" -> "Experience Senior Living" */
export const ownerName = (value: string) => value.replace(/^\s*\d+\s*-\s*/, "").trim();

export interface MappedField {
  key: string;
  label: string;
  columns: string[];
  /** Sheet to portal only. Used where a portal edit must not reach the cell: automations, lossy values, contacts. */
  pullOnly?: boolean;
  /** Reads several cells as one value, for example City and State. */
  fromRow?(row: SheetRow, columns: SheetColumn[]): SyncValue;
  /** The value the portal holds, in canonical form. */
  read(project: Project, ctx: MapContext): SyncValue;
  /** Validates a cell into canonical form; throws a PortalError when it cannot be accepted. */
  parse(value: SyncValue): SyncValue;
  write(project: Project, value: SyncValue, ctx: MapContext): void;
  format?(value: SyncValue, column: SheetColumn): string | number | boolean;
}

function requestField(
  key: keyof ProjectRequest & string, label: string, columns: string[], parse: (value: SyncValue) => SyncValue, pullOnly = false,
): MappedField {
  return {
    key: `request.${key}`, label, columns, parse, pullOnly,
    read: (project) => {
      const value = project.request?.[key] as SyncValue | undefined;
      return value === undefined || value === "" ? null : value;
    },
    write: (project, value) => { (requestOf(project) as unknown as Record<string, unknown>)[key] = value ?? ""; },
  };
}

/**
 * Columns on the "Active Projects" sheet that drive portal fields. Every other
 * column is kept as read-only reference for staff (see rowDetails).
 *
 * Quote approvals and documents stay portal-only on purpose: they are revision-bound client decisions.
 * The sheet's Notes hold candid internal comments, so they go to a staff-only field.
 */
export const FIELD_MAP: MappedField[] = [
  {
    key: "name", label: "Project name", columns: ["Community Name"], parse: asText(300, "Project name"),
    read: (project) => project.name || null,
    write: (project, value) => { project.name = required(value, "Project name"); },
  },
  {
    key: "company", label: "Company", columns: ["Owner Group"], pullOnly: true,
    parse: (value) => (value === null ? null : ownerName(String(value)) || null),
    read: (project, ctx) => (project.companyId ? ctx.orgName(project.companyId) : null),
    write: (project, value, ctx) => {
      const name = required(value, "Owner Group");
      const id = ctx.orgId(name, "company");
      if (project.companyId && project.companyId !== id) throw new PortalError("Company can only be changed in the portal");
      project.companyId = id;
      // The sheet has no operator column; each company starts as its own operator, changeable in the portal.
      project.operatorId ||= ctx.orgId(name, "operator");
    },
  },
  {
    key: "location", label: "Location", columns: ["City", "State"], pullOnly: true, parse: asText(300, "Location"),
    fromRow: (row, columns) => [cellValue(row, findColumn(columns, ["City"])), cellValue(row, findColumn(columns, ["State"]))].filter(Boolean).join(", ") || null,
    read: (project) => project.location || null,
    write: (project, value) => { if (value !== null) project.location = String(value); },
  },
  {
    key: "address", label: "Address", columns: ["Address"], pullOnly: true,
    parse: (value) => { const address = asText(500, "Address")(value); return typeof address === "string" && /^no street address/i.test(address) ? null : address; },
    read: (project) => project.address || null,
    write: (project, value) => { if (value !== null) project.address = String(value); },
  },
  {
    key: "summary", label: "Portal summary", columns: ["Portal Summary"], parse: asText(4000, "Portal summary"),
    read: (project) => project.summary || null,
    write: (project, value) => { project.summary = String(value ?? ""); },
  },
  {
    key: "archived", label: "Portal visible", columns: ["Portal Visible"], pullOnly: true,
    // Unticking hides the project from clients; it is not deleted and ticking brings it back.
    parse: (value) => !isSyncTicked(value),
    read: (project) => project.archived,
    write: (project, value) => { project.archived = value === true; },
  },
  // The "current state" the portal shows, kept word for word with the sheet's Project Phase dropdown.
  {
    key: "request.projectPhase", label: "Project phase", columns: ["Project Phase"],
    parse: (value) => {
      if (value === null || value === "") return null;
      const match = projectPhases.find((phase) => normalizeTitle(phase) === normalizeTitle(String(value)));
      if (!match) throw new PortalError(`Project Phase "${value}" is not one of the sheet's phases`);
      return match;
    },
    read: (project) => project.request?.projectPhase ?? null,
    write: (project, value) => { if (value === null) { if (project.request) delete project.request.projectPhase; } else requestOf(project).projectPhase = String(value); },
  },
  requestField("sheetStatus", "Status", ["Status"], asText(100, "Status"), true),
  {
    // Pull-only: Status drives automations on the sheet, which a portal edit must not set off.
    key: "request.stage", label: "Current stage", columns: ["Status"], pullOnly: true,
    parse: (value) => (value === null ? null : stageFromStatus(String(value))),
    read: (project) => project.request?.stage ?? null,
    write: (project, value) => { requestOf(project).stage = required(value, "Status") as Stage; },
  },
  {
    key: "payment", label: "Payment", columns: ["Status"], pullOnly: true,
    parse: (value) => (value === null ? null : STATUS_PAYMENTS[normalizeTitle(String(value))] ?? null),
    read: (project) => paymentLabel(project) || null,
    write: (project, value) => {
      const detail = required(value, "Payment");
      project.paymentDetail = detail;
      project.payment = normalizedPayment(detail);
    },
  },
  {
    ...requestField("type", "Project type", ["Project Type"], (value) => (value === null || value === "" ? null : projectType(String(value))), true),
    write: (project, value) => { requestOf(project).type = required(value, "Project type") as ProjectRequest["type"]; },
  },
  requestField("summary", "Request / scope", ["Scope", "Request"], asText(2000, "Request / scope")),
  // Pull-only: a project with no date gets today as a placeholder, which must never be written over a blank cell.
  { ...requestField("receivedAt", "Date requested", ["Date Requested"], asDate, true), write: (project, value) => { requestOf(project).receivedAt = required(value, "Date requested"); } },
  requestField("assignedTo", "SBD owner", ["Assigned to"], asText(200, "SBD owner"), true),
  {
    ...requestField("quotedAmount", "Approved budget", ["Approved Budget"], asNumber("Approved budget", 1e10)),
    write: (project, value) => { if (value === null) delete requestOf(project).quotedAmount; else requestOf(project).quotedAmount = Number(value); },
  },
  {
    ...requestField("quoteReference", "Quote number", ["Quote No"], (value) => asText(100, "Quote number")(value === null ? null : String(value))),
  },
  requestField("contactName", "Client contact", ["Client Contact"], asText(200, "Client contact")),
  requestField("internalNotes", "SBD notes", ["Notes"], asText(10000, "SBD notes"), true),
  {
    key: "install", label: "Install date", columns: ["SBD install week"], parse: asDate,
    read: (project) => project.install,
    write: (project, value) => { project.install = value === null ? null : String(value); },
  },
];

/** Ticking Portal Visible brings a row into the portal. It stays ticked; the sync never changes this cell. */
export const SYNC_COLUMN = ["Portal Visible"];
/** Every cell on a row as people read it, for staff to look up without opening the sheet. */
export function rowDetails(row: SheetRow, columns: SheetColumn[]) {
  const details: Record<string, string> = {};
  for (const column of columns) {
    const value = cellValue(row, column);
    if (value !== null && value !== "" && value !== false) details[column.title] = value === true ? "Yes" : String(column.type === "CONTACT_LIST" ? value : row.cells.find((cell) => cell.columnId === column.id)?.displayValue ?? value);
  }
  return details;
}

export function findColumn(columns: SheetColumn[], titles: readonly string[]) {
  for (const title of titles) {
    const match = columns.find((column) => normalizeTitle(column.title) === normalizeTitle(title));
    if (match) return match;
  }
  return undefined;
}
const readOnlyColumn = (column: SheetColumn) => Boolean(column.formula || column.systemColumnType || column.locked);

export function cellValue(row: SheetRow, column: SheetColumn | undefined): SyncValue {
  if (!column) return null;
  const cell = row.cells.find((candidate) => candidate.columnId === column.id);
  if (!cell) return null;
  // Contact cells hold an email as value; percent cells hold a fraction. displayValue is what people see.
  const raw = column.type === "CONTACT_LIST" || cell.displayValue?.trim().endsWith("%")
    ? cell.displayValue ?? cell.value
    : cell.value ?? cell.displayValue;
  if (raw === undefined || raw === null || raw === "") return null;
  return typeof raw === "object" ? cell.displayValue ?? null : (raw as SyncValue);
}
export const isSyncTicked = (value: SyncValue) => value === true || ["true", "yes", "1", "sync"].includes(String(value ?? "").trim().toLowerCase());

export function columnReport(columns: SheetColumn[]) {
  const claimed = new Set<number>();
  const fields = FIELD_MAP.map((field) => {
    const column = findColumn(columns, field.columns);
    if (column) claimed.add(column.id);
    return { key: field.key, label: field.label, column: column?.title ?? null, readOnly: Boolean(field.pullOnly || (column && readOnlyColumn(column))) };
  });
  for (const field of FIELD_MAP) for (const title of field.columns) { const column = findColumn(columns, [title]); if (column) claimed.add(column.id); }
  return { fields, reference: columns.filter((column) => !claimed.has(column.id)).map((column) => column.title) };
}

// ---- Three-way merge --------------------------------------------------------
export interface ReconcileResult {
  project: Project;
  /** Field labels whose portal value changed. */
  changed: string[];
  /** Cells to write to the sheet. Never contains a blank: the sync must not erase sheet data. */
  cells: CellWrite[];
  /** Snapshot to save once portal changes are stored. */
  snapshot: Record<string, SyncValue>;
  /** Added to the snapshot only after the sheet write has succeeded. */
  pushed: Record<string, SyncValue>;
  issues: string[];
}
const same = (a: SyncValue | undefined, b: SyncValue | undefined) => (a ?? null) === (b ?? null);

/**
 * Compares sheet, portal and the last agreed value per field, so one side's edit
 * is never mistaken for the other's.
 *
 * Sheet data is protected: a blank portal value never reaches a cell, and a field
 * with no agreed value yet (a newly linked row) takes the sheet's value, so linking
 * cannot overwrite what is already there. A portal value only fills an empty cell or
 * replaces a value the portal has previously agreed with.
 */
export function reconcile(options: {
  project: Project;
  snapshot?: Record<string, SyncValue>;
  row: SheetRow;
  columns: SheetColumn[];
  ctx: MapContext;
  ingest?: boolean;
}): ReconcileResult {
  const { row, columns, ctx, ingest } = options;
  const project = structuredClone(options.project);
  const snapshot = { ...(options.snapshot || {}) };
  const result: ReconcileResult = { project, changed: [], cells: [], snapshot, pushed: {}, issues: [] };
  for (const field of FIELD_MAP) {
    const column = findColumn(columns, field.columns);
    if (!column) continue;
    let sheet: SyncValue;
    try {
      sheet = field.parse(field.fromRow ? field.fromRow(row, columns) : cellValue(row, column));
    } catch (error) {
      result.issues.push(error instanceof PortalError ? error.message : `${field.label} could not be read`);
      continue;
    }
    const portal = field.read(project, ctx);
    if (same(sheet, portal)) { snapshot[field.key] = sheet; continue; }
    const agreed = Object.prototype.hasOwnProperty.call(snapshot, field.key);
    const sheetChanged = !agreed || !same(sheet, snapshot[field.key]);
    const portalChanged = agreed && !same(portal, snapshot[field.key]);
    // A pull-only value that is blank, or has no portal meaning, leaves the portal value alone.
    if (field.pullOnly && sheet === null) { snapshot[field.key] = null; continue; }
    // Edited on both sides since the last sync: the sheet's value stands, so it is never overwritten.
    const takeSheet = sheet !== null && (ingest || sheetChanged);
    if (takeSheet || (agreed && sheetChanged && !portalChanged)) {
      try {
        field.write(project, sheet, ctx);
        snapshot[field.key] = sheet;
        result.changed.push(field.label);
        if (agreed && portalChanged && !ingest) result.issues.push(`${field.label} was edited in both places; the Smartsheet value was kept`);
      } catch (error) {
        result.issues.push(error instanceof PortalError ? error.message : `${field.label} could not be applied`);
      }
      continue;
    }
    // Portal value going out. Blanks, pull-only fields and formula cells never reach the sheet.
    const cell = row.cells.find((candidate) => candidate.columnId === column.id);
    if (field.pullOnly || portal === null || portal === "" || readOnlyColumn(column) || cell?.formula) continue;
    if (sheet !== null && !portalChanged) continue;
    result.cells.push({ columnId: column.id, value: field.format ? field.format(portal, column) : portal, strict: false });
    result.pushed[field.key] = portal;
  }
  return result;
}
