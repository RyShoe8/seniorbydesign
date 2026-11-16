// File ingestion rules: where files may come from, how they are sorted, and how versions are kept.
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const ts = require("typescript");
require.extensions[".ts"] = (module, filename) =>
  module._compile(
    ts.transpileModule(fs.readFileSync(filename, "utf8"), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
    }).outputText,
    filename,
  );
const { classifyFile, importedFile, mergeFiles, sourcePath, SOURCE_ROOT } = require("../lib/sharepoint/files.ts");

const base = `https://seniorbydesign.sharepoint.com${SOURCE_ROOT.split("/").map(encodeURIComponent).join("/")}`;
const stored = (file, bytes) => ({ ...file, storageId: "a".repeat(24), contentHash: bytes });

test("only files inside the Comm - Remodels library are accepted", () => {
  assert.equal(sourcePath(`${base}/ReNew/Pearl/FFE%20Presentation.pdf`), `${SOURCE_ROOT}/ReNew/Pearl/FFE Presentation.pdf`);
  // The library view link the team pastes carries the folder in ?id=
  assert.equal(
    sourcePath(`https://seniorbydesign.sharepoint.com/sites/SBDFiles/Shared%20Documents/Forms/AllItems.aspx?id=${encodeURIComponent(SOURCE_ROOT)}`),
    SOURCE_ROOT,
  );
  for (const bad of [
    "https://evil.example/sites/SBDFiles/Shared%20Documents/Comm%20-%20Remodels/x.pdf",
    "http://seniorbydesign.sharepoint.com/sites/SBDFiles/Shared%20Documents/Comm%20-%20Remodels/x.pdf",
    "https://seniorbydesign.sharepoint.com/sites/SBDFiles/Shared%20Documents/Accounting/x.pdf",
    `${base}/../Accounting/x.pdf`,
    "not a link",
  ]) assert.throws(() => sourcePath(bad), bad);
});

test("presentations are presentations, documents are documents, and working files wait for review", () => {
  assert.equal(classifyFile("The Pearl - FFE Presentation Rev 2.pdf").category, "Presentations");
  assert.equal(classifyFile("Finish board.pptx").category, "Presentations");
  assert.equal(classifyFile("Quote 747 REV 2.pdf").category, "Quotes");
  assert.equal(classifyFile("SBD FFE Remodel Agreement.pdf", "/Contracts").category, "Contracts");
  assert.equal(classifyFile("Level 1 floor plan.pdf").category, "Documents");
  // Nothing internal is ever sorted into a client-facing category automatically.
  for (const name of ["Budget worksheet.xlsx", "Vendor purchase order.pdf", "Internal costing.pdf", "Working draft.docx"])
    assert.equal(classifyFile(name).category, "", name);
  assert.equal(classifyFile("IMG_2231.pdf").category, "");
});

test("a file needs a reviewed category before it can be published", () => {
  const url = `${base}/ReNew/Pearl/Presentation.pdf`;
  assert.throws(() => importedFile({ url }), /Choose a category/);
  assert.throws(() => importedFile({ url, category: "Secret" }), /Choose a category/);
  assert.throws(() => importedFile({ url: `${base}/ReNew/Pearl/tool.exe`, category: "Documents" }), /supported/);
  const file = importedFile({ url, category: "Presentations" });
  assert.equal(file.name, "Presentation.pdf");
  assert.equal(file.historical, false);
});

test("a changed file becomes a new version and the earlier one is kept", () => {
  const url = `${base}/ReNew/Pearl/Presentation.pdf`;
  const first = mergeFiles([], [stored(importedFile({ url, category: "Presentations" }), "hash-1")]);
  assert.equal(first.added, 1);
  assert.equal(first.documents[0].revision, 1);

  const second = mergeFiles(first.documents, [stored(importedFile({ url, category: "Presentations" }), "hash-2")]);
  assert.equal(second.added, 1);
  assert.deepEqual(second.documents.map((doc) => [doc.revision, doc.historical, doc.contentHash]), [[1, true, "hash-1"], [2, false, "hash-2"]]);
  // The first version's own record is untouched apart from being marked as earlier.
  assert.equal(second.documents[0].storageId, first.documents[0].storageId);
  assert.equal(first.documents[0].historical, false, "merging never edits the list it was given");
});

test("importing the same bytes again adds nothing", () => {
  const url = `${base}/ReNew/Pearl/Presentation.pdf`;
  const first = mergeFiles([], [stored(importedFile({ url, category: "Presentations" }), "hash-1")]);
  const again = mergeFiles(first.documents, [stored(importedFile({ url, category: "Presentations" }), "hash-1")]);
  assert.equal(again.added, 0);
  assert.equal(again.documents.length, 1);
});

test("a new version cannot quietly move to another category, and needs a saved copy", () => {
  const url = `${base}/ReNew/Pearl/Presentation.pdf`;
  const first = mergeFiles([], [stored(importedFile({ url, category: "Presentations" }), "hash-1")]);
  assert.throws(() => mergeFiles(first.documents, [stored(importedFile({ url, category: "Documents" }), "hash-2")]), /already registered in Presentations/);
  assert.throws(() => mergeFiles([], [importedFile({ url, category: "Presentations" })]), /saved file snapshot/);
});

test("an older linked document gains a version history when a saved copy replaces it", () => {
  const url = `${base}/ReNew/Pearl/Quote 747.pdf`;
  const legacy = { id: "legacy", name: "Quote 747.pdf", url, category: "Quotes", historical: false };
  const merged = mergeFiles([legacy], [stored(importedFile({ url, category: "Quotes" }), "hash-9")]);
  assert.deepEqual(merged.documents.map((doc) => [doc.id === "legacy", doc.historical, doc.revision]), [[true, true, undefined], [false, false, 2]]);
});

test("real file names from the live portal land in the right place", () => {
  assert.equal(classifyFile("SBD FFE Remodel Ageement - Phoenix Pearl MC - Ex A - Oct 24 2026.pdf").category, "Contracts");
  assert.equal(classifyFile("Renew Reit - SBD - GA The Pearl at Dallas - Quote 747 REV 2 10.20.26.pdf").category, "Quotes");
  assert.equal(classifyFile("Phoenix - SBD - The Pearl @ Dallas GA - FFE Presentation 9.30.26 Rev 2 .pdf").category, "Presentations");
  assert.equal(classifyFile("The Phoenix at Lake Lanier MC FFE Presentation Rev. 1 7-2-26.pdf", "/Quotes").category, "Presentations");
});

test("an automatic check saves presentations and documents, skips what has not changed, and leaves the rest for review", () => {
  const { planFiles } = require("../lib/sharepoint/files.ts");
  const at = (name) => `${base}/ReNew/Pearl/${encodeURIComponent(name)}`;
  const saved = (name, category, eTag) => ({ id: name, name, url: at(name), category, historical: false, storageId: "a".repeat(24), contentHash: "h", sourceETag: eTag, revision: 1 });
  const found = (name, eTag) => ({ name, url: at(name), eTag, size: 1000, ...classifyFile(name) });
  const plan = planFiles(
    [saved("FFE Presentation.pdf", "Presentations", "e1"), saved("Floor plan.pdf", "Documents", "e1"), saved("Quote 747.pdf", "Quotes", "e1"),
     { id: "old", name: "Old link.pdf", url: at("Finish board.pdf"), category: "Presentations", historical: false }],
    [found("FFE Presentation.pdf", "e1"), found("Floor plan.pdf", "e2"), found("New Presentation.pdf", "e1"), found("Finish board.pdf", "e1"),
     found("Quote 747.pdf", "e9"), found("Quote 801.pdf", "e1"), found("SBD FFE Agreement.pdf", "e1"), found("Budget worksheet.xlsx", "e1"), found("IMG_2231.pdf", "e1")],
  );
  // Unchanged presentation is not downloaded again.
  assert.equal(plan.unchanged, 1);
  // Changed document, brand new presentation, and an older linked file that has no saved copy yet.
  assert.deepEqual(plan.ingest.map((file) => [file.name, file.replacesId]), [["Floor plan.pdf", "Floor plan.pdf"], ["New Presentation.pdf", undefined], ["Finish board.pdf", "old"]]);
  // Quotes and contracts are never published automatically; internal and unsorted files wait too.
  assert.deepEqual(plan.review.map((file) => file.name), ["Quote 801.pdf", "SBD FFE Agreement.pdf", "Budget worksheet.xlsx", "IMG_2231.pdf"]);
  assert.ok(!plan.ingest.some((file) => /quote|agreement|budget/i.test(file.name)));
});

test("the sheet's folder column only accepts a project folder inside Comm - Remodels", () => {
  const { FIELD_MAP } = require("../lib/smartsheet/mapping.ts");
  const field = FIELD_MAP.find((candidate) => candidate.key === "filesFolder");
  assert.equal(field.pullOnly, true);
  assert.equal(field.parse(null), null);
  assert.equal(field.parse(`${base}/ReNew/Pearl`), `${base}/ReNew/Pearl`);
  assert.throws(() => field.parse(base), /project folder/);
  assert.throws(() => field.parse("https://example.com/files"), /Senior By Design SharePoint/);
});
