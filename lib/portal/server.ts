import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { authOptions } from "../auth";
import { getUsersCollection } from "../db";
import { collections } from "./db";
import { isStaff, PortalError, staffRole } from "./policy";
import type { Actor } from "./types";
import { canAccessPortalPreview } from "./access";

export async function requirePortalActor(staff = false) {
  const actor = await requireActor(staff);
  if (!canAccessPortalPreview(actor))
    throw new PortalError("Portal access is limited during private testing", 403);
  return actor;
}

export async function currentActor(): Promise<Actor | null> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || !ObjectId.isValid(session.user.id)) return null;
  const user = await (
    await getUsersCollection()
  ).findOne({ _id: new ObjectId(session.user.id) });
  if (
    !user ||
    user.disabled ||
    (user.sessionVersion || 0) !== session.user.sessionVersion
  )
    return null;
  const { memberships, organizations } = await collections();
  const all = await memberships
    .find({ userId: session.user.id, active: true })
    .toArray();
  const active = new Set(
    (
      await organizations
        .find({ _id: { $in: all.map((m) => m.organizationId) }, active: true })
        .toArray()
    ).map((o) => o._id),
  );
  return {
    id: session.user.id,
    email: user.email,
    role: staffRole(user),
    memberships: all.filter((m) => active.has(m.organizationId)),
  };
}
export async function requireActor(staff = false) {
  const actor = await currentActor();
  if (!actor) throw new PortalError("Please sign in", 401);
  if (staff && !isStaff(actor))
    throw new PortalError("SBD staff access required", 403);
  return actor;
}
export async function getStaffSession() {
  const actor = await currentActor();
  return actor && isStaff(actor)
    ? { user: { id: actor.id, email: actor.email, role: actor.role } }
    : null;
}
export function json(data: unknown, status = 200) {
  return NextResponse.json(data, {
    status,
    headers: {
      "Cache-Control": "private, no-store",
      "X-Robots-Tag": "noindex, nofollow",
    },
  });
}
export function failure(error: unknown) {
  return json(
    {
      error:
        error instanceof PortalError
          ? error.message
          : "Unable to complete this request. Please try again.",
    },
    error instanceof PortalError ? error.status : 500,
  );
}
export function checkOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin || origin !== new URL(request.url).origin)
    throw new PortalError("Invalid request origin", 403);
}
export async function body(
  request: Request,
  limit = 2_000_000,
): Promise<Record<string, unknown>> {
  checkOrigin(request);
  if (!request.headers.get("content-type")?.startsWith("application/json"))
    throw new PortalError("JSON required", 415);
  const reader = request.body?.getReader();
  if (!reader) throw new PortalError("Request body required");
  const chunks: Uint8Array[] = [];
  let size = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > limit) {
      await reader.cancel();
      throw new PortalError("Upload is too large", 413);
    }
    chunks.push(value);
  }
  try {
    const data = JSON.parse(Buffer.concat(chunks).toString("utf8"));
    if (!data || typeof data !== "object" || Array.isArray(data))
      throw new Error();
    return data;
  } catch {
    throw new PortalError("Invalid JSON object");
  }
}
