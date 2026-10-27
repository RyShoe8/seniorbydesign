const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const ts = require("typescript");
require.extensions[".ts"] = (module, filename) =>
  module._compile(
    ts.transpileModule(fs.readFileSync(filename, "utf8"), {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2020,
      },
    }).outputText,
    filename,
  );
const {
  parseImport,
  canRead,
  actionMembership,
  dateOnly,
  documentUrl,
  staffRole,
} = require("../lib/portal/policy.ts");
test("private portal middleware permits only Ryan while preserving staff admin access", async () => {
  const { middleware } = require("../middleware.ts");
  const { NextRequest } = require("next/server");
  const { encode } = require("next-auth/jwt");
  const previous = process.env.NEXTAUTH_SECRET;
  process.env.NEXTAUTH_SECRET = "isolated-portal-access-test-secret";
  try {
    const request = async (path, identity) => {
      const headers = {};
      if (identity) headers.cookie = `next-auth.session-token=${await encode({ token: identity, secret: process.env.NEXTAUTH_SECRET })}`;
      return middleware(new NextRequest(`http://localhost:3100${path}`, { headers }));
    };
    assert.equal((await request("/portal")).status, 307);
    assert.equal((await request("/api/portal/projects")).status, 401);
    for (const identity of [
      { email: "glenn@sbdid.com", role: "admin" },
      { email: "team@example.test", role: "team" },
      { email: "client@example.test", role: "external" },
      { email: "ryanschumacher@themediashop.co", role: "external" },
    ]) {
      for (const path of ["/portal", "/admin/portal", "/api/portal/projects", "/api/portal/imports"])
        assert.equal((await request(path, identity)).status, 403);
    }
    const ryan = { email: "ryanschumacher@themediashop.co", role: "admin" };
    assert.equal((await request("/portal", ryan)).status, 200);
    assert.equal((await request("/api/portal/imports", ryan)).status, 200);
    assert.equal((await request("/admin/users", { email: "glenn@sbdid.com", role: "admin" })).status, 200);
    assert.equal((await request("/admin", { email: "team@example.test", role: "team" })).status, 200);
    const root = await middleware(new NextRequest("https://clients.seniorbydesign.com/"));
    assert.equal(root.headers.get("location"), "https://clients.seniorbydesign.com/portal");
    assert.equal((await request("/account/login")).status, 200);
  } finally {
    if (previous === undefined) delete process.env.NEXTAUTH_SECRET;
    else process.env.NEXTAUTH_SECRET = previous;
  }
});
const source = () => [
  {
    _id: "project-1",
    companyId: "client-a",
    companyName: "Client A",
    name: "Project One",
    location: "Dallas, TX",
    address: "Example address",
    operator: "Operator A",
    summary: "Refresh",
    portalVisible: false,
    scopes: [
      {
        code: "MC",
        label: "Memory Care",
        approval: "Needs Approval",
        quote: "001",
      },
    ],
    payment: "Awaiting confirmation",
    order: "Awaiting confirmation",
    install: "",
    documents: [
      {
        id: "source-doc",
        name: "Quote.pdf",
        url: "https://seniorbydesign.sharepoint.com/sites/Example/Quote.pdf",
        category: "Quotes",
        areas: ["MC"],
        clientVisible: false,
        historical: true,
      },
    ],
  },
];
test("original JSON converts company/operator relationships, statuses, dates and history", () => {
  const p = parseImport(source()).projects[0];
  assert.equal(p.companyId, "company:client-a");
  assert.equal(p.operatorId, "operator:operator-a");
  assert.equal(p.payment, "Awaiting Confirmation");
  assert.equal(p.install, null);
  assert.equal(p.scopes[0].quote, "001");
  assert.equal(p.documents[0].historical, true);
  assert.equal("areas" in p.documents[0], false);
  assert.equal("portalVisible" in p, false);
});
test("normalized and original format produce identical source identities", () => {
  const s = source()[0];
  const { _id, companyId, companyName, ...rest } = s;
  const n = {
    schemaVersion: 1,
    companies: [
      {
        companyid: companyId,
        companyname: companyName,
        projects: [
          {
            ...rest,
            id: _id,
            operator: { operatorid: "operator-a", operatorname: "Operator A" },
          },
        ],
      },
    ],
  };
  assert.deepEqual(parseImport(n).projects, parseImport([s]).projects);
});
test("reject duplicate projects, quote conflicts and mismatched labels", () => {
  assert.throws(
    () => parseImport([...source(), ...source()]),
    /duplicate project/,
  );
  const a = source(),
    b = source()[0];
  b._id = "different";
  assert.throws(() => parseImport([...a, b]), /duplicate quote/);
  a[0].scopes[0].label = "Wrong";
  assert.throws(() => parseImport(a), /label/);
});
test("unknown payment is not guessed", () => {
  const s = source();
  s[0].payment = "Maybe paid";
  assert.throws(() => parseImport(s), /Payment/);
});
test("strict calendar date conversion", () => {
  assert.equal(dateOnly("02/29/2024"), "2024-02-29");
  assert.throws(() => dateOnly("02/29/2025"));
  assert.throws(() => dateOnly("13/10/2026"));
});
test("document redirects are restricted to exact HTTPS SharePoint origin", () => {
  assert.throws(() =>
    documentUrl("https://seniorbydesign.sharepoint.com.evil.test/file"),
  );
  assert.throws(() => documentUrl("http://seniorbydesign.sharepoint.com/file"));
  assert.throws(() =>
    documentUrl("https://user@seniorbydesign.sharepoint.com/file"),
  );
});
const actor = (org, role = "member") => ({
  id: "user",
  email: "user@example.test",
  memberships: [{ organizationId: org, role, active: true }],
});
const project = {
  companyId: "company:a",
  operatorId: "operator:x",
  archived: false,
  operatorApproval: false,
};
test("company users cannot cross tenant boundaries", () => {
  assert.equal(canRead(actor("company:a"), project), true);
  assert.equal(canRead(actor("company:b"), project), false);
});
test("operators access assigned projects across companies only", () => {
  assert.equal(canRead(actor("operator:x"), project), true);
  assert.equal(
    canRead(actor("operator:x"), { ...project, companyId: "company:b" }),
    true,
  );
  assert.equal(
    canRead(actor("operator:x"), { ...project, operatorId: "operator:y" }),
    false,
  );
});
test("operator viewing does not imply approval and members cannot approve", () => {
  assert.equal(
    !!actionMembership(actor("operator:x", "admin"), project, true),
    false,
  );
  assert.equal(
    !!actionMembership(
      actor("operator:x", "admin"),
      { ...project, operatorApproval: true },
      true,
    ),
    true,
  );
  assert.equal(!!actionMembership(actor("company:a"), project, true), false);
});
test("only designated global admins retain Administrator role", () => {
  assert.equal(staffRole({ email: "Glenn@sbdid.com", role: "admin" }), "admin");
  assert.equal(
    staffRole({ email: "someone@example.test", role: "admin" }),
    "team",
  );
  assert.equal(
    staffRole({ email: "glenn@sbdid.com", role: "external" }),
    undefined,
  );
});
test("inactive memberships and archived projects cannot leak", () => {
  const a = actor("company:a");
  a.memberships[0].active = false;
  assert.equal(canRead(a, project), false);
  assert.equal(
    canRead(actor("company:a"), { ...project, archived: true }),
    false,
  );
});
