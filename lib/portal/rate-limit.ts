import { getDb } from "../db";
import { hash, PortalError } from "./policy";
export async function rateLimit(key: string, limit: number, minutes = 15) {
  const bucket = Math.floor(Date.now() / (minutes * 60000));
  const collection = (await getDb()).collection<{
    _id: string;
    count: number;
    expiresAt: Date;
  }>("accountRateLimits");
  const row = await collection.findOneAndUpdate(
    { _id: hash(`${key}:${bucket}`) },
    {
      $inc: { count: 1 },
      $setOnInsert: { expiresAt: new Date((bucket + 2) * minutes * 60000) },
    },
    { upsert: true, returnDocument: "after" },
  );
  if (!row || row.count > limit)
    throw new PortalError("Too many attempts. Please try again later.", 429);
}
