// End-to-end sync against a fake Smartsheet API and a real local database.
// Nothing here contacts Smartsheet. Run with: node --test tests/portal.smartsheet.local.cjs
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const ts = require("typescript");
const { MongoMemoryReplSet } = require(path.join(os.tmpdir(), "sbd-portal-test-tools", "node_modules", "mongodb-memory-server"));
const root = path.resolve(__dirname, "..");
const Module = require("node:module");
for (const extension of [".ts"]) require.extensions[extension] = (module, filename) => {
  const nativeRequire = Module.createRequire(filename);
  module.require = (id) => nativeRequire(id.startsWith("@/") ? path.join(root, id.slice(2)) : id);
  module._compile(ts.transpileModule(fs.readFileSync(filename, "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true } }).outputText, filename);
};

const TITLES = ["Owner Group", "Project Type", "Quote No", "SBD install week", "Community Name", "Assigned to", "Portal Visible", "Status", "Notes", "Approved Budget", "Date Requested", "Client Contact", "Portal Summary", "Address", "City", "State", "Project Phase", "Purchase Order"];
const columns = TITLES.map((title, index) => ({ id: index + 1, title, type: title === "Assigned to" ? "CONTACT_LIST" : undefined }));
const cell = (title, value) => ({ columnId: columns.find((c) => c.title === title).id, value, displayValue: typeof value === "boolean" ? undefined : String(value) });
const makeRow = (id, values) => ({ id, cells: Object.entries(values).map(([title, value]) => cell(title, value)) });
const sheet = {
  id: 77, name: "Active Projects",
  columns,
  rows: [
    makeRow(1, { "Community Name": "1. On Order - Need to Install" }),
    makeRow(2, { "Owner Group": "002-Experience Senior Living", "Community Name": "ESL - Roland Park", "Portal Visible": false, Status: "Approved", Notes: "not for the portal yet" }),
    makeRow(3, { "Owner Group": "013-ReNew REIT", "Community Name": "GA - The Phoenix", "Portal Visible": true, Status: "Paid", "Project Phase": "8. Procurement", Notes: "client unhappy, internal", City: "Gainesville", State: "GA", "Approved Budget": 138317, "SBD install week": "2026-11-18", "Project Type": "Remodel", "Quote No": 664, "Purchase Order": "3106" }),
    makeRow(4, { "Community Name": "2026 Totals", "Portal Visible": true }),
  ],
};
const requests = [];
const realFetch = global.fetch;
global.fetch = async (url, init = {}) => {
  const target = String(url), method = init.method || "GET";
  requests.push({ target, method, body: init.body ? JSON.parse(init.body) : undefined });
  if (!target.startsWith("https://api.smartsheet.com/")) return realFetch(url, init);
  const respond = (data) => new Response(JSON.stringify(data), { status: 200, headers: { "content-type": "application/json" } });
  if (method === "GET" && target.includes("/sheets/77")) return respond(sheet);
  if (method === "PUT" && target.endsWith("/sheets/77/rows")) {
    for (const update of JSON.parse(init.body)) {
      const row = sheet.rows.find((r) => r.id === update.id);
      for (const change of update.cells) {
        row.cells = row.cells.filter((c) => c.columnId !== change.columnId);
        row.cells.push({ columnId: change.columnId, value: change.value, displayValue: String(change.value) });
      }
    }
    return respond({ result: [] });
  }
  return new Response(JSON.stringify({ message: `Unexpected ${method} ${target}` }), { status: 400 });
};
const writesTo = () => requests.filter((r) => r.target.startsWith("https://api.smartsheet.com/") && r.method !== "GET");

test("sync against the sheet's real shape", async (t) => {
  const mongo = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
  process.env.MONGODB_URI = mongo.getUri();
  process.env.SMARTSHEET_ACCESS_TOKEN = "fake-token-for-tests";
  process.env.SMARTSHEET_SHEET_ID = "77";
  delete process.env.SMARTSHEET_WRITES_ENABLED;
  const { syncSheet, pushProjectSafely } = require("../lib/smartsheet/sync.ts");
  const { collections } = require("../lib/portal/db.ts");
  const clientPromise = require("../lib/mongodb.ts");
  t.after(async () => { await (await (clientPromise.default || clientPromise)()).close(); await mongo.stop(); });
  const c = await collections();

  await t.test("preview stores nothing and writes nothing", async () => {
    const { plan } = await syncSheet({ dryRun: true });
    assert.deepEqual(plan.map((p) => [p.project, p.action]), [["GA - The Phoenix", "create"]]);
    assert.equal(await c.projects.countDocuments(), 0);
    assert.equal(await c.organizations.countDocuments(), 0);
    assert.deepEqual(writesTo(), []);
  });

  await t.test("only the ticked project row is ingested: no section headings, totals or unticked rows", async () => {
    await syncSheet();
    const all = await c.projects.find({}).toArray();
    assert.equal(all.length, 1);
    const p = all[0];
    assert.equal(p.name, "GA - The Phoenix");
    assert.equal(p.companyId, "company:renew-reit");
    assert.equal(p.location, "Gainesville, GA");
    assert.equal(p.install, "2026-11-18");
    assert.equal(p.payment, "Paid");
    assert.equal(p.request.projectPhase, "8. Procurement");
    assert.equal(p.request.stage, "Procurement");
    assert.equal(p.request.internalNotes, "client unhappy, internal");
    assert.equal(p.smartsheet.details["Purchase Order"], "3106");
    assert.equal((await c.organizations.findOne({ _id: "company:renew-reit" })).name, "ReNew REIT");
    assert.ok(await c.organizations.findOne({ _id: "operator:renew-reit" }));
  });

  await t.test("with writes off, a sync sends nothing to the sheet", async () => {
    assert.deepEqual(writesTo(), []);
    const before = (await c.projects.findOne({})).version;
    await syncSheet();
    assert.equal((await c.projects.findOne({})).version, before, "an unchanged re-run must not bump the project");
  });

  await t.test("with writes off, a portal edit stays in the portal", async () => {
    const p = await c.projects.findOne({});
    await c.projects.updateOne({ _id: p._id }, { $set: { "request.projectPhase": "9. Project Closeout" } });
    await pushProjectSafely(p._id);
    assert.deepEqual(writesTo(), []);
  });

  await t.test("with writes on, only the changed cell is sent, by update, and nothing is blanked", async () => {
    process.env.SMARTSHEET_WRITES_ENABLED = "true";
    const p = await c.projects.findOne({});
    await c.projects.updateOne({ _id: p._id }, { $set: { summary: "", "request.contactName": "" } });
    await pushProjectSafely(p._id);
    const writes = writesTo();
    assert.equal(writes.length, 1);
    assert.equal(writes[0].method, "PUT");
    assert.deepEqual(writes[0].body, [{ id: 3, cells: [{ columnId: columns.find((col) => col.title === "Project Phase").id, value: "9. Project Closeout", strict: false }] }]);
  });

  await t.test("a phase changed on the sheet reaches the portal, and the echo does not write back", async () => {
    const row = sheet.rows[2];
    const phase = columns.find((col) => col.title === "Project Phase").id;
    row.cells.find((x) => x.columnId === phase).value = "10. Completed";
    row.cells.find((x) => x.columnId === phase).displayValue = "10. Completed";
    const count = writesTo().length;
    await syncSheet();
    assert.equal((await c.projects.findOne({})).request.projectPhase, "10. Completed");
    await syncSheet();
    assert.equal(writesTo().length, count);
  });

  await t.test("every request made was a read or a cell update", () => {
    const methods = new Set(requests.filter((r) => r.target.startsWith("https://api.smartsheet.com/")).map((r) => r.method));
    assert.deepEqual([...methods].sort(), ["GET", "PUT"]);
  });

  await t.test("an owner spelled differently uses the existing company instead of creating another", async () => {
    await c.organizations.insertOne({ _id: "company:legendliving", type: "company", slug: "legendliving", name: "LegendLiving", active: true, version: 1, createdAt: new Date() });
    sheet.rows.push(makeRow(5, { "Owner Group": "099-Legend Living", "Community Name": "TX - Legend", "Portal Visible": true, Status: "Quoting" }));
    await syncSheet();
    assert.equal((await c.projects.findOne({ name: "TX - Legend" })).companyId, "company:legendliving");
    assert.equal(await c.organizations.findOne({ _id: "company:legend-living" }), null);
    sheet.rows.pop();
  });

  await t.test("a row whose quote is on a portal project attaches to it, read-only, leaving the project alone", async () => {
    await c.projects.insertOne({ _id: "existing", sourceId: "existing", name: "The Community", companyId: "company:legendliving", operatorId: "company:legendliving", location: "", address: "", summary: "", scopes: [{ code: "MC", label: "Memory Care", quote: "900", approval: "Approved", revision: 1 }, { code: "AL", label: "Assisted Living", quote: "901", approval: "Approved", revision: 1 }], documents: [{ id: "d", name: "Quote", url: "u", category: "Quotes", historical: false }], payment: "Paid", order: "Ordered", install: null, version: 1, archived: false, operatorApproval: false, workflowTouched: false, updatedAt: new Date() });
    const before = await c.projects.findOne({ _id: "existing" });
    const count = await c.projects.countDocuments();
    sheet.rows.push(makeRow(6, { "Owner Group": "099-Legend Living", "Community Name": "TX - The Community - MC", "Portal Visible": true, "Quote No": 900, "SBD install week": "2027-02-01", "Project Phase": "8. Procurement", Notes: "internal only" }));
    sheet.rows.push(makeRow(7, { "Owner Group": "099-Legend Living", "Community Name": "TX - The Community - AL", "Portal Visible": true, "Quote No": 901, "SBD install week": "2027-01-15" }));
    const writes = writesTo().length;

    const preview = await syncSheet({ dryRun: true });
    assert.equal(preview.plan.find((p) => p.rowId === 6).action, "quote");
    assert.deepEqual(preview.plan.find((p) => p.rowId === 6).issues, []);
    assert.equal((await c.projects.findOne({ _id: "existing" })).sheetQuoteRows, undefined, "preview stores nothing");

    await syncSheet();
    assert.equal(await c.projects.countDocuments(), count, "no new project");
    const after = await c.projects.findOne({ _id: "existing" });
    assert.deepEqual(after.sheetQuoteRows.map((r) => [r.quote, r.install, r.projectPhase]), [["900", "2027-02-01", "8. Procurement"], ["901", "2027-01-15", undefined]]);
    assert.equal(after.sheetQuoteRows[0].details.Notes, "internal only");
    for (const field of ["version", "scopes", "documents", "payment", "order", "install", "name", "archived", "updatedAt"]) assert.deepEqual(after[field], before[field], field);
    assert.equal(after.smartsheet, undefined);
    assert.equal(writesTo().length, writes, "nothing is written to the sheet");

    const { projectInstall, clientQuoteRow } = require("../lib/portal/requests.ts");
    assert.equal(projectInstall(after), "2027-01-15");
    assert.equal(projectInstall({ ...after, install: "2027-03-01" }), "2027-03-01");
    const client = clientQuoteRow(after.sheetQuoteRows[0]);
    assert.deepEqual(Object.keys(client).sort(), ["install", "name", "projectPhase", "quote"]);
    assert.doesNotMatch(JSON.stringify(client), /internal only/);

    const repeat = JSON.stringify(after.sheetQuoteRows);
    await syncSheet();
    assert.equal(JSON.stringify((await c.projects.findOne({ _id: "existing" })).sheetQuoteRows), repeat);

    sheet.rows.find((r) => r.id === 6).cells.find((x) => x.columnId === columns.find((col) => col.title === "Portal Visible").id).value = false;
    await syncSheet();
    assert.deepEqual((await c.projects.findOne({ _id: "existing" })).sheetQuoteRows.map((r) => r.quote), ["901"], "unticking drops the row");

    sheet.rows.splice(-2, 2);
    await syncSheet();
    const cleared = await c.projects.findOne({ _id: "existing" });
    assert.equal(cleared.sheetQuoteRows, undefined, "removing the rows clears them");
    assert.equal(cleared.scopes.length, 2, "quotes stay");
  });

  await t.test("a row removed from the sheet unlinks the project and keeps it", async () => {
    const [removed] = sheet.rows.splice(2, 1);
    await syncSheet();
    const p = await c.projects.findOne({ name: "GA - The Phoenix" });
    assert.ok(p, "project still exists");
    assert.equal(p.smartsheet, undefined);
    sheet.rows.push(removed);
  });
});
