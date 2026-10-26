// Run only against the intended environment: node --env-file=.env.local scripts/portal-setup.cjs
// Read-only by default. --apply normalizes account emails/roles and creates indexes.
const { MongoClient } = require("mongodb");
async function main() {
  if (!process.env.MONGODB_URI) throw new Error("MONGODB_URI is required");
  const client = await new MongoClient(process.env.MONGODB_URI).connect();
  try {
    const db = client.db("seniorbydesign"),
      users = db.collection("users");
    const rows = await users.find({}).project({ email: 1, role: 1 }).toArray();
    const emails = new Set();
    for (const u of rows) {
      const email = String(u.email).trim().toLowerCase();
      if (emails.has(email))
        throw new Error(
          "Duplicate normalized emails exist. Resolve them before migration.",
        );
      emails.add(email);
    }
    console.log(
      `Reviewed ${rows.length} accounts; no normalized-email collisions.`,
    );
    if (!process.argv.includes("--apply")) {
      console.log("Read-only check complete. No changes made.");
      return;
    }
    const admins = new Set([
      "ryanschumacher@themediashop.co",
      "glenn@sbdid.com",
    ]);
    for (const u of rows) {
      const email = u.email.trim().toLowerCase();
      const role =
        u.role === "admin" && admins.has(email)
          ? "admin"
          : ["admin", "user", "team"].includes(u.role)
            ? "team"
            : "external";
      await users.updateOne(
        { _id: u._id },
        { $set: { email, role }, $inc: { sessionVersion: 1 } },
      );
    }
    await users.createIndex({ email: 1 }, { unique: true });
    await db
      .collection("portalProjects")
      .createIndex({ companyId: 1, sourceId: 1 }, { unique: true });
    await db.collection("portalProjects").createIndex({ operatorId: 1 });
    await db
      .collection("portalMemberships")
      .createIndex({ userId: 1, organizationId: 1 }, { unique: true });
    await db
      .collection("portalWorkflowEvents")
      .createIndex({ projectId: 1, at: -1 });
    await db
      .collection("accountTokens")
      .createIndex({ expiresAt: 1 }, { expireAfterSeconds: 604800 });
    await db
      .collection("accountRateLimits")
      .createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
    console.log(
      "Migration complete. Existing sessions invalidated. No passwords changed or invitations sent.",
    );
  } finally {
    await client.close();
  }
}
main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
