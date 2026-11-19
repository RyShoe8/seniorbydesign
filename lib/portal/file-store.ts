import { get, head, put } from "@vercel/blob";
import { PortalError } from "./policy";

/**
 * Where portal file copies live: Vercel Blob, never the database.
 *
 * Each file is stored once, named by a fingerprint of its contents, so a presentation shared by three
 * projects takes the space of one. Files are only ever handed out through /api/portal/documents, after
 * the reader's access to the project is checked; their storage address is never sent to a browser.
 *
 * Files go in a private Blob store, connected with the PORTAL_FILES prefix, so nobody can open one
 * without going through the portal. The site's existing image store is public, so it is not used.
 */
function store() {
  // Vercel names it PORTAL_FILES_READ_WRITE_TOKEN when the store is connected with the "PORTAL_FILES" prefix.
  const token = process.env.PORTAL_FILES_READ_WRITE_TOKEN || process.env.PORTAL_FILES_BLOB_TOKEN;
  if (!token) throw new PortalError("File storage is not connected: connect a private Vercel Blob store with the PORTAL_FILES prefix", 503);
  return { token, access: "private" as const };
}
const PREFIX = "portal-files/";
export const isStored = (storageId?: string) => Boolean(storageId?.startsWith("blob:"));

/** Saves the bytes unless the same file is already stored. Returns the storage reference kept on the document. */
export async function storeFile(bytes: Buffer, contentHash: string, extension: string, contentType: string) {
  const { token, access } = store();
  const pathname = `${PREFIX}${contentHash}.${extension.replace(/[^a-z0-9]/g, "") || "bin"}`;
  const existing = await head(pathname, { token }).catch(() => null);
  if (!existing)
    await put(pathname, bytes, {
      access, token, contentType, addRandomSuffix: false, allowOverwrite: true,
      cacheControlMaxAge: 60, multipart: bytes.length > 20 * 1024 * 1024,
    });
  return `blob:${pathname}`;
}

/** Opens a stored file for streaming to someone already allowed to see it. */
export async function openFile(storageId: string) {
  if (!isStored(storageId)) return null;
  const { token, access } = store();
  const result = await get(storageId.slice("blob:".length), { access, token, useCache: false });
  if (!result || result.statusCode !== 200 || !result.stream) return null;
  return { stream: result.stream, size: result.blob.size };
}
