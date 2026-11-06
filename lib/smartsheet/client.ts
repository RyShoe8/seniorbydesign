import { PortalError } from "../portal/policy";
import type { CellWrite, SheetColumn, SheetRow } from "./mapping";

const API = "https://api.smartsheet.com/2.0";

// This client can only read and update existing cells. It cannot delete or add
// rows, columns or sheets, and blank cell values are refused below.

export const smartsheetConfigured = () => Boolean(process.env.SMARTSHEET_ACCESS_TOKEN);
/** Writes to the sheet stay off until explicitly enabled; reads and portal updates still work. */
export const sheetWritesEnabled = () => process.env.SMARTSHEET_WRITES_ENABLED === "true";

async function call<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = process.env.SMARTSHEET_ACCESS_TOKEN;
  if (!token) throw new PortalError("Smartsheet is not connected", 503);
  const method = (init.method || "GET").toUpperCase();
  if (method === "DELETE") throw new PortalError("Deleting from Smartsheet is not allowed", 500);
  const response = await fetch(`${API}${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", ...init.headers },
    cache: "no-store",
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok)
    throw new PortalError(`Smartsheet: ${data.message || `request failed (${response.status})`}`, 502);
  return data as T;
}
function assertSheetWrite() {
  if (!sheetWritesEnabled()) throw new PortalError("Writing to Smartsheet is turned off", 409);
}
/** Refuses a blank before it can leave the portal, whatever the caller computed. */
export function safeCells(cells: CellWrite[]) {
  return cells.filter((cell) => cell.value !== "" && cell.value !== null && cell.value !== undefined);
}

export interface Sheet { id: number; name: string; columns: SheetColumn[]; rows: SheetRow[] }
export const getSheet = (id: number, rowIds?: number[]) =>
  call<Sheet>(`/sheets/${id}${rowIds?.length ? `?rowIds=${rowIds.join(",")}` : ""}`);

/** Finds the numeric sheet id from the permalink token in the sheet's URL. */
export async function findSheetIdByPermalink(token: string) {
  const list = await call<{ data: { id: number; permalink?: string }[] }>("/sheets?includeAll=true");
  return list.data.find((sheet) => sheet.permalink?.includes(token))?.id ?? null;
}
export async function updateRowCells(sheetId: number, updates: { id: number; cells: CellWrite[] }[]) {
  assertSheetWrite();
  const rows = updates.map((row) => ({ id: row.id, cells: safeCells(row.cells) })).filter((row) => row.cells.length);
  if (!rows.length) return;
  await call(`/sheets/${sheetId}/rows`, { method: "PUT", body: JSON.stringify(rows) });
}
export async function createSheetWebhook(sheetId: number, callbackUrl: string) {
  const created = await call<{ result: { id: number; sharedSecret: string } }>("/webhooks", {
    method: "POST",
    body: JSON.stringify({ name: "SBD client portal sync", callbackUrl, scope: "sheet", scopeObjectId: sheetId, events: ["*.*"], version: 1 }),
  });
  return created.result;
}
export const enableWebhook = (id: number) =>
  call(`/webhooks/${id}`, { method: "PUT", body: JSON.stringify({ enabled: true }) });
