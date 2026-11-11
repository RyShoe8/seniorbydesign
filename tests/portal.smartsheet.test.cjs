const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const ts = require("typescript");
require.extensions[".ts"] = (module, filename) =>
  module._compile(
    ts.transpileModule(fs.readFileSync(filename, "utf8"), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
    }).outputText,
    filename,
  );
const { reconcile, stageFromStatus, statusKnown, columnReport, FIELD_MAP, isSyncTicked, ownerName, rowDetails } = require("../lib/smartsheet/mapping.ts");
const { safeCells } = require("../lib/smartsheet/client.ts");
const { projectPhases } = require("../lib/portal/requests.ts");
const { accountOrigin, sameSiteRequest } = require("../lib/portal/origins.ts");

// The 63 column titles on the live "Active Projects" sheet.
const TITLES = ["Weeks Until", "Owner Group", "Project No", "Purchase Order", "Project Type", "Quote No", "BOL Complete Date", "SBD install week", "Community Name", "Assigned to", "Portal Visible", "Support/ Install", "Status", "Install Team", "Notes", "Status Prep Notes", "Estimated budget", "Approved Budget", "Design Fee", "Date Requested", "Date Approved", "Client Contact", "Portal Summary", "Address", "City", "State", "Sales Tax %", "Cust Del Date Notified", "Build Sq Footage", "Contract Notes", "FFE Contract Executed", "Design Contract Executed", "Start Date", "Project Phase", "Cost Per Sf Footage", "Est C/O Date", "Architect", "Xmas", "Region", "Break Ground Date", "BOL Start Date", "Mkt Welcome Ctr. Install", "Models", "Common Area Sg Footage", "Schedule Moving Truck", "Schedule Temps", "Contact", "Construction", "Project Start Date", "Schematic Docs Available", "Design Devlpt Docs Available", "Permit Set Deadline", "Construction Docs Deadline", "# of Rooms", "TTL Units", "AL Units", "IL Units", "MC Beds", "Cottage Units", "SNF Units", "Beds", "Revit Year", "Due Date"];
const columns = TITLES.map((title, index) => ({ id: index + 1, title, type: title === "Assigned to" ? "CONTACT_LIST" : undefined }));
const id = (title) => columns.find((column) => column.title === title).id;
const row = (values) => ({ id: 500, cells: Object.entries(values).map(([title, value]) => ({ columnId: id(title), value, displayValue: value === true || value === false ? undefined : String(value) })) });
const ctx = {
  orgName: (orgId) => ({ "company:experience-senior-living": "Experience Senior Living", "operator:experience-senior-living": "Experience Senior Living" })[orgId] || null,
  orgId: (name, type) => `${type}:${name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
};
const sheetRow = (changes = {}) => row({ "Owner Group": "002-Experience Senior Living", "Community Name": "ESL - Longmont", "Portal Visible": true, Status: "Quoting", "Project Phase": "4. Design Dev", Notes: "internal comment", "Project Type": "Remodel", ...changes });
const ingested = () => reconcile({ project: { _id: "p", sourceId: "p", name: "", companyId: "", operatorId: "", location: "", address: "", summary: "", scopes: [], documents: [], payment: "Awaiting Confirmation", order: "Awaiting Confirmation", install: null, version: 1, archived: false, operatorApproval: false, workflowTouched: false, updatedAt: new Date() }, row: sheetRow({ City: "Longmont", State: "CO", "SBD install week": "2026-12-16", "Portal Summary": "Finish board", "Quote No": 616, "Approved Budget": 30000 }), columns, ctx, ingest: true });

test("every mapped field finds its column on the real sheet; the rest are staff reference only", () => {
  const report = columnReport(columns);
  assert.deepEqual(report.fields.filter((field) => !field.column).map((field) => field.key), ["request.summary", "request.clientNotes"]);
  assert.equal(report.reference.length + new Set(FIELD_MAP.flatMap((field) => field.columns).filter((title) => TITLES.includes(title))).size, 63);
  assert.ok(report.reference.includes("Purchase Order"));
  assert.ok(!report.reference.includes("Notes"));
});
test("ticking Portal Visible ingests the row's fields, stripped of the owner code", () => {
  const { project, issues, cells } = ingested();
  assert.deepEqual(issues, []);
  assert.deepEqual(cells, []);
  assert.equal(project.name, "ESL - Longmont");
  assert.equal(ownerName("002-Experience Senior Living"), "Experience Senior Living");
  assert.equal(project.companyId, "company:experience-senior-living");
  assert.equal(project.operatorId, "operator:experience-senior-living");
  assert.equal(project.location, "Longmont, CO");
  assert.equal(project.install, "2026-12-16");
  assert.equal(project.summary, "Finish board");
  assert.equal(project.request.projectPhase, "4. Design Dev");
  assert.equal(project.request.stage, "Quote in Progress");
  assert.equal(project.request.quoteReference, "616");
  assert.equal(project.request.quotedAmount, 30000);
  assert.equal(project.request.internalNotes, "internal comment");
  assert.equal(project.archived, false);
});
test("a repeat sync with nothing changed does nothing, so webhooks cannot loop", () => {
  const first = ingested();
  const again = reconcile({ project: first.project, snapshot: first.snapshot, row: sheetRow({ City: "Longmont", State: "CO", "SBD install week": "2026-12-16", "Portal Summary": "Finish board", "Quote No": 616, "Approved Budget": 30000 }), columns, ctx });
  assert.deepEqual([again.changed, again.cells, again.issues], [[], [], []]);
});
const after = (project) => ({ City: "Longmont", State: "CO", "SBD install week": "2026-12-16", "Portal Summary": project ?? "Finish board", "Quote No": 616, "Approved Budget": 30000 });
test("Project Phase syncs both ways, word for word, and unknown phases are reported", () => {
  const first = ingested();
  assert.equal(projectPhases.length, 10);
  const fromSheet = reconcile({ project: first.project, snapshot: first.snapshot, row: sheetRow({ ...after(), "Project Phase": "8. Procurement" }), columns, ctx });
  assert.equal(fromSheet.project.request.projectPhase, "8. Procurement");
  const edited = structuredClone(first.project);
  edited.request.projectPhase = "5. Contract Doc";
  const fromPortal = reconcile({ project: edited, snapshot: first.snapshot, row: sheetRow(after()), columns, ctx });
  assert.deepEqual(fromPortal.cells, [{ columnId: id("Project Phase"), value: "5. Contract Doc", strict: false }]);
  const bad = reconcile({ project: first.project, snapshot: first.snapshot, row: sheetRow({ ...after(), "Project Phase": "Nope" }), columns, ctx });
  assert.match(bad.issues[0], /not one of the sheet's phases/);
  assert.equal(bad.project.request.projectPhase, "4. Design Dev");
});
test("Status updates the portal but is never written, because it drives sheet automations", () => {
  assert.equal(stageFromStatus("NTQ - Need to Quote"), "Scoping");
  assert.equal(stageFromStatus("Invoiced / NP"), "Awaiting Deposit");
  assert.equal(stageFromStatus("RUSH"), null);
  const first = ingested();
  const paid = reconcile({ project: first.project, snapshot: first.snapshot, row: sheetRow({ ...after(), Status: "Paid" }), columns, ctx });
  assert.equal(paid.project.request.stage, "Procurement");
  assert.equal(paid.project.payment, "Paid");
  assert.equal(paid.project.request.sheetStatus, "Paid");
  const edited = structuredClone(first.project);
  edited.request.stage = "Installed";
  edited.request.sheetStatus = "Installed";
  const pushed = reconcile({ project: edited, snapshot: first.snapshot, row: sheetRow(after()), columns, ctx });
  assert.deepEqual(pushed.cells, []);
  assert.equal(pushed.project.request.stage, "Installed");
  const rush = reconcile({ project: first.project, snapshot: first.snapshot, row: sheetRow({ ...after(), Status: "RUSH" }), columns, ctx });
  assert.equal(rush.project.request.stage, "Quote in Progress");
});
test("unticking Portal Visible hides the project; the sync never writes that cell", () => {
  const first = ingested();
  const hidden = reconcile({ project: first.project, snapshot: first.snapshot, row: sheetRow({ ...after(), "Portal Visible": false }), columns, ctx });
  assert.equal(hidden.project.archived, true);
  assert.equal(hidden.cells.some((cell) => cell.columnId === id("Portal Visible")), false);
  const back = reconcile({ project: hidden.project, snapshot: hidden.snapshot, row: sheetRow(after()), columns, ctx });
  assert.equal(back.project.archived, false);
});
test("no data loss: a portal blank never clears a cell", () => {
  const first = ingested();
  const edited = structuredClone(first.project);
  edited.summary = "";
  edited.install = null;
  const result = reconcile({ project: edited, snapshot: first.snapshot, row: sheetRow(after()), columns, ctx });
  assert.deepEqual(result.cells, []);
});
test("no data loss: first link keeps sheet values and only fills empty cells", () => {
  const existing = { ...ingested().project, name: "Portal Name", summary: "Portal summary" };
  const result = reconcile({ project: existing, row: sheetRow({ "SBD install week": "2026-12-16" }), columns, ctx, ingest: true });
  assert.equal(result.project.name, "ESL - Longmont");
  assert.deepEqual(result.cells.map((cell) => cell.columnId).sort(), [id("Portal Summary"), id("Quote No"), id("Approved Budget")].sort());
});
test("no data loss: edited on both sides keeps the sheet's value and reports it", () => {
  const first = ingested();
  const edited = structuredClone(first.project);
  edited.request.projectPhase = "5. Contract Doc";
  const result = reconcile({ project: edited, snapshot: first.snapshot, row: sheetRow({ ...after(), "Project Phase": "8. Procurement" }), columns, ctx });
  assert.deepEqual(result.cells, []);
  assert.equal(result.project.request.projectPhase, "8. Procurement");
  assert.match(result.issues[0], /edited in both places/);
});
test("no data loss: formula cells and pull-only columns are never written", () => {
  const first = ingested();
  const edited = structuredClone(first.project);
  edited.install = "2027-03-01";
  edited.location = "Elsewhere";
  edited.request.internalNotes = "changed";
  const sheet = sheetRow(after());
  sheet.cells.find((cell) => cell.columnId === id("SBD install week")).formula = "=WEEK()";
  assert.deepEqual(reconcile({ project: edited, snapshot: first.snapshot, row: sheet, columns, ctx }).cells, []);
});
test("the Smartsheet client can only update existing cells: no deletes, no new rows or columns", () => {
  assert.deepEqual(safeCells([{ columnId: 1, value: "", strict: false }, { columnId: 2, value: false, strict: false }, { columnId: 3, value: null, strict: false }]), [{ columnId: 2, value: false, strict: false }]);
  const source = fs.readFileSync(path.join(__dirname, "../lib/smartsheet/client.ts"), "utf8");
  assert.doesNotMatch(source, /method:\s*["']DELETE["']/);
  assert.doesNotMatch(source, /export (async )?function \w*(delete|remove|addRow|addColumn)/i);
  assert.doesNotMatch(source, /\/columns`/);
  const writers = source.match(/`\/sheets\/\$\{sheetId\}\/rows`, \{ method: "(\w+)"/g);
  assert.deepEqual(writers, ['`/sheets/${sheetId}/rows`, { method: "PUT"']);
});
test("internal notes and sheet status never reach client accounts", () => {
  const route = fs.readFileSync(path.join(__dirname, "../app/api/portal/projects/route.ts"), "utf8");
  assert.match(route, /quotedAmount, internalNotes, notes, sheetStatus, \.\.\.request/);
  assert.match(route, /isStaff\(actor\) && smartsheet\?\.details/);
  assert.match(route, /isStaff\(actor\) \? sheetQuoteRows : sheetQuoteRows\.map\(clientQuoteRow\)/);
});
test("row details list what people see on the row, for staff lookup", () => {
  const details = rowDetails(row({ "Purchase Order": "24, 3021", Architect: "Lantz", "Portal Visible": true, Xmas: "" }), columns);
  assert.deepEqual(details, { "Purchase Order": "24, 3021", Architect: "Lantz", "Portal Visible": "Yes" });
});
test("section headings and totals are not project rows", () => {
  assert.equal(isSyncTicked(null), false);
  assert.equal(isSyncTicked(false), false);
  assert.equal(isSyncTicked(true), true);
  const source = fs.readFileSync(path.join(__dirname, "../lib/smartsheet/sync.ts"), "utf8");
  assert.match(source, /!ticked \|\| !cellValue\(row, ownerColumn\) \|\| !cellValue\(row, nameColumn\)/);
});
test("invite links resolve an origin for staff and client, even with no settings in production", () => {
  assert.equal(accountOrigin("staff", { VERCEL_ENV: "production" }), "https://seniorbydesign.com");
  assert.equal(accountOrigin("client", { VERCEL_ENV: "production" }), "https://clients.seniorbydesign.com");
  assert.equal(accountOrigin("staff", { SBD_ADMIN_ORIGIN: "https://a.example.com/x", NEXTAUTH_URL: "https://b.example.com" }), "https://a.example.com");
  assert.equal(accountOrigin("client", { SBD_PORTAL_ORIGIN: "clients.example.com" }), "https://clients.example.com");
  assert.equal(accountOrigin("client", { SBD_PORTAL_ORIGIN: "not a url", NEXTAUTH_URL: "https://b.example.com" }), "https://b.example.com");
  assert.equal(accountOrigin("staff", { VERCEL_ENV: "preview", VERCEL_URL: "sbd-abc.vercel.app" }), "https://sbd-abc.vercel.app");
  assert.equal(accountOrigin("staff", {}), null);
});
test("same-site check accepts proxied hosts and refuses other sites", () => {
  const headers = (values) => ({ get: (name) => values[name] ?? null });
  assert.equal(sameSiteRequest("https://a.com", "https://a.com/x", headers({})), true);
  assert.equal(sameSiteRequest("https://a.com", "http://internal:3000/x", headers({ "x-forwarded-host": "a.com" })), true);
  assert.equal(sameSiteRequest("https://evil.com", "https://a.com/x", headers({ host: "a.com" })), false);
  assert.equal(sameSiteRequest(null, "https://a.com/x", headers({ host: "a.com" })), false);
});

test("a Client Notes column, once added to the sheet, reaches the client-facing field", () => {
  const withNotes = [...columns, { id: 900, title: "Client Notes" }];
  const noteRow = sheetRow();
  noteRow.cells.push({ columnId: 900, value: "Fabric samples ship Friday.", displayValue: "Fabric samples ship Friday." });
  const base = { _id: "p", sourceId: "p", name: "", companyId: "", operatorId: "", location: "", address: "", summary: "", scopes: [], documents: [], payment: "Awaiting Confirmation", order: "Awaiting Confirmation", install: null, version: 1, archived: false, operatorApproval: false, workflowTouched: false, updatedAt: new Date() };
  const { project, cells } = reconcile({ project: base, row: noteRow, columns: withNotes, ctx, ingest: true });
  assert.equal(project.request.clientNotes, "Fabric samples ship Friday.");
  assert.notEqual(project.request.internalNotes, "Fabric samples ship Friday.");
  assert.deepEqual(cells, []);
});
test("a Status the portal has not been told about is recognised as new", () => {
  for (const known of ["Quoting", "Paid", "Active", "RUSH", "On Hold", ""]) assert.ok(statusKnown(known), known);
  assert.equal(statusKnown("Some Brand New Status"), false);
});
