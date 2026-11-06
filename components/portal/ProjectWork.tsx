"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { orderLabel, orderStages, orderStatusText, pipelineGroupIndex, pipelineGroups, projectAction, projectPhases, requestStages } from "@/lib/portal/requests";
import { displayDate, type DisplayProject } from "./PortalWorkspace";

const projectHref = (project: DisplayProject, from: string, organizationId = "", section = "") =>
  `/portal/projects/${encodeURIComponent(project._id)}?from=${from}${organizationId ? `&organization=${encodeURIComponent(organizationId)}` : ""}${section ? `#${section}` : ""}`;

/** Where a project is, in six steps anyone can read at a glance. */
export function ProjectSteps({ project, showLabel = true }: { project: DisplayProject; showLabel?: boolean }) {
  const current = pipelineGroupIndex(project);
  const done = project.request?.stage === "Closed" || project.request?.stage === "Installed";
  const label = current < 0 ? "Not started" : pipelineGroups[current].label;
  return (
    <div className="portal-steps" role="img" aria-label={`Progress: ${label}, step ${Math.max(current + 1, 0)} of ${pipelineGroups.length}`}>
      <div className="portal-steps-bar">
        {pipelineGroups.map((group, index) => (
          <i key={group.id} className={index < current || (done && index === current) ? "done" : index === current ? "current" : ""} />
        ))}
      </div>
      {showLabel && <span>{project.request?.stage || label}</span>}
    </div>
  );
}

export function WaitingBadge({ project, staff }: { project: DisplayProject; staff: boolean }) {
  const { owner } = projectAction(project, staff);
  if (owner === "none") return <span className="portal-waiting none">Complete</span>;
  const text = owner === "sbd" ? (staff ? "Your team" : "With SBD") : staff ? "With client" : "Needs you";
  return <span className={`portal-waiting ${owner}`}>{text}</span>;
}

/** The home screen's first answer: what needs doing, and who is doing it. */
export function WorkQueue({ projects, staff, name, organizationId = "" }: {
  projects: DisplayProject[]; staff: boolean; name: (id: string) => string; organizationId?: string;
}) {
  const open = projects.filter((project) => !project.archived);
  const yours = open.filter((project) => projectAction(project, staff).owner === (staff ? "sbd" : "client"));
  const theirs = open.filter((project) => projectAction(project, staff).owner === (staff ? "client" : "sbd"));
  const row = (project: DisplayProject) => {
    const action = projectAction(project, staff);
    return (
      <li key={project._id}>
        <Link href={projectHref(project, "overview", organizationId, action.section)} className="portal-queue-row">
          <span className="portal-row-main">
            <strong>{project.name}</strong>
            <span>{action.label}{staff ? ` · ${name(project.companyId)}` : ""}</span>
          </span>
          <span className="portal-queue-cta">{action.cta} →</span>
        </Link>
      </li>
    );
  };
  return (
    <div className="portal-queue-grid">
      <section className="portal-section-card portal-queue primary" aria-labelledby="queue-yours">
        <h2 id="queue-yours">{staff ? "Your team's next moves" : "What we need from you"} <span className="portal-count">{yours.length}</span></h2>
        {yours.length ? <ul>{yours.map(row)}</ul> : <p className="portal-empty-copy">{staff ? "Nothing is waiting on your team." : "Nothing right now. You're all caught up."}</p>}
      </section>
      <section className="portal-section-card portal-queue" aria-labelledby="queue-theirs">
        <h2 id="queue-theirs">{staff ? "Waiting on clients" : "SBD is working on"} <span className="portal-count">{theirs.length}</span></h2>
        {theirs.length ? <ul>{theirs.map(row)}</ul> : <p className="portal-empty-copy">{staff ? "No client decisions are outstanding." : "Nothing in progress right now."}</p>}
      </section>
    </div>
  );
}

/** A count for each step of the pipeline; choosing one filters the list beneath it. */
export function PipelineFilter({ projects, value, onChange }: {
  projects: DisplayProject[]; value: string; onChange: (id: string) => void;
}) {
  return (
    <div className="portal-pipeline" role="group" aria-label="Filter by step">
      <button type="button" aria-pressed={!value} onClick={() => onChange("")}><strong>{projects.length}</strong>All</button>
      {pipelineGroups.map((group, index) => (
        <button type="button" key={group.id} aria-pressed={value === group.id} onClick={() => onChange(value === group.id ? "" : group.id)}>
          <strong>{projects.filter((project) => pipelineGroupIndex(project) === index).length}</strong>{group.label}
        </button>
      ))}
    </div>
  );
}

async function saveField(project: DisplayProject, field: string, value: string) {
  const response = await fetch("/api/portal/manage-project", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "quick-update", id: project._id, version: project.version, field, value }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error);
}

/** Lets staff change a value where they see it, as quickly as editing a cell. */
export function QuickField({ project, field, label, value, type, options, placeholder, onChanged }: {
  project: DisplayProject; field: string; label: string; value: string; type: "select" | "date";
  options?: readonly string[]; placeholder?: string; onChanged?: () => Promise<void> | void;
}) {
  const [state, setState] = useState<"idle" | "saving" | "saved">("idle");
  const [error, setError] = useState("");
  const save = async (next: string) => {
    if (next === value) return;
    setState("saving"); setError("");
    try {
      await saveField(project, field, next);
      await onChanged?.();
      setState("saved");
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Could not save");
      setState("idle");
      await onChanged?.();
    }
  };
  const aria = `${label} for ${project.name}`;
  return (
    <span className="portal-quick-field">
      {type === "select" ? (
        <select aria-label={aria} value={value} disabled={state === "saving"} onChange={(event) => save(event.target.value)}>
          {placeholder !== undefined && <option value="">{placeholder}</option>}
          {options?.map((option) => <option key={option}>{option}</option>)}
        </select>
      ) : (
        <input type="date" aria-label={aria} defaultValue={value} key={value} disabled={state === "saving"} onBlur={(event) => save(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") event.currentTarget.blur(); }} />
      )}
      <small role="status" className={error ? "portal-quick-error" : ""}>{error || (state === "saving" ? "Saving…" : state === "saved" ? "Saved" : "")}</small>
    </span>
  );
}

export function QuickStage({ project, onChanged }: { project: DisplayProject; onChanged?: () => Promise<void> | void }) {
  return <QuickField project={project} field="stage" label="Stage" type="select" value={project.request?.stage || ""} options={requestStages} placeholder={project.request?.stage ? undefined : "Set stage"} onChanged={onChanged} />;
}
export function QuickPhase({ project, onChanged }: { project: DisplayProject; onChanged?: () => Promise<void> | void }) {
  const phase = project.request?.projectPhase || "";
  return <QuickField project={project} field="phase" label="Project phase" type="select" value={phase} options={projectPhases} placeholder={phase ? undefined : "Set phase"} onChanged={onChanged} />;
}
export function QuickOrder({ project, onChanged }: { project: DisplayProject; onChanged?: () => Promise<void> | void }) {
  const current = orderLabel(project);
  const known = (orderStages as readonly string[]).includes(current);
  return <QuickField project={project} field="order" label="Order status" type="select" value={known ? current : ""} options={orderStages} placeholder={known ? undefined : orderStatusText(project)} onChanged={onChanged} />;
}
export function QuickInstall({ project, onChanged }: { project: DisplayProject; onChanged?: () => Promise<void> | void }) {
  return <QuickField project={project} field="install" label="Install date" type="date" value={project.install || ""} onChanged={onChanged} />;
}

/** Sheet details for each quote on a project. Clients see only the phase and install date. */
export function QuoteRows({ project, staff }: { project: DisplayProject; staff: boolean }) {
  const rows = project.sheetQuoteRows;
  if (!rows?.length) return null;
  return (
    <section className="portal-quote-rows" aria-labelledby="quote-rows-title">
      <h3 id="quote-rows-title">Quote details</h3>
      {rows.map((row, index) => (
        <article key={`${row.quote}-${index}`}>
          <h4>{row.name} <small>Quote {row.quote}</small></h4>
          <dl>
            <div><dt>Phase</dt><dd>{row.projectPhase || "Not recorded"}</dd></div>
            <div><dt>Install</dt><dd>{displayDate(row.install || null)}</dd></div>
            {staff && row.details?.Status && <div><dt>Status</dt><dd>{row.details.Status}</dd></div>}
            {staff && row.details?.["Assigned to"] && <div><dt>SBD owner</dt><dd>{row.details["Assigned to"]}</dd></div>}
            {staff && row.details?.["Approved Budget"] && <div><dt>Approved budget</dt><dd>{row.details["Approved Budget"]}</dd></div>}
          </dl>
          {staff && row.details?.Notes && <div className="portal-internal-notes"><h3>SBD notes <small>Staff only</small></h3><p>{row.details.Notes}</p></div>}
          {staff && row.details && <details className="portal-sheet-details"><summary>All Smartsheet details ({Object.keys(row.details).length})</summary><dl>{Object.entries(row.details).map(([title, value]) => <div key={title}><dt>{title}</dt><dd>{value}</dd></div>)}</dl></details>}
        </article>
      ))}
    </section>
  );
}

/** Jump straight to any project from anywhere. Press / to start typing. */
export function QuickFind({ projects, name }: { projects: DisplayProject[]; name: (id: string) => string }) {
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const focus = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (event.key !== "/" || event.ctrlKey || event.metaKey || event.altKey) return;
      if (target && (["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName) || target.isContentEditable)) return;
      event.preventDefault();
      input.current?.focus();
    };
    document.addEventListener("keydown", focus);
    return () => document.removeEventListener("keydown", focus);
  }, []);
  const term = query.trim().toLowerCase();
  const results = term
    ? projects.filter((p) => !p.archived && `${p.name} ${p.location} ${name(p.companyId)} ${p.scopes.map((s) => s.quote).join(" ")} ${p.request?.quoteReference || ""}`.toLowerCase().includes(term)).slice(0, 8)
    : [];
  const go = (project: DisplayProject) => {
    setQuery(""); setOpen(false); input.current?.blur();
    router.push(`/portal/projects/${encodeURIComponent(project._id)}?from=projects`);
  };
  return (
    <div className="portal-find" role="search">
      <input
        ref={input}
        type="search"
        aria-label="Find a project"
        placeholder="Find a project…"
        value={query}
        role="combobox"
        aria-expanded={open && results.length > 0}
        aria-controls="portal-find-results"
        aria-activedescendant={open && results[active] ? `portal-find-${results[active]._id}` : undefined}
        onChange={(event) => { setQuery(event.target.value); setActive(0); setOpen(true); }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        onKeyDown={(event) => {
          if (event.key === "Escape") { setQuery(""); setOpen(false); event.currentTarget.blur(); }
          else if (event.key === "ArrowDown") { event.preventDefault(); setActive(Math.min(active + 1, results.length - 1)); }
          else if (event.key === "ArrowUp") { event.preventDefault(); setActive(Math.max(active - 1, 0)); }
          else if (event.key === "Enter" && results[active]) { event.preventDefault(); go(results[active]); }
        }}
      />
      {!query && <kbd aria-hidden="true">/</kbd>}
      {open && term && (
        <ul id="portal-find-results" role="listbox" className="portal-find-results">
          {results.map((project, index) => (
            <li key={project._id} id={`portal-find-${project._id}`} role="option" aria-selected={index === active}>
              <button type="button" className={`portal-find-result ${index === active ? "active" : ""}`} tabIndex={-1} onMouseDown={(event) => event.preventDefault()} onClick={() => go(project)}>
                <strong>{project.name}</strong><span>{name(project.companyId)} · {project.location}</span>
              </button>
            </li>
          ))}
          {!results.length && <li className="portal-find-empty">No matching projects</li>}
        </ul>
      )}
    </div>
  );
}
