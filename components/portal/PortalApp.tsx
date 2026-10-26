"use client";
import {
  PortalShell,
  PortalPortfolio,
  StatusBadge,
  displayDate,
} from "./PortalWorkspace";
import { useCallback, useEffect, useState } from "react";
import { signOut } from "next-auth/react";
import type {
  Actor,
  Organization,
  Membership,
  Project,
} from "@/lib/portal/types";
import "./portal.css";
type ViewProject = Omit<Project, "documents"> & {
  documents: Omit<Project["documents"][number], "url">[];
};
type Preview = {
  id: string;
  changes: {
    name: string;
    action: string;
    company: string;
    operator: string;
  }[];
  warnings: string[];
  newOrganizations: string[];
  documents: number;
};
async function api(path: string, data?: unknown) {
  const res = await fetch(
    `/api/portal/${path}`,
    data
      ? {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        }
      : { cache: "no-store" },
  );
  const value = await res.json();
  if (!res.ok) throw new Error(value.error || "Request failed");
  return value;
}
export default function PortalApp({
  management = false,
}: {
  management?: boolean;
}) {
  const [projects, setProjects] = useState<ViewProject[]>([]),
    [organizations, setOrganizations] = useState<Organization[]>([]),
    [actor, setActor] = useState<Actor | null>(null),
    [members, setMembers] = useState<Membership[]>([]);
  const [tab, setTab] = useState("overview"),
    [selected, setSelected] = useState(""),
    [search, setSearch] = useState(""),
    [org, setOrg] = useState(""),
    [message, setMessage] = useState(""),
    [loading, setLoading] = useState(true),
    [busy, setBusy] = useState(false);
  const [jobs, setJobs] = useState<
    { _id: string; projectId: string; action: string; state: string }[]
  >([]);
  const [history, setHistory] = useState<
    {
      _id: string;
      createdAt: string;
      rolledBack?: boolean;
      changes: { name: string }[];
    }[]
  >([]);
  const [preview, setPreview] = useState<Preview | null>(null),
    [source, setSource] = useState("");
  const [events, setEvents] = useState<
    {
      _id: string;
      action: string;
      email: string;
      at: string;
      note: string;
      resolution?: string;
    }[]
  >([]);
  const [invitations, setInvitations] = useState<
    {
      email: string;
      organizationId: string;
      role: string;
      delivery: string;
      expiresAt: string;
      revoked?: boolean;
    }[]
  >([]);
  const staff = actor?.role === "admin" || actor?.role === "team";
  const load = useCallback(async () => {
    const [p, o] = await Promise.all([api("projects"), api("organizations")]);
    setProjects(p.projects);
    setActor(p.actor);
    setOrganizations([
      ...new Map<string, Organization>(
        [...p.organizations, ...o.organizations].map(
          (organization: Organization) => [organization._id, organization],
        ),
      ).values(),
    ]);
    setMembers(o.members);
    setInvitations(o.invitations);
  }, []);
  useEffect(() => {
    load()
      .catch((e) => setMessage(e.message))
      .finally(() => setLoading(false));
  }, [load]);
  useEffect(() => {
    if (staff)
      api("notification-jobs")
        .then(setJobs)
        .catch((e) => setMessage(e.message));
  }, [staff, projects]);
  useEffect(() => {
    if (tab === "imports")
      api("imports")
        .then(setHistory)
        .catch((e) => setMessage(e.message));
  }, [tab, projects]);
  useEffect(() => {
    if (selected)
      api(`workflow?project=${encodeURIComponent(selected)}`)
        .then(setEvents)
        .catch((e) => setMessage(e.message));
  }, [selected, projects]);
  async function run(fn: () => Promise<unknown>) {
    setBusy(true);
    setMessage("");
    try {
      await fn();
      await load();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Please try again.");
    } finally {
      setBusy(false);
    }
  }
  let importRows: {
    index: number;
    companyIndex?: number;
    name: string;
    payment: string;
    company: string;
    companyId: string;
    operator: string;
  }[] = [];
  try {
    const raw = JSON.parse(source);
    if (Array.isArray(raw))
      importRows = raw.map((r, index) => ({
        index,
        name: r.name || "",
        payment: r.payment || "",
        company: r.companyName || "",
        companyId: r.companyId || "",
        operator: typeof r.operator === "string" ? r.operator : "",
      }));
    else if (Array.isArray(raw.companies))
      importRows = raw.companies.flatMap(
        (
          c: {
            companyname: string;
            companyid: string;
            projects: {
              name: string;
              payment: string;
              operator: { operatorname: string };
            }[];
          },
          companyIndex: number,
        ) =>
          c.projects.map((r, index) => ({
            index,
            companyIndex,
            name: r.name || "",
            payment: r.payment || "",
            company: c.companyname || "",
            companyId: c.companyid || "",
            operator: r.operator?.operatorname || "",
          })),
      );
  } catch {}
  function correctImport(
    row: (typeof importRows)[number],
    field: string,
    value: string,
  ) {
    try {
      const raw = JSON.parse(source);
      if (Array.isArray(raw)) {
        if (field === "company" || field === "companyId") {
          for (const r of raw)
            if (r.companyId === row.companyId)
              r[field === "company" ? "companyName" : "companyId"] = value;
        } else raw[row.index][field] = value;
      } else {
        const c = raw.companies[row.companyIndex!];
        if (field === "company") c.companyname = value;
        else if (field === "companyId") c.companyid = value;
        else if (field === "operator")
          c.projects[row.index].operator.operatorname = value;
        else c.projects[row.index][field] = value;
      }
      setSource(JSON.stringify(raw, null, 2));
      setPreview(null);
    } catch {
      setMessage("Correct the JSON structure first.");
    }
  }
  const project = projects.find((p) => p._id === selected);
  const name = (id: string) =>
    organizations.find((o) => o._id === id)?.name || id.split(":")[1];
  const canManage = (id: string) =>
    staff ||
    actor?.memberships.some(
      (m) => m.organizationId === id && m.role === "admin",
    );
  const manageable = organizations.filter((o) => canManage(o._id));
  function workflow(action: string, extra: Record<string, unknown> = {}) {
    if (!project) return;
    return run(() =>
      api("workflow", {
        projectId: project._id,
        version: project.version,
        eventId: crypto.randomUUID(),
        action,
        ...extra,
      }),
    );
  }
  const navigation = [
    ["overview", "Overview"],
    ["projects", "All projects"],
    ["approvals", "Quotes & approvals"],
    ["orders", "Orders & installs"],
    ["documents", "Documents"],
    ...(staff
      ? [
          ["organizations", "Companies & operators"],
          ["imports", "JSON imports"],
        ]
      : []),
    ...(manageable.length ? [["members", "Account team"]] : []),
  ];
  const navigate = (key: string) => {
    setTab(key);
    setSelected("");
    setSearch("");
  };
  return (
    <PortalShell
      tab={tab}
      title={
        project
          ? project.name
          : navigation.find((n) => n[0] === tab)?.[1] || "Overview"
      }
      email={actor?.email || ""}
      organization={
        staff
          ? "Senior By Design"
          : manageable[0]?.name || organizations[0]?.name || "Your workspace"
      }
      navigation={navigation}
      navigate={navigate}
      signOut={() => signOut({ callbackUrl: "/account/login" })}
      staff={staff}
    >
      {["imports", "organizations", "members"].includes(tab) && (
        <div className="portal-page-heading">
          <div>
            <span className="portal-eyebrow">WORKSPACE MANAGEMENT</span>
            <h1>{navigation.find((n) => n[0] === tab)?.[1]}</h1>
            <p>
              {tab === "imports"
                ? "Review and validate project updates before publishing."
                : tab === "members"
                  ? "The right people, connected to the right projects."
                  : "Manage the companies and operators behind each project."}
            </p>
          </div>
        </div>
      )}
      {message && (
        <div className="portal-alert" role="status">
          {message}
          <button className="secondary" onClick={() => run(load)}>
            Retry
          </button>
        </div>
      )}
      {loading && <p>Loading your workspace…</p>}
      {!loading &&
        !project &&
        ["overview", "projects", "approvals", "orders", "documents"].includes(
          tab,
        ) && (
          <PortalPortfolio
            staff={staff}
            key={tab}
            view={tab}
            projects={projects}
            organizations={organizations}
            search={search}
            setSearch={setSearch}
            org={org}
            setOrg={setOrg}
            name={name}
            open={(id) => {
              setTab("projects");
              setSelected(id);
            }}
            navigate={navigate}
          />
        )}
      {project && tab === "projects" && (
        <>
          <button className="secondary" onClick={() => setSelected("")}>
            Back to projects
          </button>
          <div className="portal-page-heading portal-detail-heading">
            <div>
              <span className="portal-eyebrow">
                {name(project.companyId)} · {project.location}
              </span>
              <h1>{project.name}</h1>
              <p>{project.summary}</p>
            </div>
          </div>
          <nav className="portal-detail-nav" aria-label="Project sections">
            <a href="#quotes">Quotes & approvals</a>
            <a href="#documents">Documents</a>
            <a href="#updates">Status updates</a>
            <a href="#activity">Activity</a>
          </nav>
          <div className="portal-panel portal-project-context">
            <p>{project.address}</p>
            <p>
              {name(project.companyId)} · Operator: {name(project.operatorId)}
            </p>
            <p className="portal-muted">
              Permanent project ID: {project.sourceId}
            </p>
            <div className="portal-actions">
              <StatusBadge value={project.payment} />
              <StatusBadge value={project.order} />
              <span className="portal-badge">
                Install: {displayDate(project.install)}
              </span>
            </div>
          </div>
          {staff && (
            <details className="portal-panel">
              <summary>Edit project details</summary>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const f = new FormData(e.currentTarget);
                  run(() =>
                    api("manage-project", {
                      id: project._id,
                      version: project.version,
                      name: f.get("name"),
                      location: f.get("location"),
                      address: f.get("address"),
                      summary: f.get("summary"),
                      operatorId: f.get("operator"),
                      archived: f.get("archived") === "on",
                    }),
                  );
                }}
                key={project.version}
              >
                <label>
                  Project name
                  <input name="name" defaultValue={project.name} required />
                </label>
                <label>
                  Location
                  <input
                    name="location"
                    defaultValue={project.location}
                    required
                  />
                </label>
                <label>
                  Address
                  <input
                    name="address"
                    defaultValue={project.address}
                    required
                  />
                </label>
                <label>
                  Summary
                  <textarea name="summary" defaultValue={project.summary} />
                </label>
                <label>
                  Operator
                  <select name="operator" defaultValue={project.operatorId}>
                    {organizations
                      .filter((o) => o.type === "operator")
                      .map((o) => (
                        <option key={o._id} value={o._id}>
                          {o.name}
                        </option>
                      ))}
                  </select>
                </label>
                <label>
                  <input
                    type="checkbox"
                    name="archived"
                    defaultChecked={project.archived}
                    style={{ width: "auto" }}
                  />{" "}
                  Archive project (removes external access)
                </label>
                <p className="portal-muted">
                  Changing the operator changes access and clears operator
                  approval authority.
                </p>
                <button disabled={busy}>Save project</button>
              </form>
            </details>
          )}
          <section className="portal-panel" id="quotes">
            <h2>Quotes & approvals</h2>
            {project.scopes.map((s) => (
              <div key={s.quote} className="portal-row">
                <div>
                  <h3>
                    {s.label} · Quote {s.quote}
                  </h3>
                  <span className="portal-badge">{s.approval}</span>
                  <span className="portal-muted">Revision {s.revision}</span>
                  {!s.revisionConfirmed && (
                    <p className="portal-muted">
                      SBD must confirm the current quote document before online
                      approval.
                    </p>
                  )}
                </div>
                <div className="portal-actions">
                  {!staff &&
                    s.approval === "Needs Approval" &&
                    s.revisionConfirmed &&
                    actor?.memberships.some(
                      (m) =>
                        m.role === "admin" &&
                        (m.organizationId === project.companyId ||
                          (project.operatorApproval &&
                            m.organizationId === project.operatorId)),
                    ) && (
                      <button
                        disabled={busy}
                        onClick={() => {
                          if (
                            confirm(
                              `Approve quote ${s.quote}, revision ${s.revision}? Review its current document before approving.`,
                            )
                          )
                            workflow("approve", {
                              quote: s.quote,
                              revision: s.revision,
                            });
                        }}
                      >
                        Approve quote
                      </button>
                    )}
                  {(staff ||
                    canManage(project.companyId) ||
                    canManage(project.operatorId)) && (
                    <button
                      disabled={busy}
                      className="secondary"
                      onClick={() => {
                        const note = prompt("Describe the requested changes");
                        if (note)
                          workflow("request-changes", {
                            quote: s.quote,
                            note,
                          });
                      }}
                    >
                      Request changes
                    </button>
                  )}
                  {staff && (
                    <button
                      className="secondary"
                      disabled={busy}
                      onClick={() => {
                        const note = prompt("Reason for reopening this quote");
                        if (note) workflow("reopen", { quote: s.quote, note });
                      }}
                    >
                      Reopen
                    </button>
                  )}
                </div>
                {staff && (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      const f = new FormData(e.currentTarget);
                      workflow("bind-quote", {
                        quote: s.quote,
                        documentId: f.get("document"),
                        confirmStableRevision: f.get("stable") === "on",
                        note: f.get("note"),
                      });
                    }}
                  >
                    <label>
                      Current quote document
                      <select name="document" required>
                        <option value="">Choose document</option>
                        {project.documents
                          .filter(
                            (d) => d.category === "Quotes" && !d.historical,
                          )
                          .map((d) => (
                            <option key={d.id} value={d.id}>
                              {d.name}
                            </option>
                          ))}
                      </select>
                    </label>
                    <label>
                      <input
                        type="checkbox"
                        name="stable"
                        required
                        style={{ width: "auto" }}
                      />{" "}
                      This link identifies a fixed document revision
                    </label>
                    <label>
                      Revision note
                      <input name="note" required />
                    </label>
                    <button disabled={busy}>Set quote revision</button>
                  </form>
                )}
              </div>
            ))}
          </section>
          <section className="portal-panel" id="documents">
            <h2>Documents</h2>
            <p className="portal-muted">
              Documents open in SharePoint. Microsoft sign-in and sharing
              permissions may be required.
            </p>
            {["Quotes", "Contracts", "Presentations"].map((category) => (
              <div key={category}>
                <h3>{category}</h3>
                {project.documents
                  .filter((d) => d.category === category && !d.historical)
                  .map((d) => (
                    <div className="portal-row" key={d.id}>
                      <span>{d.name}</span>
                      <a
                        className="portal-link secondary"
                        target="_blank"
                        rel="noopener noreferrer"
                        href={`/api/portal/documents?project=${project._id}&document=${d.id}`}
                      >
                        Open document
                      </a>
                    </div>
                  ))}
              </div>
            ))}
            <details>
              <summary>
                Earlier revisions (
                {project.documents.filter((d) => d.historical).length})
              </summary>
              {project.documents
                .filter((d) => d.historical)
                .map((d) => (
                  <div className="portal-row" key={d.id}>
                    <span>{d.name}</span>
                    <a
                      className="portal-link secondary"
                      target="_blank"
                      rel="noopener noreferrer"
                      href={`/api/portal/documents?project=${project._id}&document=${d.id}`}
                    >
                      Open revision
                    </a>
                  </div>
                ))}
            </details>
          </section>
          {(staff ||
            canManage(project.companyId) ||
            canManage(project.operatorId)) && (
            <section className="portal-panel">
              <h2 id="updates">
                {staff ? "Update project status" : "Send a project update"}
              </h2>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const f = new FormData(e.currentTarget);
                  workflow(String(f.get("action")), {
                    field: f.get("field"),
                    value: f.get("value"),
                    note: f.get("note"),
                  });
                }}
              >
                <label>
                  Action
                  <select name="action">
                    {staff ? (
                      <option value="status">Confirm official status</option>
                    ) : (
                      <>
                        <option value="report-payment">
                          Report payment sent
                        </option>
                        <option value="report-delivery">
                          Report delivery received
                        </option>
                        <option value="delivery-issue">
                          Report delivery issue
                        </option>
                        <option value="request-install">
                          Request installation date
                        </option>
                      </>
                    )}
                  </select>
                </label>
                {staff && (
                  <label>
                    Status field
                    <select name="field">
                      <option value="payment">Payment</option>
                      <option value="order">Order</option>
                      <option value="install">Estimated install date</option>
                    </select>
                  </label>
                )}
                <label>
                  {staff
                    ? "New status or date (MM/DD/YYYY)"
                    : "Requested installation date (if applicable)"}
                  <input name="value" list="portal-statuses" />
                  <datalist id="portal-statuses">
                    {[
                      "Awaiting Confirmation",
                      "Awaiting Payment",
                      "Paid",
                      "Ordered",
                      "Delivered",
                    ].map((v) => (
                      <option key={v} value={v} />
                    ))}
                  </datalist>
                </label>
                <label>
                  Details / reason
                  <textarea
                    name="note"
                    required
                    placeholder="Include dates, references, and relevant details."
                  />
                </label>
                <button disabled={busy}>Submit update</button>
              </form>
              {staff && (
                <button
                  className="secondary"
                  disabled={busy}
                  onClick={() => {
                    const note = prompt(
                      "Reason for changing operator approval authority",
                    );
                    if (note)
                      workflow("operator-authority", {
                        value: !project.operatorApproval,
                        note,
                      });
                  }}
                >
                  {project.operatorApproval ? "Remove" : "Grant"} operator quote
                  approval
                </button>
              )}
            </section>
          )}
          <section className="portal-panel" id="activity">
            <h2>Project activity</h2>
            {events.map((e) => (
              <div className="portal-row" key={e._id}>
                <div>
                  <strong>{e.action.replaceAll("-", " ")}</strong>
                  <p>{e.note}</p>
                  <small>
                    {e.email} · {new Date(e.at).toLocaleString()}
                    {e.resolution ? ` · ${e.resolution}` : ""}
                  </small>
                </div>
                {staff &&
                  !e.resolution &&
                  [
                    "report-payment",
                    "report-delivery",
                    "delivery-issue",
                    "request-install",
                    "request-changes",
                  ].includes(e.action) && (
                    <div className="portal-actions">
                      {["accepted", "declined"].map((resolution) => (
                        <button
                          key={resolution}
                          disabled={busy}
                          className="secondary"
                          onClick={() => {
                            const note = prompt(
                              "Response (update the official status separately if needed)",
                            );
                            if (note)
                              workflow("resolve-report", {
                                requestId: e._id,
                                resolution,
                                note,
                              });
                          }}
                        >
                          {resolution === "accepted"
                            ? "Accept report"
                            : "Return for correction"}
                        </button>
                      ))}
                    </div>
                  )}
              </div>
            ))}
          </section>
        </>
      )}
      {tab === "imports" && staff && (
        <section className="portal-panel">
          <p>
            Upload the original SBD project JSON or the company-based format.
            Review assignments before committing. Existing project approvals and
            earlier revisions are preserved.
          </p>
          <label>
            JSON file
            <input
              type="file"
              accept=".json,application/json"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                setPreview(null);
                if (!file) return;
                if (file.size > 1_500_000) {
                  setMessage("Choose a file smaller than 1.5 MB");
                  return;
                }
                setSource(await file.text());
              }}
            />
          </label>
          <details>
            <summary>Review fields and resolve import corrections</summary>
            <p>
              Changes here update this upload only. They do not modify the
              original file.
            </p>
            {importRows.map((r, i) => (
              <div className="portal-panel" key={i}>
                <label>
                  Project name
                  <input
                    value={r.name}
                    onChange={(e) => correctImport(r, "name", e.target.value)}
                  />
                </label>
                <label>
                  Company name
                  <input
                    value={r.company}
                    onChange={(e) =>
                      correctImport(r, "company", e.target.value)
                    }
                  />
                </label>
                <label>
                  Company slug
                  <input
                    value={r.companyId}
                    onChange={(e) =>
                      correctImport(r, "companyId", e.target.value)
                    }
                  />
                </label>
                <label>
                  Operator name
                  <input
                    value={r.operator}
                    onChange={(e) =>
                      correctImport(r, "operator", e.target.value)
                    }
                  />
                </label>
                <label>
                  Payment
                  <select
                    value={r.payment}
                    onChange={(e) =>
                      correctImport(r, "payment", e.target.value)
                    }
                  >
                    <option value={r.payment}>{r.payment}</option>
                    {["Awaiting Confirmation", "Awaiting Payment", "Paid"]
                      .filter((v) => v !== r.payment)
                      .map((v) => (
                        <option key={v}>{v}</option>
                      ))}
                  </select>
                </label>
              </div>
            ))}
          </details>
          <details>
            <summary>Review or correct JSON</summary>
            <textarea
              aria-label="JSON source"
              rows={12}
              value={source}
              onChange={(e) => {
                setSource(e.target.value);
                setPreview(null);
              }}
            />
          </details>
          <button
            disabled={busy || !source}
            onClick={() =>
              run(async () => {
                const value = await api("imports", {
                  action: "preview",
                  data: JSON.parse(source),
                });
                setPreview(value);
              })
            }
          >
            Preview import
          </button>
          {preview && (
            <>
              <h2>Review changes</h2>
              {preview.warnings.map((w, i) => (
                <p className="portal-alert" key={i}>
                  {w}
                </p>
              ))}
              <p>
                {preview.documents} documents · New organizations:{" "}
                {preview.newOrganizations.join(", ") || "None"}
              </p>
              <div className="portal-scroll">
                <table className="portal-table">
                  <thead>
                    <tr>
                      <th>Project</th>
                      <th>Company</th>
                      <th>Operator</th>
                      <th>Change</th>
                    </tr>
                  </thead>
                  <tbody>
                    {preview.changes.map((c, i) => (
                      <tr key={i}>
                        <td>{c.name}</td>
                        <td>{c.company}</td>
                        <td>{c.operator}</td>
                        <td>{c.action}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p>
                Committing makes these projects available to their assigned
                organizations.
              </p>
              <button
                disabled={busy}
                onClick={() =>
                  run(async () => {
                    await api("imports", {
                      action: "commit",
                      id: preview.id,
                    });
                    setPreview(null);
                    setMessage("Import committed successfully.");
                  })
                }
              >
                Confirm and import
              </button>
            </>
          )}
        </section>
      )}
      {staff && jobs.length > 0 && (
        <details className="portal-panel">
          <summary>Pending notifications ({jobs.length})</summary>
          <p>
            These activities remain in the project timeline even if email
            delivery fails.
          </p>
          {jobs.map((j) => (
            <div className="portal-row" key={j._id}>
              <span>
                {projects.find((p) => p._id === j.projectId)?.name || "Project"}{" "}
                · {j.action} · {j.state}
              </span>
              {j.state === "failed" && (
                <button
                  disabled={busy}
                  className="secondary"
                  onClick={() => {
                    if (
                      confirm(
                        "Retry this email? Check delivery logs first if the previous attempt may have reached the recipient.",
                      )
                    )
                      run(() => api("notification-jobs", { id: j._id }));
                  }}
                >
                  Retry email
                </button>
              )}
            </div>
          ))}
        </details>
      )}
      {tab === "imports" && staff && (
        <section className="portal-panel">
          <h2>Import history</h2>
          {history.map((h) => (
            <div className="portal-row" key={h._id}>
              <div>
                {new Date(h.createdAt).toLocaleString()}
                <p>{h.changes.map((c) => c.name).join(", ")}</p>
              </div>
              {h.rolledBack ? (
                <span>Rolled back</span>
              ) : (
                <button
                  className="secondary"
                  disabled={busy}
                  onClick={() => {
                    if (
                      confirm(
                        "Restore project data from before this import? New projects will be archived. Rollback is blocked if any project has changed since import.",
                      )
                    )
                      run(() =>
                        api("imports", { action: "rollback", id: h._id }),
                      );
                  }}
                >
                  Roll back import
                </button>
              )}
            </div>
          ))}
        </section>
      )}
      {tab === "organizations" && staff && (
        <>
          <section className="portal-panel">
            <h2>Create an organization</h2>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const f = new FormData(e.currentTarget);
                run(() =>
                  api("organizations", {
                    action: "create",
                    type: f.get("type"),
                    name: f.get("name"),
                    slug: f.get("slug"),
                  }),
                );
              }}
            >
              <label>
                Type
                <select name="type">
                  <option value="company">Client company</option>
                  <option value="operator">Operator</option>
                </select>
              </label>
              <label>
                Name
                <input name="name" required />
              </label>
              <label>
                Permanent slug
                <input
                  name="slug"
                  required
                  pattern="[a-z0-9]+(-[a-z0-9]+)*"
                  placeholder="phoenix-senior-living"
                />
              </label>
              <button disabled={busy}>Create organization</button>
            </form>
          </section>
          {organizations.map((o) => (
            <div className="portal-panel" key={o._id}>
              <h2>{o.name}</h2>
              <p>
                {o.type} · {o.slug}
              </p>
              <button
                disabled={busy}
                className="secondary"
                onClick={() => {
                  const value = prompt("Organization name", o.name);
                  if (value)
                    run(() =>
                      api("organizations", {
                        action: "rename",
                        organizationId: o._id,
                        name: value,
                      }),
                    );
                }}
              >
                Edit name
              </button>
              <button
                className="secondary"
                onClick={() => {
                  setOrg(o._id);
                  setTab("projects");
                }}
              >
                View projects
              </button>
            </div>
          ))}
        </>
      )}
      {tab === "members" && (
        <section className="portal-panel">
          <h2>Invite a teammate</h2>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const f = new FormData(e.currentTarget);
              run(() =>
                api("organizations", {
                  action: "invite",
                  email: f.get("email"),
                  organizationId: f.get("organization"),
                  role: f.get("role"),
                }),
              );
            }}
          >
            <label>
              Organization
              <select name="organization" required>
                {manageable.map((o) => (
                  <option key={o._id} value={o._id}>
                    {o.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Email
              <input name="email" type="email" required />
            </label>
            <label>
              Access
              <select name="role">
                <option value="member">Member</option>
                <option value="admin">Account admin</option>
              </select>
            </label>
            <p className="portal-muted">
              The first SBD invitation to an organization grants account-admin
              access.
            </p>
            <button disabled={busy}>Send invitation</button>
          </form>
          <h2>Members</h2>
          {members.map((m) => (
            <div className="portal-row" key={m._id}>
              <div>
                {m.email}
                <p className="portal-muted">
                  {name(m.organizationId)} · {m.role} ·{" "}
                  {m.active ? "Active" : "Disabled"}
                </p>
              </div>
              <div className="portal-actions">
                <button
                  className="secondary"
                  disabled={busy}
                  onClick={() =>
                    run(() =>
                      api("organizations", {
                        action: "membership",
                        organizationId: m.organizationId,
                        memberId: m._id,
                        role: m.role === "admin" ? "member" : "admin",
                        active: m.active,
                      }),
                    )
                  }
                >
                  {m.role === "admin" ? "Make member" : "Make admin"}
                </button>
                <button
                  className="secondary"
                  disabled={busy}
                  onClick={() =>
                    run(() =>
                      api("organizations", {
                        action: "membership",
                        organizationId: m.organizationId,
                        memberId: m._id,
                        role: m.role,
                        active: !m.active,
                      }),
                    )
                  }
                >
                  {m.active ? "Disable" : "Restore"}
                </button>
              </div>
            </div>
          ))}
          <h2>Invitations</h2>
          {invitations.map((i, n) => (
            <div className="portal-row" key={n}>
              <span>
                {i.email} · {name(i.organizationId)} ·{" "}
                {i.revoked
                  ? "Revoked"
                  : new Date(i.expiresAt) < new Date()
                    ? "Expired"
                    : i.delivery}
              </span>
              <div className="portal-actions">
                <button
                  disabled={busy}
                  className="secondary"
                  onClick={() =>
                    run(() => api("organizations", { action: "invite", ...i }))
                  }
                >
                  Resend
                </button>
                <button
                  disabled={busy}
                  className="secondary"
                  onClick={() =>
                    run(() =>
                      api("organizations", { action: "revoke-invite", ...i }),
                    )
                  }
                >
                  Revoke
                </button>
              </div>
            </div>
          ))}
        </section>
      )}
    </PortalShell>
  );
}
