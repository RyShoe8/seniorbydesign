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
const { renderAccountEmail } = require("../lib/portal/email.ts");
const url = "https://seniorbydesign.com/account/accept#abc123";
const origin = "https://seniorbydesign.com";
const render = (email) => renderAccountEmail(email, url, origin);
const source = (file) => fs.readFileSync(path.join(__dirname, "..", file), "utf8");

for (const [name, email] of [
  ["staff", { kind: "staff-invite", invitedBy: "glenn@example.test" }],
  ["client admin", { kind: "client-invite", organization: "RenewREIT", organizationType: "company", role: "admin" }],
  ["client member", { kind: "client-invite", organization: "RenewREIT", organizationType: "company", role: "member", invitedBy: "pat@example.test" }],
  ["reset", { kind: "reset" }],
]) {
  test(`${name} email is branded, has the link twice, and a plain text version`, () => {
    const { subject, html, text } = render(email);
    assert.ok(subject.length > 10);
    assert.match(html, /https:\/\/seniorbydesign\.com\/images\/sbd-logo-no-tagline\.png/);
    assert.match(html, /alt="Senior By Design"/);
    assert.equal(html.split(url).length - 1, 3, "button, visible link and link text");
    assert.ok(text.includes(url));
    assert.doesNotMatch(html + text, /undefined|null|\[object/);
    assert.match(text, /info@seniorbydesign\.com/);
  });
}
test("the staff email says it is internal website access and says who invited them", () => {
  const { subject, html } = render({ kind: "staff-invite", invitedBy: "glenn@example.test" });
  assert.match(subject, /staff workspace/);
  assert.match(html, /glenn@example\.test invited you/);
  assert.match(html, /keep the Senior By Design website current/);
  assert.match(html, /internal SBD staff account/);
  assert.match(html, /client portal is granted separately/);
  assert.doesNotMatch(html, /Approve quotes/);
});
test("the client email names the organization and what the portal is for", () => {
  const { subject, html, text } = render({ kind: "client-invite", organization: "RenewREIT", organizationType: "company", role: "admin" });
  assert.match(subject, /client portal for RenewREIT/);
  assert.match(html, /Senior By Design invited you to the client portal for RenewREIT/);
  assert.match(html, /only see projects connected to RenewREIT/);
  assert.match(html, /Approve quotes or request changes/);
  assert.match(text, /Invite your teammates/);
  assert.doesNotMatch(html, /staff/i);
});
test("each client role is promised only what it can do", () => {
  const member = render({ kind: "client-invite", organization: "Org", organizationType: "company", role: "member" }).html;
  assert.match(member, /As a team member/);
  assert.doesNotMatch(member, /Approve quotes|Invite your teammates|Send payment/);
  const operator = render({ kind: "client-invite", organization: "Org", organizationType: "operator", role: "admin" }).html;
  assert.match(operator, /approve them where SBD has authorized your organization/);
  assert.doesNotMatch(operator, /Approve quotes or request changes/);
});
test("the reset email explains the shorter expiry and offers no access list", () => {
  const { html } = render({ kind: "reset" });
  assert.match(html, /expires in 30 minutes/);
  assert.match(html, /your password won&#39;t change/);
  assert.doesNotMatch(html, /<ul/);
});
test("names from the database cannot inject markup", () => {
  const { html, subject, text } = render({ kind: "client-invite", organization: `A&B <script>"x"</script>`, organizationType: "company", role: "admin", invitedBy: "<b>x</b>@example.test" });
  assert.doesNotMatch(html, /<script>|<b>x/);
  assert.match(html, /A&amp;B &lt;script&gt;/);
  assert.match(subject, /A&B <script>/, "subject and text are plain text, not HTML");
  assert.match(text, /A&B <script>/);
});
test("revoked invitations are left out of both lists and the UI has no revoked state", () => {
  for (const route of ["app/api/admin/users/route.ts", "app/api/portal/organizations/route.ts"]) {
    assert.match(source(route), /usedAt: \{ \$exists: false \},\s*revoked: \{ \$ne: true \}/, route);
  }
  for (const ui of ["app/admin/users/page.tsx", "components/portal/OrganizationDirectory.tsx", "components/portal/PortalApp.tsx"]) {
    assert.doesNotMatch(source(ui), /Revoked"|i\.revoked|revoked\?:/, ui);
  }
});
