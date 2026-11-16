import { PortalError } from "../portal/policy";
import { classifyFile, SOURCE_ROOT, sourcePath, sourceUrl } from "./files";

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
  if (!response.ok) throw new PortalError("Microsoft application sign-in failed. Check the configured credentials.", 502);
  const token = (await response.json()).access_token;
  async function get<T>(route: string): Promise<T> {
    const endpoint = new URL(route, "https://graph.microsoft.com/v1.0/");
    if (endpoint.origin !== "https://graph.microsoft.com" || !endpoint.pathname.startsWith("/v1.0/")) throw new PortalError("Unexpected Microsoft pagination link", 502);
    const result = await fetch(endpoint, { headers: { Authorization: `Bearer ${token}` }, cache: "no-store", signal: AbortSignal.timeout(15000) });
    if (!result.ok) throw new PortalError(`Microsoft could not read this folder (${result.status}). Check the application's SBD Files access.`, 502);
    return result.json();
  }
  const site = await get<{ id: string }>("sites/seniorbydesign.sharepoint.com:/sites/SBDFiles");
  const drive = await get<{ id: string }>(`sites/${encodeURIComponent(site.id)}/drive`);
  return { get, drive, token };
}
export async function scanFolder(url: string) {
  const path = sourcePath(url);
  if (path === SOURCE_ROOT) throw new PortalError("Choose a specific client or project folder inside Comm - Remodels");
  const { get, drive } = await connection();
  const relative = path.slice("/sites/SBDFiles/Shared Documents/".length);
  type Item = { id: string; name: string; folder?: object; file?: object; webUrl: string; eTag?: string; size?: number };
  type Page = { value: Item[]; "@odata.nextLink"?: string };
  const root = await get<Item>(`drives/${encodeURIComponent(drive.id)}/root:/${relative.split("/").map(encodeURIComponent).join("/")}`);
  const queue = [{ id: root.id, path }];
  const files: { name: string; url: string; category: string; reason: string; eTag?: string; size?: number }[] = [];
  let pages = 0;
  while (queue.length) {
    const folder = queue.shift()!;
    let next: string | undefined = `drives/${encodeURIComponent(drive.id)}/items/${encodeURIComponent(folder.id)}/children?$top=200`;
    while (next) {
      if (++pages > 30) throw new PortalError("This folder is too large for one scan. Choose a project subfolder.");
      const page: Page = await get<Page>(next);
      for (const item of page.value) {
        const itemPath = sourcePath(item.webUrl);
        if (!itemPath.startsWith(`${path}/`)) throw new PortalError("A file was outside the selected folder", 502);
        if (item.folder) queue.push({ id: item.id, path: itemPath });
        else if (item.file && /\.(pdf|pptx?|ppsx?|docx?|xlsx?|csv|txt)$/i.test(item.name)) {
          files.push({ name: item.name, url: sourceUrl(itemPath), eTag: item.eTag, size: item.size, ...classifyFile(item.name, itemPath) });
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
  if (!before.file || before.size > 25 * 1024 * 1024) throw new PortalError("Choose a file no larger than 25 MB");
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
    if (size > 25 * 1024 * 1024) { await reader.cancel(); throw new PortalError("File exceeds 25 MB"); }
    chunks.push(value);
  }
  const after = await get<FileInfo>(itemRoute);
  if (before.eTag !== after.eTag || size !== before.size) throw new PortalError("The SharePoint file changed during import. Scan and try again.", 409);
  return { bytes: Buffer.concat(chunks), contentType: before.file.mimeType, sourceItemId: `${drive.id}/${before.id}`, eTag: before.eTag };
}
