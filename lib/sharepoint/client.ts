import { PortalError } from "../portal/policy";
import { classifyFile, SOURCE_ROOT, sourcePath, sourceUrl } from "./files";
import type { FolderEntry } from "./match";

/** What the common Microsoft sign-in codes mean, in words IT can act on. */
const SIGN_IN_HINTS: Record<string, string> = {
  AADSTS7000215: "the client secret is wrong. Use the secret's Value, not its Secret ID",
  AADSTS7000222: "the client secret has expired. Ask IT for a new one",
  AADSTS700016: "no app with this client ID exists in this tenant. Check the Application (client) ID and the tenant ID",
  AADSTS90002: "the tenant ID was not found. Check the Directory (tenant) ID",
  AADSTS900023: "the tenant ID is not valid. Check the Directory (tenant) ID",
  AADSTS7000229: "the app has no service principal in this tenant. IT needs to grant admin consent",
  AADSTS53003: "a Conditional Access policy is blocking the app",
};
export const sharepointConfigured = () => Boolean(process.env.SHAREPOINT_TENANT_ID && process.env.SHAREPOINT_CLIENT_ID && process.env.SHAREPOINT_CLIENT_SECRET);
/** Server credentials have read access to the SBD Files site only. No sharing or write API is used. */
async function connection() {
  if (!sharepointConfigured()) throw new PortalError("Automatic scanning needs a Microsoft application connection. You can add reviewed file links below meanwhile.", 503);
  const tenant = process.env.SHAREPOINT_TENANT_ID!;
  if (!/^[a-zA-Z0-9.-]+$/.test(tenant)) throw new PortalError("Invalid Microsoft tenant configuration", 503);
  const response = await fetch(`https://login.microsoftonline.com/${tenant}/oauth2/v2.0/token`, {
    method: "POST", cache: "no-store", signal: AbortSignal.timeout(15000),
    body: new URLSearchParams({ client_id: process.env.SHAREPOINT_CLIENT_ID!, client_secret: process.env.SHAREPOINT_CLIENT_SECRET!, scope: "https://graph.microsoft.com/.default", grant_type: "client_credentials" }),
  });
  if (!response.ok) {
    // Microsoft names the problem with an AADSTS code (for example 7000215: wrong secret value). It contains no secrets.
    const detail = await response.json().catch(() => ({})) as { error?: string; error_description?: string };
    const code = detail.error_description?.match(/AADSTS\d+/)?.[0];
    const hint = code ? SIGN_IN_HINTS[code] : undefined;
    throw new PortalError(`Microsoft application sign-in failed (${[code, detail.error].filter(Boolean).join(", ") || response.status})${hint ? `: ${hint}` : ". Check the configured credentials."}`, 502);
  }
  const token = (await response.json()).access_token;
  async function get<T>(route: string): Promise<T> {
    const endpoint = new URL(route, "https://graph.microsoft.com/v1.0/");
    if (endpoint.origin !== "https://graph.microsoft.com" || !endpoint.pathname.startsWith("/v1.0/")) throw new PortalError("Unexpected Microsoft pagination link", 502);
    const result = await fetch(endpoint, { headers: { Authorization: `Bearer ${token}` }, cache: "no-store", signal: AbortSignal.timeout(15000) });
    if (!result.ok) {
      const code = ((await result.json().catch(() => ({}))) as { error?: { code?: string } }).error?.code;
      const step = endpoint.pathname.includes("/sites/") && !endpoint.pathname.includes("/drive") ? "the SBD Files site" : "the folder";
      throw new PortalError(`Microsoft could not read ${step} (${[result.status, code].filter(Boolean).join(", ")})${result.status === 403 ? ": the app has no read access to the SBD Files site yet" : result.status === 404 ? ": not found" : ""}.`, 502);
    }
    return result.json();
  }
  const site = await get<{ id: string }>("sites/seniorbydesign.sharepoint.com:/sites/SBDFiles");
  const drive = await get<{ id: string }>(`sites/${encodeURIComponent(site.id)}/drive`);
  return { get, drive, token };
}
const SKIP_FOLDER = /(photo|video|note|meeting|archive|budget|for ai|walk|template|original|\bold\b|^~)/i;
/** Office lock files, and the copies OneDrive makes when two computers edit at once ("...-LAPTOP-7CM8A8US.pdf"). */
const SKIP_FILE = /^~\$|-(laptop|desktop)-[a-z0-9]{4,}\./i;

/** Every folder one and two levels into Comm - Remodels: client folders and the community folders inside them. */
export async function listProjectFolders(): Promise<FolderEntry[]> {
  const { get, drive } = await connection();
  type Item = { id: string; name: string; folder?: object };
  type Page = { value: Item[]; "@odata.nextLink"?: string };
  const children = async (route: string) => {
    const items: Item[] = [];
    let next: string | undefined = `${route}/children?$select=id,name,folder&$top=200`;
    for (let pages = 0; next && pages < 10; pages++) {
      const page: Page = await get<Page>(next);
      items.push(...page.value.filter((item) => item.folder));
      next = page["@odata.nextLink"];
    }
    return items;
  };
  const relative = SOURCE_ROOT.slice("/sites/SBDFiles/Shared Documents/".length);
  const top = await children(`drives/${encodeURIComponent(drive.id)}/root:/${relative.split("/").map(encodeURIComponent).join("/")}:`);
  const entries: FolderEntry[] = [];
  for (const folder of top) {
    const path = `${SOURCE_ROOT}/${folder.name}`;
    entries.push({ path, name: folder.name, parent: null });
    if (/^~|do not use|completed/i.test(folder.name)) continue;
    for (const inner of await children(`drives/${encodeURIComponent(drive.id)}/items/${encodeURIComponent(folder.id)}`))
      entries.push({ path: `${path}/${inner.name}`, name: inner.name, parent: path });
  }
  return entries;
}

export async function scanFolder(url: string) {
  const path = sourcePath(url);
  if (path === SOURCE_ROOT) throw new PortalError("Choose a specific client or project folder inside Comm - Remodels");
  const { get, drive } = await connection();
  const relative = path.slice("/sites/SBDFiles/Shared Documents/".length);
  type Item = { id: string; name: string; folder?: object; file?: object; webUrl: string; eTag?: string; size?: number; lastModifiedDateTime?: string };
  type Page = { value: Item[]; "@odata.nextLink"?: string };
  const root = await get<Item>(`drives/${encodeURIComponent(drive.id)}/root:/${relative.split("/").map(encodeURIComponent).join("/")}`);
  const queue = [{ id: root.id, path }];
  const files: { name: string; url: string; category: string; reason: string; eTag?: string; size?: number; modified?: string }[] = [];
  let pages = 0;
  while (queue.length) {
    const folder = queue.shift()!;
    let next: string | undefined = `drives/${encodeURIComponent(drive.id)}/items/${encodeURIComponent(folder.id)}/children?$top=200`;
    while (next) {
      if (++pages > 30) throw new PortalError("This folder is too large for one scan. Choose a project subfolder.");
      const page: Page = await get<Page>(next);
      for (const item of page.value) {
        // Built from the folder walked, not webUrl: Word and Excel files report an "open in browser" address instead of their path.
        if (/[/\\]|^\.\.?$/.test(item.name)) continue;
        const itemPath = `${folder.path}/${item.name}`;
        // Photos, notes, budgets and archives are working material, never client files: not even listed.
        if (item.folder) { if (!SKIP_FOLDER.test(item.name)) queue.push({ id: item.id, path: itemPath }); }
        else if (item.file && /\.(pdf|pptx?|ppsx?|docx?|xlsx?|csv|txt)$/i.test(item.name) && !SKIP_FILE.test(item.name)) {
          files.push({ name: item.name, url: sourceUrl(itemPath), eTag: item.eTag, size: item.size, modified: item.lastModifiedDateTime, ...classifyFile(item.name, itemPath) });
          if (files.length > 500) throw new PortalError("More than 500 documents found. Choose a smaller project folder.");
        }
      }
      next = page["@odata.nextLink"];
    }
  }
  return files;
}

export async function readSourceFile(url: string) {
  const path = sourcePath(url);
  const { get, drive, token } = await connection();
  const relative = path.slice("/sites/SBDFiles/Shared Documents/".length);
  type FileInfo = { id: string; eTag: string; size: number; webUrl: string; file?: { mimeType: string } };
  const before = await get<FileInfo>(`drives/${encodeURIComponent(drive.id)}/root:/${relative.split("/").map(encodeURIComponent).join("/")}`);
  if (!before.file || before.size > 100 * 1024 * 1024) throw new PortalError("Choose a file no larger than 100 MB");
  const itemRoute = `drives/${encodeURIComponent(drive.id)}/items/${encodeURIComponent(before.id)}`;
  const redirect = await fetch(`https://graph.microsoft.com/v1.0/${itemRoute}/content`, {
    headers: { Authorization: `Bearer ${token}` }, redirect: "manual", cache: "no-store", signal: AbortSignal.timeout(15000),
  });
  const location = redirect.headers.get("location");
  if (redirect.status !== 302 || !location || new URL(location).protocol !== "https:") throw new PortalError("Microsoft could not provide the file", 502);
  // Do not forward the Graph credential to the temporary download address.
  const download = await fetch(location, { cache: "no-store", signal: AbortSignal.timeout(30000) });
  if (!download.ok || !download.body) throw new PortalError("Microsoft file download failed", 502);
  const chunks: Uint8Array[] = []; let size = 0;
  const reader = download.body.getReader();
  while (true) {
    const { done, value } = await reader.read(); if (done) break;
    size += value.byteLength;
    if (size > 100 * 1024 * 1024) { await reader.cancel(); throw new PortalError("File exceeds 100 MB"); }
    chunks.push(value);
  }
  const after = await get<FileInfo>(itemRoute);
  if (before.eTag !== after.eTag || size !== before.size) throw new PortalError("The SharePoint file changed during import. Scan and try again.", 409);
  return { bytes: Buffer.concat(chunks), contentType: before.file.mimeType, sourceItemId: `${drive.id}/${before.id}`, eTag: before.eTag };
}
