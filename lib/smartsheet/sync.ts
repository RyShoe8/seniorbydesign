import { randomUUID } from "crypto";
import { collections, transaction } from "../portal/db";
import { PortalError } from "../portal/policy";
import { accountOrigin } from "../portal/origins";
import type { Organization, Project } from "../portal/types";
import {
  createSheetWebhook, enableWebhook, findSheetIdByPermalink, getSheet,
  sheetWritesEnabled, smartsheetConfigured, updateRowCells,
} from "./client";
import {
  cellValue, columnReport, FIELD_MAP, findColumn, isSyncTicked, ownerName, reconcile, rowDetails, SYNC_COLUMN,
  type CellWrite, type MapContext,
} from "./mapping";

const SHEET_TOKEN = process.env.SMARTSHEET_SHEET_TOKEN || "wGcgj4qCC28cqc5RMJRvGw2gm6Rjq3X8w76vWQP1";

interface SyncState {
  _id: "state";
  sheetId?: number;
  webhookId?: number;
  sharedSecret?: string;
  lastSyncAt?: Date;
  lastError?: string;
  issues?: { rowId: number; project: string; messages: string[] }[];
}
export interface PlannedChange { project: string; rowId: number | null; action: "create" | "update" | "link" | "unlink" | "skip"; portal: string[]; sheetCells: number; issues: string[] }

async function stateCollection() {
  const { db } = await collections();
  return db.collection<SyncState>("portalSmartsheet");
}
export async function readState() {
  return (await (await stateCollection()).findOne({ _id: "state" })) || ({ _id: "state" } as SyncState);
}
async function saveState(fields: Partial<SyncState>) {
  await (await stateCollection()).updateOne({ _id: "state" }, { $set: fields }, { upsert: true });
}
async function resolveSheetId() {
  const configured = Number(process.env.SMARTSHEET_SHEET_ID);
  if (configured) return configured;
  const state = await readState();
  if (state.sheetId) return state.sheetId;
  const id = await findSheetIdByPermalink(SHEET_TOKEN);
  if (!id) throw new PortalError("The connected Smartsheet account cannot see this sheet", 404);
  await saveState({ sheetId: id });
  return id;
}
const key = (value: unknown) => String(value ?? "").trim().toLowerCase();
/** "ReNew REIT" and "RenewREIT" are the same company. */
const orgKey = (name: unknown) => key(ownerName(String(name ?? ""))).replace(/[^a-z0-9]/g, "");
const orgSlug = (name: string) => key(name).replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "unnamed";

/** Owner Groups new to the portal get an organization, created only when a project using them is saved. */
function mapContext(organizations: Organization[]) {
  const pending = new Map<string, Organization>();
  const ctx: MapContext = {
    orgName: (id) => organizations.find((org) => org._id === id)?.name ?? pending.get(id)?.name ?? null,
    orgId: (name, type) => {
      const match = organizations.find((org) => org.active && org.type === type && orgKey(org.name) === orgKey(name));
      if (match) return match._id;
      const slug = orgSlug(name), id = `${type}:${slug}`;
      if (!pending.has(id)) pending.set(id, { _id: id, type, slug, name, active: true, version: 1, createdAt: new Date() });
      return id;
    },
  };
  return { ctx, pending };
}
function blankProject(): Project {
  const id = randomUUID();
  return {
    _id: id, sourceId: id, companyId: "", operatorId: "", name: "", location: "", address: "", summary: "",
    scopes: [], documents: [], payment: "Awaiting Confirmation", order: "Awaiting Confirmation", install: null,
    version: 1, archived: false, operatorApproval: false, workflowTouched: false, updatedAt: new Date(),
  };
}
async function storeProject(project: Project, before: Project | null, note: string, newOrgs: Organization[]) {
  const c = await collections();
  await transaction(async (session) => {
    for (const org of newOrgs) {
      if (![project.companyId, project.operatorId].includes(org._id)) continue;
      await c.organizations.updateOne({ _id: org._id }, { $setOnInsert: org }, { upsert: true, session });
    }
    if (before) {
      const next = { ...project, version: before.version + 1, updatedAt: new Date(), workflowTouched: project.request ? true : project.workflowTouched };
      const saved = await c.projects.replaceOne({ _id: before._id, version: before.version }, next, { session });
      if (!saved.matchedCount) throw new PortalError("Project changed during sync; it will be retried", 409);
    } else await c.projects.insertOne(project, { session });
    await c.events.insertOne({
      _id: randomUUID(), projectId: project._id, action: "smartsheet-sync", actorId: "smartsheet", email: "Smartsheet",
      at: new Date(), note, before: before && { request: before.request, payment: before.payment, order: before.order, install: before.install }, after: { request: project.request, payment: project.payment, order: project.order, install: project.install },
    }, { session });
  });
}

/**
 * Brings portal and sheet together, reading every row. With `dryRun`, nothing is
 * stored anywhere and the plan is returned for review. Rows join the portal when
 * Portal Visible is ticked. A row removed from the sheet only unlinks its project;
 * rows are never added to or removed from the sheet.
 */
export async function syncSheet({ dryRun = false }: { dryRun?: boolean } = {}) {
  const sheetId = await resolveSheetId();
  const sheet = await getSheet(sheetId);
  const c = await collections();
  const projects = await c.projects.find({}).toArray();
  const { ctx, pending } = mapContext(await c.organizations.find({}).toArray());
  const writes = !dryRun && sheetWritesEnabled();
  const byRow = new Map(projects.filter((p) => p.smartsheet).map((p) => [p.smartsheet!.rowId, p]));
  const syncColumn = findColumn(sheet.columns, SYNC_COLUMN);
  const nameColumn = findColumn(sheet.columns, ["Community Name"]);
  const ownerColumn = findColumn(sheet.columns, ["Owner Group"]);
  const quoteColumn = findColumn(sheet.columns, ["Quote No"]);
  const plan: PlannedChange[] = [];
  const updates: { id: number; cells: CellWrite[] }[] = [];

  for (const row of sheet.rows) {
    const ticked = isSyncTicked(cellValue(row, syncColumn));
    const linked = byRow.get(row.id) ?? null;
    // Rows wait until someone ticks Portal Visible. Section headings and totals have no owner, so they never join.
    if (!linked && (!ticked || !cellValue(row, ownerColumn) || !cellValue(row, nameColumn))) continue;
    let existing = linked;
    if (!existing) {
      // Several jobs can share a community, so link only an unambiguous match.
      const name = key(cellValue(row, nameColumn)), owner = orgKey(cellValue(row, ownerColumn));
      const candidates = projects.filter((p) => !p.smartsheet && key(p.name) === name && orgKey(ctx.orgName(p.companyId)) === owner);
      existing = candidates.length === 1 ? candidates[0] : null;
      // A quote already in the portal belongs to that project and its approvals. A second copy would split them.
      const quote = key(cellValue(row, quoteColumn));
      const holder = !existing && quote ? projects.find((p) => p.scopes.some((scope) => key(scope.quote) === quote)) : null;
      if (holder) {
        plan.push({ project: String(cellValue(row, nameColumn)), rowId: row.id, action: "skip", portal: [], sheetCells: 0, issues: [`Quote ${quote} is already on "${holder.name}" in the portal, so this row was not added`] });
        continue;
      }
    }
    const firstTime = !linked;
    const merged = reconcile({ project: existing ?? blankProject(), snapshot: existing?.smartsheet?.snapshot, row, columns: sheet.columns, ctx, ingest: firstTime });
    const label = merged.project.name || `Row ${row.id}`;
    plan.push({ project: label, rowId: row.id, action: !existing ? "create" : firstTime ? "link" : "update", portal: merged.changed, sheetCells: merged.cells.length, issues: merged.issues });
    if (dryRun) continue;
    if (!existing && (!merged.project.name || !merged.project.companyId || !merged.project.operatorId)) continue;
    const details = rowDetails(row, sheet.columns);
    const link = { rowId: row.id, snapshot: merged.snapshot, details, syncedAt: new Date() };
    merged.project.smartsheet = link;
    try {
      if (merged.changed.length || firstTime)
        await storeProject(merged.project, existing, `Updated from Smartsheet: ${merged.changed.join(", ") || "linked to row"}`, [...pending.values()]);
      else if (JSON.stringify([existing!.smartsheet?.snapshot, existing!.smartsheet?.details]) !== JSON.stringify([merged.snapshot, details]))
        await c.projects.updateOne({ _id: existing!._id }, { $set: { smartsheet: link } });
    } catch (error) {
      plan[plan.length - 1].issues.push(error instanceof PortalError ? error.message : "Could not save this project");
      continue;
    }
    if (writes && merged.cells.length) {
      updates.push({ id: row.id, cells: merged.cells });
      await c.projects.updateOne({ _id: merged.project._id }, { $set: { "smartsheet.snapshot": { ...merged.snapshot, ...merged.pushed } } });
    }
  }
  const present = new Set(sheet.rows.map((row) => row.id));
  for (const project of projects) {
    if (!project.smartsheet || present.has(project.smartsheet.rowId)) continue;
    plan.push({ project: project.name, rowId: project.smartsheet.rowId, action: "unlink", portal: [], sheetCells: 0, issues: [] });
    if (!dryRun) await c.projects.updateOne({ _id: project._id }, { $unset: { smartsheet: "" } });
  }
  const result = { plan, writesEnabled: sheetWritesEnabled() };
  if (dryRun) return result;
  if (writes) await updateRowCells(sheetId, updates);
  await saveState({
    lastSyncAt: new Date(), lastError: "",
    issues: plan.filter((entry) => entry.issues.length).map((entry) => ({ rowId: entry.rowId!, project: entry.project, messages: entry.issues })),
  });
  return result;
}

/** Sends one linked project's portal edits to its row. Never fails the portal request that triggered it. */
export async function pushProjectSafely(projectId: string) {
  if (!smartsheetConfigured() || !sheetWritesEnabled()) return;
  const c = await collections();
  try {
    const project = await c.projects.findOne({ _id: projectId });
    if (!project?.smartsheet) return;
    const sheetId = await resolveSheetId();
    const { ctx, pending } = mapContext(await c.organizations.find({}).toArray());
    const sheet = await getSheet(sheetId, [project.smartsheet.rowId]);
    const row = sheet.rows.find((candidate) => candidate.id === project.smartsheet!.rowId);
    if (!row) return; // A full sync decides whether the row really has gone.
    const merged = reconcile({ project, snapshot: project.smartsheet.snapshot, row, columns: sheet.columns, ctx });
    const link = { ...project.smartsheet, snapshot: merged.snapshot, syncedAt: new Date() };
    if (merged.changed.length) {
      merged.project.smartsheet = link;
      await storeProject(merged.project, project, `Updated from Smartsheet: ${merged.changed.join(", ")}`, [...pending.values()]);
    }
    if (merged.cells.length) await updateRowCells(sheetId, [{ id: row.id, cells: merged.cells }]);
    await c.projects.updateOne({ _id: project._id }, { $set: { smartsheet: { ...link, snapshot: { ...merged.snapshot, ...merged.pushed } } } });
  } catch (error) {
    const message = error instanceof PortalError ? error.message : "Smartsheet update failed";
    await c.projects.updateOne({ _id: projectId, smartsheet: { $exists: true } }, { $set: { "smartsheet.lastError": message } }).catch(() => undefined);
    await saveState({ lastError: `${projectId}: ${message}` }).catch(() => undefined);
  }
}

export async function sheetStatus() {
  const state = await readState();
  const base = { configured: smartsheetConfigured(), writesEnabled: sheetWritesEnabled(), webhookActive: Boolean(state.webhookId), lastSyncAt: state.lastSyncAt ?? null, lastError: state.lastError || "", issues: state.issues || [] };
  if (!base.configured) return { ...base, sheet: null, report: null };
  const sheet = await getSheet(await resolveSheetId());
  const c = await collections();
  const syncColumn = findColumn(sheet.columns, SYNC_COLUMN);
  return {
    ...base,
    sheet: { name: sheet.name, rows: sheet.rows.filter((row) => isSyncTicked(cellValue(row, syncColumn))).length },
    linked: await c.projects.countDocuments({ smartsheet: { $exists: true } }),
    report: columnReport(sheet.columns),
  };
}
export async function connectWebhook() {
  const origin = accountOrigin("staff");
  if (!origin?.startsWith("https://")) throw new PortalError("A public HTTPS site address is required for live updates", 409);
  const sheetId = await resolveSheetId();
  const webhook = await createSheetWebhook(sheetId, new URL("/api/smartsheet/webhook", origin).href);
  // Saved first: enabling triggers a verification callback that checks this id.
  await saveState({ webhookId: webhook.id, sharedSecret: webhook.sharedSecret });
  await enableWebhook(webhook.id);
}
