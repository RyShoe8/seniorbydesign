"use client";

import Link from "next/link";

import { useState, type FormEvent } from "react";

import type { Actor, Organization } from "@/lib/portal/types";

import type { DisplayProject } from "./PortalWorkspace";

import { ProjectEditor } from "./ProjectEditor";
import { displayDate, StatusBadge } from "./PortalWorkspace";

import { quoteReady, approvalState, projectPhase, paymentLabel, orderLabel } from "@/lib/portal/requests";

type Workflow = (action: string, data?: Record<string, unknown>) => Promise<unknown> | undefined;

const fields = (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); return Object.fromEntries(new FormData(event.currentTarget)); };

const amount = (value?: number) => value === undefined ? "Not entered" : new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value);

export function RequestPipeline({ projects, organizations, staff, mode = "requests", onSaved, organizationId = "" }: {
  projects: DisplayProject[]; organizations: Organization[]; staff: boolean;
  organizationId?: string;
  mode?: "requests" | "orders" | "projects" | "remodels";
  onSaved: (id: string) => Promise<void> | void;
}) {
  const [search, setSearch] = useState("");
  const [showArchived, setShowArchived] = useState(false);
  const [company, setCompany] = useState("");
  const [stage, setStage] = useState("");
  const requests = mode === "requests", orders = mode === "orders";
  const name = (id: string) => organizations.find(o => o._id === id)?.name || "Company";
  const active = projects.filter(p => (!p.archived || (staff && mode === "projects" && showArchived)) && (mode !== "remodels" || p.request?.type === "Remodel"));
  const filtered = active.filter(p => (!company || p.companyId === company) && (!stage || projectPhase(p) === stage) && `${p.name} ${p.location} ${name(p.companyId)} ${p.request?.summary || p.summary} ${p.request?.contactName || ""} ${p.request?.quoteReference || ""} ${p.scopes.map(s => s.quote).join(" ")}`.toLowerCase().includes(search.toLowerCase()));
  const title = requests ? "Requests & Quotes" : orders ? "Orders & Installation" : mode === "remodels" ? "Remodel Portfolio" : "All Projects";
  return <>
    <div className="portal-page-heading portal-tracker-hero"><div><span className="portal-eyebrow">SENIOR BY DESIGN · CLIENT EXPERIENCE</span><h1>{title}</h1><p>{requests ? "Capture the request, track pricing and presentation, then move confidently to approval." : orders ? "Follow deposits, purchasing, deliveries and anticipated installation dates." : "Browse communities and open each project’s complete workflow."}</p></div></div>
    {!requests && !orders && <dl className="portal-project-stats"><div><dt>Projects</dt><dd>{active.length}</dd></div><div><dt>New requests</dt><dd>{active.filter(p => p.request?.stage === "New Request").length}</dd></div><div><dt>Awaiting approval</dt><dd>{active.filter(p => approvalState(p) === "Pending").length}</dd></div><div><dt>Orders in process</dt><dd>{active.filter(p => p.order === "Ordered").length}</dd></div></dl>}
    <section className="portal-panel portal-request-pipeline">
      <div className="portal-section-title"><h2>{requests ? "Request Pipeline" : orders ? "Procurement & Install Tracker" : "Project Tracker"}</h2>{!orders && staff && <ProjectEditor organizations={organizations} onSaved={onSaved} />}</div>
      {!orders && <div className="portal-request-filters"><label>Search projects<input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search community, request or contact…" /></label><label>Client<select value={company} onChange={e => setCompany(e.target.value)}><option value="">All clients</option>{organizations.filter(o => o.type === "company" && active.some(p => p.companyId === o._id)).map(o => <option key={o._id} value={o._id}>{o.name}</option>)}</select></label><label>Current phase<select value={stage} onChange={e => setStage(e.target.value)}><option value="">All phases</option>{Array.from(new Set(active.map(projectPhase))).map(value => <option key={value}>{value}</option>)}</select></label></div>}
      {staff && mode === "projects" && <label className="portal-review-confirm portal-archive-filter"><input type="checkbox" checked={showArchived} onChange={event => setShowArchived(event.target.checked)} />Include archived projects</label>}
      <p className="portal-table-mobile-hint">Swipe the table to see all columns.</p>
      <div className="portal-tracker-scroll" role="region" aria-label={title} tabIndex={0}>
        <table className="portal-tracker-table"><caption className="portal-sr-only">{title} by client and community. Scroll horizontally to see all columns.</caption>
          <thead><tr><th scope="col">Client / Community</th><th scope="col">{requests ? "Request" : "Current phase"}</th><th scope="col">{requests ? "Quote" : "Approval"}</th><th scope="col">{orders ? "Payment" : "Presentation"}</th><th scope="col">Order status</th><th scope="col">Target install</th><th scope="col"><span className="portal-sr-only">Actions</span></th></tr></thead>
          <tbody>{filtered.map(p => <tr key={p._id}><td><strong>{name(p.companyId)}</strong><Link className="portal-tracker-project" href={`/portal/projects/${encodeURIComponent(p._id)}?from=${mode}${organizationId ? `&organization=${encodeURIComponent(organizationId)}` : ""}`}>{p.name}</Link>{p.archived && <StatusBadge value="Archived" />}</td><td>{requests ? p.request?.summary || p.summary || "Not recorded" : projectPhase(p)}</td><td>{requests ? <>{p.scopes.map(s => s.quote).join(" · ") || p.request?.quoteReference || "Not started"}{staff && <small>{amount(p.request?.quotedAmount)}</small>}</> : <StatusBadge value={approvalState(p)} />}</td><td><StatusBadge value={orders ? paymentLabel(p) : p.request?.presentation || "Not started"} /></td><td><StatusBadge value={orderLabel(p)} /></td><td>{displayDate(p.install)}</td><td><Link className="portal-link secondary" href={`/portal/projects/${encodeURIComponent(p._id)}?from=${mode}${organizationId ? `&organization=${encodeURIComponent(organizationId)}` : ""}`}>Details →<span className="portal-sr-only"> {p.name}</span></Link></td></tr>)}{!filtered.length && <tr><td colSpan={7}>No matching records.</td></tr>}</tbody>
        </table>
      </div>
    </section>
  </>;
}

export function ProjectRequestsQuotes({ project, staff, actor, busy, workflow, events, section = "approvals" }: {

  project: DisplayProject; staff: boolean; actor: Actor | null; busy: boolean; workflow: Workflow;
  section?: "quotes" | "approvals";

  events: { _id: string; action: string; email: string; at: string; note: string; resolution?: string }[];

}) {

  const approvals = section === "approvals";
  const [reviewed, setReviewed] = useState<Record<string, boolean>>({});

  const canRequest = staff || actor?.memberships.some(m => m.active && m.role === "admin" && [project.companyId, project.operatorId].includes(m.organizationId));

  const canApprove = !staff && actor?.memberships.some(m => m.active && m.role === "admin" && (m.organizationId === project.companyId || (project.operatorApproval && m.organizationId === project.operatorId)));

  const documents = project.documents.filter(d => d.category === "Quotes" && !d.historical);

  const request = project.request;

  return <section className="portal-panel portal-requests-detail" id={section}>

    <div className="portal-section-title"><div><span className="portal-eyebrow">SCOPE TO APPROVAL</span><h2>{approvals ? "Approvals" : "Request & Quote"}</h2></div><StatusBadge value={approvals ? approvalState(project) : projectPhase(project)} /></div>

    {approvals && <div className="portal-request-steps" aria-label="Request workflow"><span>1. Request &amp; scope</span><span>2. SBD prepares quote</span><span>3. Review document</span><span>4. Approve or request changes</span></div>}

    {!approvals && <dl className="portal-request-summary">

      <div><dt>Request summary</dt><dd>{request?.summary || project.summary || "No request recorded yet."}</dd></div>

      <div><dt>Date received</dt><dd>{request ? displayDate(request.receivedAt) : "Not recorded"}</dd></div>

      <div><dt>Quote reference</dt><dd>{project.scopes.map(scope => scope.quote).join(" · ") || request?.quoteReference || "Not started"}</dd></div>
      <div><dt>Quoted amount</dt><dd>{staff ? amount(request?.quotedAmount) : "Available upon request"}</dd></div>
      <div><dt>Current phase</dt><dd>{projectPhase(project)}</dd></div>

      <div><dt>Assigned to</dt><dd>{request?.assignedTo || "Unassigned"}</dd></div>

      <div><dt>Presentation</dt><dd>{request?.presentation || "Not started"}</dd></div>



    </dl>}

    <h3 className="portal-quotes-title">{approvals ? "Approval Queue" : "Quote references"}</h3>
    {project.scopes.length > 0 && <div className="portal-tracker-scroll" role="region" aria-label="Quote review queue" tabIndex={0}><table className="portal-tracker-table portal-quote-table"><thead><tr><th scope="col">Scope / Quote</th><th scope="col">Revision</th><th scope="col">Presentation</th><th scope="col">Current document</th><th scope="col">Decision</th><th scope="col">Next step</th></tr></thead><tbody>{project.scopes.map(scope => {
      const document = documents.find(d => d.id === scope.documentId);
      return <tr key={scope.quote}><td><strong>{scope.label}</strong><small>Quote {scope.quote}</small></td><td>{scope.revision}</td><td>{request?.presentation || "Not started"}</td><td>{document ? <a href={`/api/portal/documents?project=${encodeURIComponent(project._id)}&document=${encodeURIComponent(document.id)}`} target="_blank" rel="noopener noreferrer">{document.name}</a> : "SBD confirmation needed"}</td><td><StatusBadge value={scope.changesRequested ? "Changes Requested" : scope.approval} /></td><td><a className="portal-link secondary" href={approvals ? `#quote-${encodeURIComponent(scope.quote)}` : "#approvals"}>{staff ? "Manage review" : "Review quote"}</a></td></tr>;
    })}</tbody></table></div>}

    {!project.scopes.length && <p>No quote has been published yet. SBD will prepare a quote after reviewing the request.</p>}

    {approvals && project.scopes.map(scope => {

      const relevant = !request?.quoteReferences || request.quoteReferences.includes(scope.quote);
      const ready = quoteReady(project, scope);

      const document = documents.find(d => d.id === scope.documentId);

      const reviewKey = `${scope.quote}-${scope.revision}-${scope.documentId}`;

      return <article className="portal-quote-card" id={`quote-${scope.quote}`} key={scope.quote}>

        <div className="portal-section-title"><div><h3>{scope.label} · Quote {scope.quote}</h3><p>Revision {scope.revision}</p></div><StatusBadge value={scope.changesRequested ? "Changes Requested" : scope.approval} /></div>

        {!relevant && <p className="portal-muted">This quote belongs to an earlier scope. SBD must publish it for the current request before a new approval can be recorded.</p>}
        {document && <a className="portal-quote-document" href={`/api/portal/documents?project=${encodeURIComponent(project._id)}&document=${encodeURIComponent(document.id)}`} target="_blank" rel="noopener noreferrer">View quote: {document.name}<span className="portal-sr-only"> (opens in a new tab)</span></a>}

        {!ready && <p className="portal-quote-notice">{staff ? "Confirm a current, fixed quote document below to enable client approval." : "SBD is confirming the current quote document. Online approval will be available when it is ready."}</p>}

        {scope.changesRequested && <p className="portal-quote-notice">Changes have been requested. SBD must publish a revised quote or explicitly return the current revision for review before it can be approved.</p>}

        {relevant && ready && scope.approval !== "Approved" && !scope.changesRequested && canApprove && <div className="portal-quote-decision">

          <label className="portal-review-confirm"><input type="checkbox" checked={!!reviewed[reviewKey]} onChange={e => setReviewed({ ...reviewed, [reviewKey]: e.target.checked })} />I have reviewed quote {scope.quote}, revision {scope.revision}, and its current document.</label>

          <button disabled={busy || !reviewed[reviewKey]} onClick={() => { if (confirm(`Approve quote ${scope.quote}, revision ${scope.revision}? This decision will be recorded with your account.`)) void workflow("approve", { quote: scope.quote, revision: scope.revision }); }}>Approve quote</button>

        </div>}

        {!staff && !canApprove && scope.approval !== "Approved" && <p className="portal-muted">An authorized company administrator{project.operatorApproval ? " or operator administrator" : ""} must approve this quote.</p>}

        {!staff && canRequest && !scope.changesRequested && <details><summary>Request changes to this quote</summary><form key={`changes-${project.version}`} className="portal-request-form" onSubmit={e => { const data = fields(e); void workflow("request-changes", { ...data, quote: scope.quote }); }}><label>Describe the changes<textarea name="note" rows={3} required maxLength={2000} /></label><button disabled={busy}>Send change request to SBD</button></form></details>}

        {staff && <details className="portal-request-editor"><summary>{ready ? "Publish a revised quote" : "Confirm quote document"}</summary><form key={`quote-${project.version}`} className="portal-request-form" onSubmit={e => { const data = fields(e); void workflow("bind-quote", { quote: scope.quote, documentId: data.documentId, note: data.note, confirmStableRevision: data.stable === "on" }); }}>

          <label>Current quote document<select name="documentId" required defaultValue=""><option value="" disabled>Choose a current document</option>{documents.filter(d => !scope.revisionConfirmed || d.id !== scope.documentId).map(d => <option key={d.id} value={d.id}>{d.name}</option>)}</select></label>

          <label className="portal-review-confirm"><input name="stable" type="checkbox" required />This document link identifies a fixed revision.</label>

          <label>Revision / response note<textarea name="note" required rows={2} maxLength={2000} /></label>

          <p className="portal-muted">Publishing resets approval and sends this revision back to the client for review.</p>

          <button disabled={busy || !documents.length}>Publish quote for client review</button>

        </form></details>}

        {staff && (scope.approval === "Approved" || scope.changesRequested) && <details><summary>Return the same revision for review</summary><form className="portal-request-form" onSubmit={e => { const data = fields(e); void workflow("reopen", { quote: scope.quote, note: data.note }); }}><label>Reason / response to requested changes<textarea name="note" required rows={2} maxLength={2000} /></label><button className="secondary" disabled={busy}>Reopen for client review</button></form></details>}

      </article>;

    })}

    <details className="portal-request-history"><summary>Request &amp; quote history</summary>

      {events.filter(e => ["submit-request", "update-request", "add-quote", "add-quote-document", "bind-quote", "approve", "request-changes", "reopen", "resolve-report"].includes(e.action)).map(e => <div className="portal-row" key={e._id}><div><strong>{e.action.replaceAll("-", " ")}</strong><p>{e.note}</p><small>{e.email} · {new Date(e.at).toLocaleString()}{e.resolution ? ` · ${e.resolution}` : ""}</small></div></div>)}

      {!events.some(e => ["submit-request", "update-request", "add-quote", "add-quote-document", "bind-quote", "approve", "request-changes", "reopen", "resolve-report"].includes(e.action)) && <p>No request or quote decisions recorded yet.</p>}

    </details>

    {staff && <details className="portal-request-editor"><summary>Attach a quote document</summary><form key={`document-${project.version}`} className="portal-request-form" onSubmit={e => { const data = fields(e); void workflow("add-quote-document", data); }}>

      <label>Document name<input name="name" maxLength={300} placeholder="Quote 747 · Revision 2.pdf" required /></label>

      <label>Fixed SharePoint document link<input name="url" type="url" maxLength={4096} placeholder="https://seniorbydesign.sharepoint.com/…" required /></label>

      <label>Document note<input name="note" maxLength={2000} required /></label>

      <p className="portal-muted">Attach the fixed revision link, then publish it for client review. Existing approvals remain unchanged until the new revision is published.</p>

      <button disabled={busy}>Attach document</button>

    </form></details>}

    {staff && <details className="portal-request-editor"><summary>Add a quote</summary><form key={`new-quote-${project.version}`} className="portal-request-form" onSubmit={e => { const data = fields(e); void workflow("add-quote", { ...data, confirmStableRevision: data.stable === "on" }); }}>

      <div className="portal-request-form-grid"><label>Quote reference<input name="quote" maxLength={100} required /></label><label>Care type / scope code<input name="code" maxLength={40} placeholder="MC" required /></label></div>

      <label>Scope label<input name="label" maxLength={200} placeholder="Memory Care" required /></label>

      <label>Quote document<select name="documentId" required defaultValue=""><option value="" disabled>Choose a current document</option>{documents.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}</select></label>

      {!documents.length && <p>Attach a quote document above before publishing a quote.</p>}

      <label className="portal-review-confirm"><input name="stable" type="checkbox" required />This document link identifies a fixed revision.</label>

      <label>Quote note<textarea name="note" required rows={2} maxLength={2000} /></label><button disabled={busy || !documents.length}>Publish new quote</button>

    </form></details>}

  </section>;

}
