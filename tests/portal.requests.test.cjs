const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const os = require("node:os");
const Module = require("node:module");
const { randomUUID } = require("node:crypto");
const ts = require("typescript");
const { MongoClient } = require("mongodb");
let MongoMemoryReplSet;
try { ({ MongoMemoryReplSet } = require("mongodb-memory-server")); }
catch { ({ MongoMemoryReplSet } = require(path.join(process.env.SBD_TEST_MODULES || path.join(os.tmpdir(), "sbd-portal-test-tools", "node_modules"), "mongodb-memory-server"))); }
require.extensions[".ts"] = (module, filename) => module._compile(ts.transpileModule(fs.readFileSync(filename, "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText, filename);
const policy = require("../lib/portal/policy.ts");
const requestHelpers = require("../lib/portal/requests.ts");

test("a new request cannot inherit an earlier quote approval", () => {
  const project = { scopes: [{ quote: "old", approval: "Approved", revision: 1, documentId: "doc1", revisionConfirmed: true }], documents: [{ id: "doc1", category: "Quotes", historical: false }], request: { stage: "New Request", quoteReferences: [] } };
  assert.equal(requestHelpers.requestStage(project), "New Request");
  project.request.quoteReferences = ["old"];
  assert.equal(requestHelpers.requestStage(project), "Approved");
  project.scopes[0].approval = "Needs Approval";
  project.documents[0].historical = true;
  assert.equal(requestHelpers.quoteReady(project, project.scopes[0]), false);
  assert.notEqual(requestHelpers.requestStage(project), "Awaiting Approval");
});

test("SBD's explicit workflow phase stays separate from approvals and ordering", () => {
  const project = { scopes: [{ quote: "747", approval: "Approved", revision: 2 }], documents: [], request: { stage: "Presentation" }, payment: "Paid", order: "Delivered", install: "2026-12-01" };
  assert.equal(requestHelpers.projectPhase(project), "Presentation");
  const steps = requestHelpers.projectWorkflow(project);
  assert.deepEqual(steps.map(step => step.label), ["New Request", "Scoping", "Quote in Progress", "Quote Sent", "Presentation", "Awaiting Approval", "Awaiting Deposit", "Ordering", "Procurement", "Installation Planning", "Installed", "Closed"]);
  assert.equal(steps.find(step => step.state === "current").label, "Presentation");
  assert.equal(steps.find(step => step.label === "Installed").state, "pending");
  delete project.request;
  assert.equal(requestHelpers.projectPhase(project), "Not recorded");
  assert.ok(requestHelpers.projectWorkflow(project).every(step => step.state === "pending"));
});

test("detailed SBD statuses preserve the existing database semantics", () => {
  const { operationalFields } = require("../lib/portal/project-fields.ts");
  const project = { scopes: [], documents: [], payment: "Awaiting Confirmation", order: "Awaiting Confirmation", install: null };
  operationalFields({ paymentDetail: "Deposit received", orderDetail: "Partially received" }, project, true);
  assert.equal(project.paymentDetail, "Deposit received");
  assert.notEqual(project.payment, "Paid");
  assert.equal(project.orderDetail, "Partially received");
  assert.equal(project.order, "Ordered");
  operationalFields({ orderDetail: "Received" }, project, true);
  assert.equal(project.order, "Delivered");
  assert.throws(() => operationalFields({ paymentDetail: "Made up" }, project, true));
});

// Exercise the real route handlers and Mongo transactions with an injected
// authenticated actor. The private-preview access gate is never changed.
test("Requests & Quotes: SBD/client workflow, revision safety, isolation and private amounts", async () => {
  const mongo = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
  const client = await new MongoClient(mongo.getUri()).connect();
  try {
    const db = client.db("requests-workflow-test");
    const collections = { db, projects: db.collection("projects"), events: db.collection("events"), organizations: db.collection("organizations"), memberships: db.collection("memberships") };
    const staff = { id: "sbd", email: "team@example.test", role: "team", memberships: [] };
    const customer = { id: "client", email: "client@example.test", memberships: [{ organizationId: "company:a", role: "admin", active: true }] };
    const operator = { id: "operator", email: "operator@example.test", memberships: [{ organizationId: "operator:a", role: "admin", active: true }] };
    const member = { ...customer, memberships: [{ organizationId: "company:a", role: "member", active: true }] };
    const outsider = { id: "outsider", email: "other@example.test", memberships: [] };
    let actor = staff;
    const server = {
      requirePortalActor: async (staffRequired = false) => { if (staffRequired && !["admin", "team"].includes(actor.role)) throw new policy.PortalError("SBD staff required", 403); return actor; },
      body: async request => request.json(),
      json: data => Response.json(data),
      failure: error => Response.json({ error: error.message }, { status: error.status || 500 }),
    };
    const database = { collections: async () => collections, transaction: async callback => {
      const session = client.startSession();
      try { return await session.withTransaction(() => callback(session)); } finally { await session.endSession(); }
    } };
    const loadRoute = file => {
      const filename = path.resolve(__dirname, "..", file);
      const routeModule = new Module(filename);
      const nativeRequire = Module.createRequire(filename);
      routeModule.require = id => ({ "@/lib/portal/db": database, "@/lib/portal/server": server, "@/lib/portal/policy": policy, "@/lib/portal/requests": requestHelpers, "@/lib/portal/project-fields": require("../lib/portal/project-fields.ts") }[id] || nativeRequire(id));
      routeModule._compile(ts.transpileModule(fs.readFileSync(filename, "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText, filename);
      return routeModule.exports;
    };
    const workflow = loadRoute("app/api/portal/workflow/route.ts");
    const projects = loadRoute("app/api/portal/projects/route.ts");
    const manageProject = loadRoute("app/api/portal/manage-project/route.ts");
    const projectId = "project-a";
    await collections.projects.insertOne({ _id: projectId, sourceId: projectId, companyId: "company:a", operatorId: "operator:a", name: "Test community", location: "Dallas, GA", address: "Test", summary: "Existing community", scopes: [{ code: "MC", label: "Memory Care", quote: "747", approval: "Needs Approval", revision: 1 }], documents: [{ id: "doc1", name: "Quote 747 Rev 1.pdf", category: "Quotes", historical: false, url: "https://seniorbydesign.sharepoint.com/quote747-rev1.pdf" }], payment: "Awaiting Confirmation", order: "Awaiting Confirmation", install: null, version: 1, archived: false, operatorApproval: false, workflowTouched: false, updatedAt: new Date() });
    await collections.events.insertOne({ _id: "initial", projectId, action: "import", at: new Date(), note: "Test fixture" });
    const current = () => collections.projects.findOne({ _id: projectId });
    const action = async (as, name, data = {}, version) => {
      actor = as;
      const response = await workflow.POST(new Request("http://localhost/api/portal/workflow", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ projectId, version: version ?? (await current()).version, eventId: randomUUID(), action: name, ...data }) }));
      return { status: response.status, value: await response.json() };
    };
    const ok = result => assert.equal(result.status, 200, JSON.stringify(result.value));
    assert.equal((await action(outsider, "submit-request", { summary: "No access", type: "Remodel" })).status, 404);
    assert.equal((await action(member, "submit-request", { summary: "No authority", type: "Remodel" })).status, 403);
    ok(await action(customer, "submit-request", { summary: "Refresh the memory care lounge", type: "Remodel", stage: "Quote Sent", quotedAmount: 1, assignedTo: "Injected owner" }));
    let project = await current();
    assert.equal(project.request.stage, "New Request");
    assert.equal(project.request.assignedTo, "");
    assert.equal(project.request.quotedAmount, undefined);
    assert.equal((await action(customer, "submit-request", { summary: "Duplicate", type: "Remodel" })).status, 409);
    assert.equal((await action(customer, "update-request", {})).status, 403);
    const metadata = { summary: "Lounge furniture", type: "Remodel", receivedAt: "2026-10-27", stage: "Quote in Progress", assignedTo: "Design team", presentation: "Draft", quotedAmount: 42000, note: "Scope confirmed" };
    ok(await action(staff, "update-request", metadata));
    actor = customer;
    let view = await (await projects.GET()).json();
    assert.equal(view.projects[0].request.quotedAmount, undefined);
    assert.equal(view.projects[0].request.summary, "Lounge furniture");
    actor = staff;
    view = await (await projects.GET()).json();
    assert.equal(view.projects[0].request.quotedAmount, 42000);
    assert.equal((await action(customer, "approve", { quote: "747", revision: 1 })).status, 409);
    assert.equal((await action(customer, "bind-quote", { quote: "747", documentId: "doc1", confirmStableRevision: true, note: "Attempt" })).status, 403);
    ok(await action(staff, "bind-quote", { quote: "747", documentId: "doc1", confirmStableRevision: true, note: "Confirmed fixed document" }));
    project = await current();
    assert.equal(requestHelpers.requestStage(project), "Awaiting Approval");
    assert.equal((await action(staff, "approve", { quote: "747", revision: project.scopes[0].revision })).status, 400);
    assert.equal((await action(operator, "approve", { quote: "747", revision: project.scopes[0].revision })).status, 403);
    assert.equal((await action(member, "approve", { quote: "747", revision: project.scopes[0].revision })).status, 403);
    ok(await action(customer, "approve", { quote: "747", revision: project.scopes[0].revision }));
    assert.equal(requestHelpers.requestStage(await current()), "Approved");
    ok(await action(customer, "request-changes", { quote: "747", note: "Please revise seating fabric" }));
    project = await current();
    assert.equal(project.scopes[0].approval, "Needs Approval");
    assert.equal(requestHelpers.requestStage(project), "Changes Requested");
    assert.equal((await action(customer, "approve", { quote: "747", revision: project.scopes[0].revision })).status, 409);
    assert.equal((await action(customer, "reopen", { quote: "747", note: "Attempt" })).status, 403);
    const change = await collections.events.findOne({ action: "request-changes" });
    ok(await action(staff, "resolve-report", { requestId: change._id, resolution: "accepted", note: "Preparing revised fabric quote" }));
    assert.equal((await action(customer, "approve", { quote: "747", revision: project.scopes[0].revision })).status, 409);
    assert.equal((await action(customer, "add-quote-document", { name: "Unauthorized", url: "https://seniorbydesign.sharepoint.com/rev2.pdf", note: "Attempt" })).status, 403);
    assert.equal((await action(staff, "add-quote-document", { name: "Bad URL", url: "https://example.com/rev2.pdf", note: "Attempt" })).status, 400);
    ok(await action(staff, "add-quote-document", { name: "Quote 747 Rev 2.pdf", url: "https://seniorbydesign.sharepoint.com/rev2.pdf", note: "Updated fabric quote" }));
    const revision2 = (await current()).documents.find(d => d.name === "Quote 747 Rev 2.pdf");
    const staleVersion = (await current()).version;
    ok(await action(staff, "bind-quote", { quote: "747", documentId: revision2.id, confirmStableRevision: true, note: "Fabric change addressed" }));
    project = await current();
    assert.equal(project.scopes[0].changesRequested, false);
    assert.equal(requestHelpers.requestStage(project), "Awaiting Approval");
    assert.equal((await action(customer, "approve", { quote: "747", revision: project.scopes[0].revision }, staleVersion)).status, 409);
    assert.equal((await action(customer, "approve", { quote: "747", revision: project.scopes[0].revision - 1 })).status, 409);
    ok(await action(customer, "approve", { quote: "747", revision: project.scopes[0].revision }));
    const approval = await collections.events.findOne({ action: "approve", "document.id": revision2.id });
    assert.equal(approval.document.url, revision2.url);
    ok(await action(staff, "reopen", { quote: "747", note: "Client requested another review" }));
    assert.equal(requestHelpers.requestStage(await current()), "Awaiting Approval");
    assert.equal((await action(customer, "add-quote", { quote: "748" })).status, 403);
    ok(await action(staff, "add-quote", { quote: "748", code: "AL", label: "Assisted Living", documentId: revision2.id, confirmStableRevision: true, note: "Additional scope" }));
    assert.equal((await current()).scopes.length, 2);
    assert.equal((await action(staff, "add-quote", { quote: "748", code: "AL", label: "Duplicate", documentId: revision2.id, confirmStableRevision: true, note: "Duplicate" })).status, 409);
    actor = customer;
    const history = await (await workflow.GET(new Request(`http://localhost/api/portal/workflow?project=${projectId}`))).json();
    assert.ok(history.some(e => e.action === "request-changes" && e.note.includes("fabric")));
    assert.ok(history.every(e => !e.document && !e.before && !e.after));
    assert.ok(await db.collection("portalNotifications").countDocuments() > 0);
    await collections.projects.updateOne({ _id: projectId }, { $set: { archived: true } });
    assert.equal((await action(customer, "request-changes", { quote: "747", note: "Archived" })).status, 404);
    // The same atomic endpoint backs the SBD prototype's New/Edit dialog.
    await collections.organizations.insertMany([{ _id: "company:a", name: "Client A", type: "company", active: true }, { _id: "operator:a", name: "Operator A", type: "operator", active: true }]);
    const manage = async (as, data) => {
      actor = as;
      const response = await manageProject.POST(new Request("http://localhost/api/portal/manage-project", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(data) }));
      return { status: response.status, value: await response.json() };
    };
    const draft = { action: "create", companyId: "company:a", operatorId: "operator:a", name: "New workflow sample", location: "Dallas", address: "Sample address", summary: "Sample project", requestSummary: "Furniture scope", receivedAt: "2026-10-27", type: "Remodel", stage: "Scoping", presentation: "Draft in review", assignedTo: "Design team", quoteReference: "DRAFT-748", quotedAmount: 12000, contactName: "Client contact", contactEmail: "contact@example.test", progressEstimate: 15, notes: "Sample workflow notes", paymentDetail: "Deposit requested", orderDetail: "Awaiting deposit", install: "2026-12-01" };
    assert.equal((await manage(customer, draft)).status, 403);
    const saved = await manage(staff, draft); ok(saved);
    let created = await collections.projects.findOne({ _id: saved.value.id });
    assert.equal(created.request.stage, "Scoping");
    assert.equal(created.request.contactEmail, "contact@example.test");
    assert.equal(created.request.progressEstimate, 15);
    assert.equal(created.request.quoteReference, "DRAFT-748");
    assert.equal(created.payment, "Awaiting Payment");
    assert.equal(created.paymentDetail, "Deposit requested");
    assert.equal(created.order, "Awaiting Confirmation");
    assert.equal(created.orderDetail, "Awaiting deposit");
    assert.equal(created.scopes.length, 0); // A draft reference cannot fabricate approval.
    const edit = { ...draft, action: "update", id: created._id, version: created.version, archived: false, stage: "Quote Sent", presentation: "Presented", progressEstimate: 35 };
    ok(await manage(staff, edit));
    assert.equal((await manage(staff, edit)).status, 409);
    created = await collections.projects.findOne({ _id: created._id });
    assert.equal(created.request.stage, "Quote Sent");
    assert.equal(created.request.progressEstimate, 35);
    assert.equal((await manage(staff, { ...edit, version: created.version, orderDetail: "POs placed" })).status, 400);
    const count = await collections.projects.countDocuments();
    assert.equal((await manage(staff, { ...draft, contactEmail: "invalid-email" })).status, 400);
    assert.equal(await collections.projects.countDocuments(), count);
    actor = customer;
    const customerProjects = await (await projects.GET()).json();
    const visible = customerProjects.projects.find(p => p._id === created._id);
    assert.equal(visible.request.quotedAmount, undefined);
    assert.equal(visible.request.contactName, "Client contact");

  } finally { await client.close(); await mongo.stop(); }
});
