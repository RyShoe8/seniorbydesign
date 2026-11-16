import { timingSafeEqual } from "crypto";
import { json } from "@/lib/portal/server";
import { syncAllFiles } from "@/lib/sharepoint/auto";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Called on a schedule (see vercel.json), never from the browser. Vercel sends CRON_SECRET as a bearer token.
export async function GET(request: Request) {
  const expected = process.env.CRON_SECRET || "";
  const supplied = request.headers.get("authorization")?.replace(/^Bearer /, "") || "";
  if (
    !expected ||
    Buffer.byteLength(supplied) !== Buffer.byteLength(expected) ||
    !timingSafeEqual(Buffer.from(supplied), Buffer.from(expected))
  )
    return json({ error: "Unauthorized" }, 401);
  try {
    return json(await syncAllFiles({ files: 12, seconds: 45 }));
  } catch {
    return json({ error: "File sync failed" }, 500);
  }
}
