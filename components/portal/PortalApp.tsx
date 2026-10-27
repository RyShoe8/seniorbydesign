"use client";
import {
  PortalShell,
  PortalPortfolio,
  StatusBadge,
  displayDate,
} from "./PortalWorkspace";
import { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ProjectRequestsQuotes, RequestPipeline } from "./RequestsQuotes";
import { ProjectEditor } from "./ProjectEditor";
import OrganizationDirectory from "./OrganizationDirectory";
import { ApprovalQueue } from "./PortalDirectories";
import { ProjectProgress, ProjectOperations } from "./ProjectWorkflow";
import { projectPhase, orderLabel } from "@/lib/portal/requests";
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
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const organizationQuery = searchParams.get("organization") || "";
  const route = pathname.split("/").slice(2).map(decodeURIComponent);
  const createKind = route[1] || "project";
  const createMethod = route[2] || "";
  const [projects, setProjects] = useState<ViewProject[]>([]),
    [organizations, setOrganizations] = useState<Organization[]>([]),
    [actor, setActor] = useState<Actor | null>(null),
    [members, setMembers] = useState<Membership[]>([]);
  const [tab, setTab] = useState(route[0] || "overview"),
    [selected, setSelected] = useState(route[0] === "projects" ? route[1] || "" : ""),
    [search, setSearch] = useState(""),
    [org, setOrg] = useState(""),
    [message, setMessage] = useState(""),
    [loading, setLoading] = useState(true),
    [busy, setBusy] = useState(false);
  const [detailOrigin, setDetailOrigin] = useState("projects");
  const [detailSection, setDetailSection] = useState("overview");
  useEffect(() => {
    const readSection = () => {
      const hash = decodeURIComponent(window.location.hash.slice(1));
      const section = hash.startsWith("quote-") ? "approvals" : hash === "updates" ? "orders" : hash === "team" ? "contacts" : hash;
      setDetailSection(["overview", "quotes", "presentation", "approvals", "payment", "orders", "contacts", "documents", "activity"].includes(section) ? section : "overview");
    };
    readSection();
    window.addEventListener("hashchange", readSection);
    window.addEventListener("popstate", readSection);
    return () => { window.removeEventListener("hashchange", readSection); window.removeEventListener("popstate", readSection); };
  }, [selected]);
  const importing = tab === "create" && createMethod === "import" && createKind !== "company";
  useEffect(() => {
    const parts = pathname.split("/").slice(2).map(decodeURIComponent);
    setTab(parts[0] === "imports" ? "create" : parts[0] || "overview");
    setSelected(parts[0] === "projects" ? parts[1] || "" : "");
    const query = new URLSearchParams(window.location.search);
    setOrg(organizationQuery);
    const origin = query.get("from") || "projects";
    setDetailOrigin(["overview", "projects", "remodels", "requests", "approvals", "orders"].includes(origin) ? origin : "projects");
  }, [pathname, organizationQuery]);
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
  useEffect(() => {
    setSource("");
    setPreview(null);
  }, [pathname, organizationQuery]);
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
    if (importing)
      api("imports")
        .then(setHistory)
        .catch((e) => setMessage(e.message));
  }, [importing, projects]);
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
  const canAccessAccountTeam = !staff && manageable.length > 0;
  useEffect(() => {
    if (!loading && tab === "members" && !canAccessAccountTeam) {
      router.replace("/portal/overview");
    }
  }, [loading, tab, canAccessAccountTeam, router]);
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
  async function projectSaved(id: string) {
    await load();
    setDetailSection("overview");
    const origin = selected ? detailOrigin : ["projects", "remodels", "requests", "approvals", "orders"].includes(tab) ? tab : "projects";
    router.push(`/portal/projects/${encodeURIComponent(id)}?from=${origin}`);
  }
  const navigation = [
    ["overview", "Overview"],
    ["projects", "All Projects"],
    ["remodels", "Remodel Tracker"],
    ["requests", "Requests & Quotes"],
    ["approvals", "Approvals"],
    ["orders", "Orders & Installs"],
    ["organizations", "Companies & operators"],
    ["documents", "Documents"],
    ...(staff
      ? [

          ["create", "Create"],
        ]
      : []),
    ...(canAccessAccountTeam ? [["members", "Account team"]] : []),
  ];
  const scopedProjects = org ? projects.filter(p => [p.companyId, p.operatorId].includes(org)) : projects;
  const scopeQuery = org ? `organization=${encodeURIComponent(org)}` : "";
  const changeOrganization = (id: string) => {
    setOrg(id);
    setSearch("");
    const query = new URLSearchParams(window.location.search);
    if (id) query.set("organization", id); else query.delete("organization");
    router.replace(`${pathname}${query.size ? `?${query}` : ""}`, { scroll: false });
  };
  const navigate = (key: string) => {
    router.push(`/portal/${key}${scopeQuery && ["overview", "projects", "remodels", "requests", "approvals", "orders", "documents"].includes(key) ? `?${scopeQuery}` : ""}`);
    setSearch("");
  };
  return (
    <PortalShell
      tab={selected ? detailOrigin : tab}
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
      {(["create", "organizations"].includes(tab) || (tab === "members" && canAccessAccountTeam)) && (
        <div className="portal-page-heading">
          <div>
            <span className="portal-eyebrow">WORKSPACE MANAGEMENT</span>
            <h1>{navigation.find((n) => n[0] === tab)?.[1]}</h1>
            <p>
              {tab === "create"
                ? "Create a project or company from scratch, or import JSON."
                : tab === "members"
                  ? "The right people, connected to the right projects."
                  : "Browse the companies and operators connected to your projects."}
            </p>
          </div>
        </div>
      )}
      {staff && tab === "create" && (
        <section className="portal-panel">
          <div className="portal-actions">
            <button className={createKind === "project" ? "" : "secondary"} onClick={() => router.push("/portal/create/project")}>New project</button>
            <button className={createKind === "company" ? "" : "secondary"} onClick={() => router.push("/portal/create/company")}>New company</button>
          </div>
          <h2>How would you like to create your {createKind === "company" ? "company" : "project"}?</h2>
          <div className="portal-actions">
            <button onClick={() => router.push(`/portal/create/${createKind}/scratch`)}>Create from scratch</button>
            <button className="secondary" onClick={() => router.push(`/portal/create/${createKind}/import`)}>Import JSON</button>
          </div>
        </section>
      )}
      {staff && tab === "create" && createKind === "project" && createMethod === "scratch" && <section className="portal-panel"><h2>New Remodel / Project Request</h2><p>Add the community, request details, workflow, and contact information.</p><ProjectEditor organizations={organizations} onSaved={projectSaved} buttonLabel="Create project" /></section>}
      {staff && tab === "create" && createKind === "company" && createMethod === "import" && (
        <section className="portal-panel">
          <h2>Import a company</h2>
          <p>Upload a JSON object with name and slug fields. You can review and edit them before creating the company.</p>
          <input type="file" aria-label="Company JSON file" accept=".json,application/json" onChange={async e => {
            const file = e.target.files?.[0];
            if (!file) return;
            try {
              if (file.size > 1_500_000) throw new Error("Choose a file smaller than 1.5 MB");
              const value = JSON.parse(await file.text());
              const company = value.companies?.[0] || value;
              if (value.companies?.length > 1) throw new Error("Import one company at a time.");
              const name = company.name || company.companyname;
              const slug = company.slug || company.companyid;
              if (typeof name !== "string" || typeof slug !== "string") throw new Error("The company JSON needs name and slug fields.");
              setSource(JSON.stringify({ name, slug }));
              setMessage("");
            } catch (error) { setSource(""); setMessage(error instanceof Error ? error.message : "Invalid company JSON"); }
          }} />
          {source && (() => {
            let company: { name: string; slug: string };
            try { company = JSON.parse(source); } catch { return null; }
            if (!company.name || !company.slug) return null;
            return <form key={source} onSubmit={e => {
              e.preventDefault();
              const fields = Object.fromEntries(new FormData(e.currentTarget));
              run(async () => { await api("organizations", { action: "create", type: "company", ...fields }); setSource(""); router.push("/portal/organizations"); });
            }}>
              <label>Company name<input name="name" defaultValue={company.name} required /></label>
              <label>Permanent slug<input name="slug" defaultValue={company.slug} pattern="[a-z0-9]+(-[a-z0-9]+)*" required /></label>
              <button disabled={busy}>Confirm and create company</button>
            </form>;
          })()}
        </section>
      )}
      {message && (
        <div className="portal-alert portal-status-message" role="status">
          <span>{message}</span>
          <button className="secondary" onClick={() => run(load)}>
            Retry
          </button>
        </div>
      )}
      {loading && <p>Loading your workspace…</p>}
      {!loading && org && ["projects", "remodels", "requests", "approvals", "orders"].includes(tab) && <p className="portal-alert" role="status">Viewing {name(org)} · {scopedProjects.filter(p => !p.archived).length} projects <button className="secondary" onClick={() => changeOrganization("")}>View all organizations</button></p>}
      {!loading && !selected && ["requests", "orders", "projects", "remodels"].includes(tab) && <RequestPipeline key={tab} mode={tab as "requests" | "orders" | "projects" | "remodels"} projects={scopedProjects} organizations={organizations} organizationId={org} staff={staff} onSaved={projectSaved} />}
      {!loading && tab === "approvals" && <ApprovalQueue projects={scopedProjects} organizations={organizations} organizationId={org} />}

      {!loading &&
        !project && !selected &&
        ["overview", "documents"].includes(
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
            setOrg={changeOrganization}
            name={name}
            open={(id) => {
              router.push(`/portal/projects/${encodeURIComponent(id)}?from=overview${scopeQuery ? `&${scopeQuery}` : ""}`);
            }}
            navigate={navigate}
          />
        )}
      {!loading && selected && !project && <div className="portal-panel"><h2>Project unavailable</h2><p>This project could not be found or you do not have access.</p><button onClick={() => navigate("projects")}>Back to projects</button></div>}
      {project && tab === "projects" && (
        <div className="portal-project-detail">
          <button className="secondary" onClick={() => navigate(detailOrigin)}>
            ← Back to tracker
          </button>
          <div className="portal-page-heading portal-detail-heading portal-tracker-hero">
            <div>
              <span className="portal-eyebrow">
                {name(project.companyId)} · {project.location}
              </span>
              <h1>{project.name}</h1>
              <p>{name(project.companyId)} · {project.location} · {project.request?.type || "Project"}</p>
            </div>
          </div>
          <ProjectProgress project={project} showTimeline={false} />
          <div className="portal-project-edit-action"><StatusBadge value={orderLabel(project)} />{staff && <ProjectEditor project={project} organizations={organizations} onSaved={projectSaved} />}</div>
          <nav className="portal-detail-nav portal-project-tabs" aria-label="Project sections">
            {[["overview", "Overview"], ["quotes", "Request & Quote"], ["presentation", "Presentation"], ["approvals", "Approvals"], ["payment", "Payment"], ["orders", "Order & Install"], ["contacts", "Contacts"], ["documents", "Documents"], ["activity", "Activity"]].map(([key, label]) => <a key={key} href={`#${key}`} aria-current={detailSection === key ? "page" : undefined} className={detailSection === key ? "active" : ""} onClick={e => { e.preventDefault(); setDetailSection(key); window.history.pushState(null, "", `#${key}`); }}>{label}</a>)}
          </nav>
          <div hidden={detailSection !== "overview"}>
          <div className="portal-panel portal-project-context">
            <h2>Overview</h2>
            <dl className="portal-project-facts">
              <div><dt>Address</dt><dd>{project.address || "Not provided"}</dd></div>
              <div><dt>Client</dt><dd>{name(project.companyId)}</dd></div>
              <div><dt>Operator</dt><dd>{name(project.operatorId)}</dd></div>
              <div><dt>Project type</dt><dd>{project.request?.type || "Not recorded"}</dd></div>
              <div><dt>Project manager</dt><dd>{project.request?.assignedTo || "Unassigned"}</dd></div>
              <div><dt>Current phase</dt><dd>{projectPhase(project)}</dd></div>
              <div><dt>Estimated installation</dt><dd>{displayDate(project.install)}</dd></div>
            </dl>
            <p className="portal-project-reference">Project ID: <span>{project.sourceId}</span></p>
            <ProjectProgress project={project} showStats={false} />
          </div>
          </div>
          {(detailSection === "quotes" || detailSection === "approvals") && <ProjectRequestsQuotes section={detailSection} project={project} staff={staff} actor={actor} busy={busy} workflow={workflow} events={events} />}
          <div hidden={detailSection !== "documents" && detailSection !== "presentation"}>
          <section className="portal-panel" id="documents">
            <h2>{detailSection === "presentation" ? "Presentation" : "Documents"}</h2>
            {detailSection === "presentation" && <p>Presentation status: <StatusBadge value={project.request?.presentation || "Not started"} /></p>}
            <p className="portal-muted">
              Documents open in SharePoint. Microsoft sign-in and sharing
              permissions may be required.
            </p>
            {(detailSection === "presentation" ? ["Presentations"] : ["Quotes", "Contracts", "Presentations"]).map((category) => (
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
          </div>
          {(detailSection === "payment" || detailSection === "orders") && <ProjectOperations key={`${project._id}-${detailSection}`} project={project} section={detailSection} staff={staff} canManage={!!(staff || canManage(project.companyId) || canManage(project.operatorId))} busy={busy} workflow={workflow} />}
          {detailSection === "contacts" && <section className="portal-panel" id="contacts"><h2>Contacts</h2><dl className="portal-request-summary"><div><dt>Primary contact</dt><dd>{project.request?.contactName || "Not recorded"}</dd></div><div><dt>Contact email</dt><dd>{project.request?.contactEmail || "Not recorded"}</dd></div><div><dt>Client</dt><dd>{name(project.companyId)}</dd></div><div><dt>Operator</dt><dd>{name(project.operatorId)}</dd></div><div><dt>SBD owner</dt><dd>{project.request?.assignedTo || "Unassigned"}</dd></div><div><dt>Operator approval authority</dt><dd>{project.operatorApproval ? "Enabled" : "Company administrators only"}</dd></div></dl>
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
          </section>}
          {project.request?.notes && <p className="portal-project-notes">{project.request.notes}</p>}
          <section className="portal-panel" id="activity" hidden={detailSection !== "activity"}>
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
        </div>
      )}
      {importing && staff && (
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
      {importing && staff && (
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
      {tab === "create" && staff && createKind === "company" && createMethod === "scratch" && (
          <section className="portal-panel">
            <h2>Create an organization</h2>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const f = new FormData(e.currentTarget);
                run(async () => {
                  await api("organizations", {
                    action: "create", type: f.get("type"), name: f.get("name"), slug: f.get("slug"),
                  });
                  router.push("/portal/organizations");
                });
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
      )}
      {tab === "organizations" && <OrganizationDirectory organizations={organizations} members={members} invitations={invitations} projects={projects} staff={staff} busy={busy} manage={id => !!canManage(id)} send={data => run(() => api("organizations", data))} />}
      {tab === "members" && canAccessAccountTeam && (
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
