import { createHmac, timingSafeEqual } from "crypto";
import { NextResponse } from "next/server";
import { readState, syncSheet } from "@/lib/smartsheet/sync";
import { smartsheetConfigured } from "@/lib/smartsheet/client";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Smartsheet's callback has no user session: its identity comes from the
// webhook id (verification) and the shared-secret signature (events).
export async function POST(request: Request) {
  if (!smartsheetConfigured()) return new NextResponse(null, { status: 404 });
  const raw = await request.text();
  if (raw.length > 1_000_000) return new NextResponse(null, { status: 413 });
  let payload: { webhookId?: number; challenge?: string };
  try {
    payload = JSON.parse(raw);
  } catch {
    return new NextResponse(null, { status: 400 });
  }
  const state = await readState();
  const challenge = request.headers.get("smartsheet-hook-challenge") || payload.challenge;
  if (challenge) {
    if (!state.webhookId || payload.webhookId !== state.webhookId)
      return new NextResponse(null, { status: 403 });
    return NextResponse.json({ smartsheetHookResponse: challenge }, { headers: { "Smartsheet-Hook-Response": challenge } });
  }
  const signature = request.headers.get("smartsheet-hmac-sha256") || "";
  const expected = state.sharedSecret ? createHmac("sha256", state.sharedSecret).update(raw).digest("hex") : "";
  if (
    !expected || signature.length !== expected.length ||
    !timingSafeEqual(Buffer.from(signature), Buffer.from(expected))
  )
    return new NextResponse(null, { status: 401 });
  // Callbacks only name what changed, so the sheet is read fresh and merged.
  try {
    await syncSheet();
  } catch {
    // A failure answered with 500 is retried by Smartsheet.
    return new NextResponse(null, { status: 500 });
  }
  return new NextResponse(null, { status: 200 });
}
