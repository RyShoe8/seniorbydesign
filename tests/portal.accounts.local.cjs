if (process.env.SBD_PORTAL_TEST_ONLY !== "true")
  throw new Error(
    "Run through the isolated integration runner. Never run against a real database.",
  );
const { MongoClient, ObjectId } = require("mongodb");
const bcrypt = require("bcryptjs");
const { randomBytes, createHash } = require("crypto");
const assert = require("assert/strict");
const digest = (s) => createHash("sha256").update(s).digest("hex");
const post = async (data) => {
  const r = await fetch("http://localhost:3102/api/account", {
    method: "POST",
    headers: {
      origin: "http://localhost:3102",
      "content-type": "application/json",
    },
    body: JSON.stringify(data),
  });
  return { status: r.status, value: await r.json() };
};
(async () => {
  const c = await new MongoClient(
    "mongodb://127.0.0.1:27189/?directConnection=true",
  ).connect();
  try {
    const db = c.db("seniorbydesign"),
      admin = await db
        .collection("users")
        .findOne({ email: "ryanschumacher@themediashop.co" });
    assert(admin);
    const raw = randomBytes(32).toString("hex"),
      password = randomBytes(20).toString("hex");
    await db
      .collection("accountTokens")
      .insertOne({
        _id: digest(raw),
        email: "invited@example.test",
        kind: "invite",
        organizationId: "company:client-a",
        role: "member",
        expiresAt: new Date(Date.now() + 60000),
        createdAt: new Date(),
        createdBy: admin._id.toString(),
        delivery: "sent",
      });
    let r = await post({ action: "accept", token: raw, password });
    assert.equal(r.status, 200, JSON.stringify(r.value));
    assert.equal(
      await db
        .collection("users")
        .countDocuments({ email: "invited@example.test" }),
      1,
    );
    assert.equal(
      (await post({ action: "accept", token: raw, password })).status,
      400,
    );
    console.log("PASS invitation verifies identity and cannot be replayed");
    const expired = randomBytes(32).toString("hex");
    await db
      .collection("accountTokens")
      .insertOne({
        _id: digest(expired),
        email: "expired@example.test",
        kind: "invite",
        expiresAt: new Date(Date.now() - 1000),
        createdAt: new Date(),
        createdBy: admin._id.toString(),
        delivery: "sent",
      });
    assert.equal(
      (await post({ action: "accept", token: expired, password })).status,
      400,
    );
    assert.equal(
      await db
        .collection("users")
        .countDocuments({ email: "expired@example.test" }),
      0,
    );
    console.log("PASS expired invitation creates no account");
    const reset = randomBytes(32).toString("hex");
    await db
      .collection("accountTokens")
      .insertOne({
        _id: digest(reset),
        email: "invited@example.test",
        kind: "reset",
        expiresAt: new Date(Date.now() + 60000),
        createdAt: new Date(),
        createdBy: "password-reset",
        delivery: "sent",
      });
    const nextPassword = randomBytes(20).toString("hex");
    assert.equal(
      (await post({ action: "accept", token: reset, password: nextPassword }))
        .status,
      200,
    );
    const u = await db
      .collection("users")
      .findOne({ email: "invited@example.test" });
    assert(await bcrypt.compare(nextPassword, u.password));
    assert.equal(u.sessionVersion, 1);
    assert.equal(
      (await post({ action: "accept", token: reset, password: nextPassword }))
        .status,
      400,
    );
    console.log(
      "PASS password reset changes hash, revokes sessions, and is single-use",
    );
    const memberInvite = randomBytes(32).toString("hex");
    await db
      .collection("accountTokens")
      .insertOne({
        _id: digest(memberInvite),
        email: "invited@example.test",
        kind: "invite",
        organizationId: "operator:operator-a",
        role: "admin",
        expiresAt: new Date(Date.now() + 60000),
        createdAt: new Date(),
        createdBy: admin._id.toString(),
        delivery: "sent",
      });
    assert.equal(
      (await post({ action: "accept", token: memberInvite, password })).status,
      409,
    );
    console.log(
      "PASS existing identity requires authenticated membership acceptance",
    );
    const newEmail = "concurrent@example.test";
    const tokens = [
      randomBytes(32).toString("hex"),
      randomBytes(32).toString("hex"),
    ];
    await db
      .collection("accountTokens")
      .insertMany(
        tokens.map((raw, i) => ({
          _id: digest(raw),
          email: newEmail,
          kind: "invite",
          organizationId: i ? "operator:operator-a" : "company:client-a",
          role: "member",
          expiresAt: new Date(Date.now() + 60000),
          createdAt: new Date(),
          createdBy: admin._id.toString(),
          delivery: "sent",
        })),
      );
    const results = await Promise.all(
      tokens.map((token) => post({ action: "accept", token, password })),
    );
    assert.equal(
      results.filter((r) => r.status === 200).length,
      1,
      JSON.stringify(results),
    );
    assert.equal(
      await db.collection("users").countDocuments({ email: newEmail }),
      1,
    );
    console.log(
      "PASS simultaneous invitations cannot create duplicate identities",
    );
  } finally {
    await c.close();
  }
})().catch((e) => {
  console.error(e.stack);
  process.exitCode = 1;
});
