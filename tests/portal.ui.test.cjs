const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const Module = require("node:module");
const ts = require("typescript");
const React = require("react");
const { renderToStaticMarkup } = require("react-dom/server");
const root = path.resolve(__dirname, "..");
for (const extension of [".ts", ".tsx"]) require.extensions[extension] = (module, filename) => {
  const nativeRequire = Module.createRequire(filename);
  module.require = id => nativeRequire(id.startsWith("@/") ? path.join(root, id.slice(2)) : id);
  module._compile(ts.transpileModule(fs.readFileSync(filename, "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true } }).outputText, filename);
};
const { RequestPipeline, ProjectRequestsQuotes } = require("../components/portal/RequestsQuotes.tsx");
const { ApprovalQueue } = require("../components/portal/PortalDirectories.tsx");
const organizations = [{ _id: "company:a", name: "Client A", type: "company", active: true }, { _id: "operator:a", name: "Operator A", type: "operator", active: true }];
const actor = { id: "client", email: "client@example.test", memberships: [{ organizationId: "company:a", role: "admin", active: true }] };
const project = { _id: "community-a", name: "Community A", companyId: "company:a", operatorId: "operator:a", summary: "Lounge refresh", location: "Dallas", request: { summary: "Lounge refresh", receivedAt: "2026-10-27", type: "Remodel", stage: "Quote Sent", presentation: "Presented", quotedAmount: 42000, quoteReferences: ["747"] }, scopes: [{ quote: "747", label: "Memory Care", approval: "Needs Approval", revision: 2, revisionConfirmed: true, documentId: "doc" }], documents: [{ id: "doc", name: "Quote 747 Revision 2.pdf", historical: false, category: "Quotes" }], payment: "Awaiting Payment", order: "Awaiting Confirmation", install: null, archived: false, version: 1 };
const render = (component, props) => renderToStaticMarkup(React.createElement(component, props));
test("SBD tracker structure matches the example's tables and Details routing", () => {
  const html = render(RequestPipeline, { projects: [project], organizations, staff: true, mode: "requests", onSaved() {} });
  assert.match(html, /<table/);
  assert.match(html, /Client \/ Community<\/th><th scope="col">Request<\/th><th scope="col">Quote<\/th><th scope="col">Presentation<\/th>/);
  assert.match(html, /\?from=requests/);
  assert.doesNotMatch(html, /#approvals/);
  assert.match(html, /New request/);
  assert.match(html, /<dialog/);
  assert.match(html, /Client contact/);
  assert.match(html, /Progress estimate/);
});
test("client tables preserve structure but hide staff creation and private amounts", () => {
  const html = render(RequestPipeline, { projects: [project], organizations, staff: false, mode: "requests", onSaved() {} });
  assert.match(html, /<table/);
  assert.doesNotMatch(html, /<dialog|New request|42,000/);
  const orders = render(RequestPipeline, { projects: [project], organizations, staff: false, mode: "orders", onSaved() {} });
  assert.match(orders, /Current phase<\/th><th scope="col">Approval<\/th><th scope="col">Payment<\/th>/);
});
test("approval queue opens Approvals while client quote decisions remain revision bound", () => {
  const queue = render(ApprovalQueue, { projects: [project], organizations });
  assert.match(queue, /\?from=approvals#approvals/);
  const html = render(ProjectRequestsQuotes, { project, staff: false, actor, busy: false, workflow() {}, events: [], section: "approvals" });
  assert.match(html, /Quote 747 Revision 2/);
  assert.match(html, /<button disabled="">Approve quote/);
  assert.match(html, /I have reviewed quote/);
  assert.doesNotMatch(html, /Publish new quote|Attach a quote document/);
  const changed = render(ProjectRequestsQuotes, { project: { ...project, scopes: [{ ...project.scopes[0], changesRequested: true }] }, staff: false, actor, busy: false, workflow() {}, events: [], section: "approvals" });
  assert.doesNotMatch(changed, />Approve quote<\/button>/);
});
