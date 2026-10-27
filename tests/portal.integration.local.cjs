if (process.env.SBD_PORTAL_TEST_ONLY !== "true")
  throw new Error(
    "Run through the isolated integration runner. Never run against a real database.",
  );
const fs = require("fs");
const { MongoClient, ObjectId } = require("mongodb");
const bcrypt = require("bcryptjs");
const { randomBytes, randomUUID, createHash } = require("crypto");
const assert = require("assert/strict");
const origin = "http://localhost:3102";
class Browser {
  cookies = new Map();
  async request(path, data, form = false, method) {
    const r = await fetch(origin + path, {
      method: method || (data ? "POST" : "GET"),
      redirect: "manual",
      headers: {
        cookie: [...this.cookies].map(([k, v]) => `${k}=${v}`).join("; "),
        ...(data
          ? {
              "content-type": form
                ? "application/x-www-form-urlencoded"
                : "application/json",
              origin,
            }
          : {}),
      },
      body: data
        ? form
          ? new URLSearchParams(data).toString()
          : JSON.stringify(data)
        : undefined,
    });
    for (const s of r.headers.getSetCookie()) {
      const pair = s.split(";")[0],
        idx = pair.indexOf("=");
      this.cookies.set(pair.slice(0, idx), pair.slice(idx + 1));
    }
    const txt = await r.text();
    let value;
    try {
      value = JSON.parse(txt);
    } catch {
      value = txt;
    }
    return { status: r.status, value };
  }
  async login(email, password) {
    const csrf = await this.request("/api/auth/csrf");
    const r = await this.request(
      "/api/auth/callback/credentials",
      { email, password, csrfToken: csrf.value.csrfToken, json: "true" },
      true,
    );
    assert.equal(r.status, 200);
    const s = await this.request("/api/auth/session");
    assert.equal(s.value.user?.email, email);
  }
}
(async () => {
  const client = await new MongoClient(
    "mongodb://127.0.0.1:27189/?directConnection=true",
  ).connect();
  try {
    const db = client.db("seniorbydesign");
    const password = randomBytes(20).toString("hex");
    const hash = await bcrypt.hash(password, 10);
    const adminId = new ObjectId(),
      clientId = new ObjectId(),
      otherId = new ObjectId(),
      operatorId = new ObjectId();
    await db.collection("users").insertMany(
      [
        {
          _id: adminId,
          email: "ryanschumacher@themediashop.co",
          role: "admin",
        },
        { _id: clientId, email: "client@example.test", role: "external" },
        { _id: otherId, email: "other@example.test", role: "external" },
        { _id: operatorId, email: "operator@example.test", role: "external" },
      ].map((u) => ({
        ...u,
        password: hash,
        emailVerifiedAt: new Date(),
        sessionVersion: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      })),
    );
    const admin = new Browser(),
      customer = new Browser(),
      other = new Browser(),
      operator = new Browser();
    await admin.login("ryanschumacher@themediashop.co", password);
    await customer.login("client@example.test", password);
    await other.login("other@example.test", password);
    await operator.login("operator@example.test", password);
    console.log("PASS sign-in for staff and three external identities");
    const staffId = new ObjectId();
    await db.collection("users").insertOne({ _id: staffId, email: "staff@example.test", password: hash, role: "team", sessionVersion: 0, createdAt: new Date(), updatedAt: new Date() });
    const teammate = new Browser();
    await teammate.login("staff@example.test", password);
    assert.equal((await teammate.request("/api/portal/projects")).status, 403);
    assert.equal((await admin.request("/api/admin/users", { id: staffId.toString(), portalAccess: true }, false, "PUT")).status, 200);
    await teammate.login("staff@example.test", password);
    assert.equal((await teammate.request("/api/portal/projects")).status, 200);
    assert.equal((await teammate.request("/api/admin/users", { id: staffId.toString(), portalAccess: false }, false, "PUT")).status, 403);
    assert.equal((await admin.request("/api/admin/users", { id: staffId.toString(), portalAccess: false }, false, "PUT")).status, 200);
    assert.equal((await teammate.request("/api/portal/projects")).status, 401);
    console.log("PASS administrator-only portal grants and immediate staff revocation");
    const input = [
      {
        _id: "test-project",
        companyId: "client-a",
        companyName: "Client A",
        name: "Refresh",
        location: "Dallas, TX",
        address: "Example",
        operator: "Operator A",
        summary: "Synthetic integration fixture",
        scopes: [
          {
            code: "MC",
            label: "Memory Care",
            approval: "Needs Approval",
            quote: "TEST-001",
          },
        ],
        payment: "Awaiting confirmation",
        order: "Awaiting confirmation",
        install: "",
        documents: [
          {
            name: "Quote.pdf",
            url: "https://seniorbydesign.sharepoint.com/sites/Test/Quote-revision-1.pdf",
            category: "Quotes",
            historical: false,
          },
        ],
      },
    ];
    let result = await admin.request("/api/portal/imports", {
      action: "preview",
      data: input,
    });
    assert.equal(result.status, 200, JSON.stringify(result.value));
    result = await admin.request("/api/portal/imports", {
      action: "commit",
      id: result.value.id,
    });
    assert.equal(result.status, 200, JSON.stringify(result.value));
    console.log("PASS import preview and atomic commit");
    const updatedSource = structuredClone(input);
    updatedSource[0].scopes[0].approval = "Approved";
    let updatePreview = await admin.request("/api/portal/imports", {
      action: "preview",
      data: updatedSource,
    });
    assert.equal(updatePreview.status, 200);
    assert.equal(
      (
        await admin.request("/api/portal/imports", {
          action: "commit",
          id: updatePreview.value.id,
        })
      ).status,
      200,
    );
    assert.equal(
      (
        await db
          .collection("portalProjects")
          .findOne({ sourceId: "test-project" })
      ).scopes[0].approval,
      "Approved",
    );
    console.log("PASS source approval updates before portal workflow begins");

    await db.collection("portalMemberships").insertMany(
      [
        {
          userId: clientId.toString(),
          organizationId: "company:client-a",
          email: "client@example.test",
        },
        {
          userId: operatorId.toString(),
          organizationId: "operator:operator-a",
          email: "operator@example.test",
        },
      ].map((m) => ({
        ...m,
        _id: m.userId + ":" + m.organizationId,
        role: "admin",
        active: true,
      })),
    );
    let c = await customer.request("/api/portal/projects");
    assert.equal(c.value.projects.length, 1);
    let p = c.value.projects[0];
    assert.equal(
      (await other.request("/api/portal/projects")).status,
      403,
    );
    assert.equal(
      (await operator.request("/api/portal/projects")).value.projects.length,
      1,
    );
    assert.equal((await customer.request("/api/admin/users")).status, 403);
    console.log("PASS tenant isolation and CMS exclusion");
    const action = async (b, action, extra = {}) =>
      b.request("/api/portal/workflow", {
        projectId: p._id,
        version: p.version,
        eventId: randomUUID(),
        action,
        ...extra,
      });
    result = await action(admin, "bind-quote", {
      quote: "TEST-001",
      documentId: p.documents[0].id,
      confirmStableRevision: true,
      note: "Synthetic immutable revision",
    });
    assert.equal(result.status, 200, JSON.stringify(result.value));
    p = (await customer.request("/api/portal/projects")).value.projects[0];
    assert.equal(
      (
        await action(operator, "approve", {
          quote: "TEST-001",
          revision: p.scopes[0].revision,
        })
      ).status,
      403,
    );
    result = await action(customer, "approve", {
      quote: "TEST-001",
      revision: p.scopes[0].revision,
    });
    assert.equal(result.status, 200, JSON.stringify(result.value));
    console.log("PASS revision-bound client approval and operator restriction");
    p = (await customer.request("/api/portal/projects")).value.projects[0];
    result = await action(customer, "report-payment", {
      note: "Synthetic payment report",
    });
    assert.equal(result.status, 200);
    p = (await customer.request("/api/portal/projects")).value.projects[0];
    assert.equal(p.payment, "Awaiting Confirmation");
    result = await action(customer, "status", {
      field: "payment",
      value: "Paid",
      note: "Attempt",
    });
    assert.equal(result.status, 403);
    console.log("PASS reporting cannot mark payment Paid");
    result = await admin.request("/api/portal/imports", {
      action: "preview",
      data: input,
    });
    assert.equal(result.status, 200);
    result = await admin.request("/api/portal/imports", {
      action: "commit",
      id: result.value.id,
    });
    assert.equal(result.status, 200);
    p = (await customer.request("/api/portal/projects")).value.projects[0];
    assert.equal(p.scopes[0].approval, "Approved");
    assert.equal(await db.collection("portalProjects").countDocuments(), 1);
    console.log("PASS reimport preserves approval and creates no duplicates");
    result = await admin.request("/api/portal/imports", {
      action: "preview",
      data: input,
    });
    assert.equal(result.value.changes[0].action, "Unchanged");
    console.log("PASS identical import reports unchanged");
    result = await customer.request("/api/portal/organizations", {
      action: "membership",
      organizationId: "company:client-a",
      memberId: clientId + ":company:client-a",
      role: "member",
      active: true,
    });
    assert.equal(result.status, 400);
    console.log("PASS last-admin protection");
    const secondProject = structuredClone(input[0]);
    secondProject._id = "second-project";
    secondProject.scopes[0].quote = "TEST-002";
    const batch = await admin.request("/api/portal/imports", {
      action: "preview",
      data: [secondProject, input[0]],
    });
    assert.equal(batch.status, 200);
    p = (await customer.request("/api/portal/projects")).value.projects[0];
    assert.equal(
      (
        await action(admin, "status", {
          field: "payment",
          value: "Paid",
          note: "Synthetic reconciliation",
        })
      ).status,
      200,
    );
    assert.equal(
      (
        await admin.request("/api/portal/imports", {
          action: "commit",
          id: batch.value.id,
        })
      ).status,
      409,
    );
    assert.equal(
      await db
        .collection("portalProjects")
        .countDocuments({ sourceId: "second-project" }),
      0,
    );
    console.log(
      "PASS stale preview rejects entire batch without partial writes",
    );
    const fresh = await admin.request("/api/portal/imports", {
      action: "preview",
      data: [secondProject],
    });
    assert.equal(
      (
        await admin.request("/api/portal/imports", {
          action: "commit",
          id: fresh.value.id,
        })
      ).status,
      200,
    );
    assert.equal(
      (
        await admin.request("/api/portal/imports", {
          action: "rollback",
          id: fresh.value.id,
        })
      ).status,
      200,
    );
    assert.equal(
      (
        await db
          .collection("portalProjects")
          .findOne({ sourceId: "second-project" })
      ).archived,
      true,
    );
    console.log(
      "PASS rollback archives newly imported projects without deleting history",
    );

    await db
      .collection("users")
      .updateOne({ _id: clientId }, { $set: { disabled: true } });
    assert.equal((await customer.request("/api/portal/projects")).status, 401);
    console.log("PASS account disable invalidates existing session");
    console.log("INTEGRATION CHECKS PASSED");
  } finally {
    await client.close();
  }
})().catch((e) => {
  console.error(e.stack);
  process.exitCode = 1;
});
