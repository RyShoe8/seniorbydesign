"use client";

import Link from "next/link";

import { useState, type FormEvent } from "react";

import type { Actor, Organization } from "@/lib/portal/types";

import type { DisplayProject } from "./PortalWorkspace";

import { displayDate, StatusBadge } from "./PortalWorkspace";

import { presentationStages, quoteReady, requestStage, requestStages, requestTypes } from "@/lib/portal/requests";



type Workflow = (action: string, data?: Record<string, unknown>) => Promise<unknown> | undefined;

const fields = (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); return Object.fromEntries(new FormData(event.currentTarget)); };

const amount = (value?: number) => value === undefined ? "Not entered" : new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value);



export function RequestPipeline({ projects, organizations, staff, actor, busy, save }: {

  projects: DisplayProject[]; organizations: Organization[]; staff: boolean; actor: Actor | null; busy: boolean;

  save: (project: DisplayProject, data: Record<string, unknown>) => Promise<unknown>;

}) {

  const [search, setSearch] = useState("");

  const [company, setCompany] = useState("");

  const [stage, setStage] = useState("");

  const [adding, setAdding] = useState(false);

  const name = (id: string) => organizations.find(o => o._id === id)?.name || "Company";

  const active = projects.filter(p => !p.archived);

  const eligible = active.filter(p => !p.request && (staff || actor?.memberships.some(m => m.active && m.role === "admin" && [p.companyId, p.operatorId].includes(m.organizationId))));

  const filtered = active.filter(p => (!company || p.companyId === company) && (!stage || requestStage(p) === stage) &&

    `${p.name} ${p.location} ${name(p.companyId)} ${p.request?.summary || p.summary} ${p.scopes.map(s => s.quote).join(" ")}`.toLowerCase().includes(search.toLowerCase()));

  return <>

    <div className="portal-page-heading"><div><span className="portal-eyebrow">PROJECT WORKSPACE</span><h1>Requests &amp; Quotes</h1><p>Capture the request, track pricing and presentation, then move confidently to approval.</p></div></div>

    <section className="portal-panel portal-request-pipeline">

      <div className="portal-section-title"><h2>Request Pipeline <span className="portal-count">{filtered.length}</span></h2>

        {eligible.length > 0 && <button onClick={() => setAdding(!adding)} aria-expanded={adding}>{adding ? "Cancel request" : "+ New request"}</button>}

        {staff && <Link className="portal-link secondary" href="/portal/create/project">New project</Link>}

      </div>

      {adding && eligible.length > 0 && <form key={eligible.map(p => p._id).join(",")} className="portal-request-form" onSubmit={e => {

        const data = fields(e); const project = eligible.find(p => p._id === data.projectId);

        if (project) void save(project, { action: "submit-request", ...data });

      }}>

        <h3>New project request</h3><p>Select a project and describe the work you need. SBD will review the scope and prepare a quote.</p>

        <label>Community / project<select name="projectId" required defaultValue=""><option value="" disabled>Choose a project</option>{eligible.map(p => <option key={p._id} value={p._id}>{name(p.companyId)} · {p.name}</option>)}</select></label>

        <label>Project type<select name="type">{requestTypes.map(v => <option key={v}>{v}</option>)}</select></label>

        <label>Request / scope<textarea name="summary" rows={3} maxLength={2000} required /></label>

        <button disabled={busy}>Submit request to SBD</button>

      </form>}

      <div className="portal-request-filters">

        <label>Search requests<input value={search} onChange={e => setSearch(e.target.value)} placeholder="Community, company, request, or quote" /></label>

        <label>Client<select value={company} onChange={e => setCompany(e.target.value)}><option value="">All clients</option>{organizations.filter(o => o.type === "company").map(o => <option key={o._id} value={o._id}>{o.name}</option>)}</select></label>

        <label>Current stage<select value={stage} onChange={e => setStage(e.target.value)}><option value="">All stages</option>{[...requestStages, "Awaiting Approval", "Changes Requested", "Approved"].map(v => <option key={v}>{v}</option>)}</select></label>

      </div>

      <div className="portal-request-list">

        {filtered.map(p => <article className="portal-request-item" key={p._id}>

          <div className="portal-request-community"><span className="portal-eyebrow">{name(p.companyId)}</span><h3><Link href={`/portal/projects/${encodeURIComponent(p._id)}#quotes`}>{p.name}</Link></h3><p>{p.location}</p><StatusBadge value={requestStage(p)} /></div>

          <dl className="portal-request-data">

            <div><dt>Request</dt><dd>{p.request?.summary || p.summary || "Scope not recorded"}</dd><dt>Date received</dt><dd>{p.request ? displayDate(p.request.receivedAt) : "Not recorded"}</dd></div>

            <div><dt>Quote</dt><dd>{p.scopes.map(s => s.quote).join(" · ") || "Not started"}</dd>{staff && <><dt>Quoted amount · internal</dt><dd>{amount(p.request?.quotedAmount)}</dd></>}</div>

            <div><dt>Presentation</dt><dd>{p.request?.presentation || "Not started"}</dd><dt>Assigned to</dt><dd>{p.request?.assignedTo || "Unassigned"}</dd></div>

            <div><dt>Order status</dt><dd>{p.order}</dd><dt>Target install</dt><dd>{displayDate(p.install)}</dd></div>

          </dl>

          <Link className="portal-link secondary" href={`/portal/projects/${encodeURIComponent(p._id)}#quotes`}>Review request &amp; quotes</Link>

        </article>)}

        {!filtered.length && <p className="portal-calm-state">No matching requests or quotes.</p>}

      </div>

    </section>

  </>;

}



export function ProjectRequestsQuotes({ project, staff, actor, busy, workflow, events }: {

  project: DisplayProject; staff: boolean; actor: Actor | null; busy: boolean; workflow: Workflow;

  events: { _id: string; action: string; email: string; at: string; note: string; resolution?: string }[];

}) {

  const [reviewed, setReviewed] = useState<Record<string, boolean>>({});

  const canRequest = staff || actor?.memberships.some(m => m.active && m.role === "admin" && [project.companyId, project.operatorId].includes(m.organizationId));

  const canApprove = !staff && actor?.memberships.some(m => m.active && m.role === "admin" && (m.organizationId === project.companyId || (project.operatorApproval && m.organizationId === project.operatorId)));

  const documents = project.documents.filter(d => d.category === "Quotes" && !d.historical);

  const request = project.request;

  return <section className="portal-panel portal-requests-detail" id="quotes">

    <div className="portal-section-title"><div><span className="portal-eyebrow">SCOPE TO APPROVAL</span><h2>Requests &amp; Quotes</h2></div><StatusBadge value={requestStage(project)} /></div>

    <div className="portal-request-steps" aria-label="Request workflow"><span>1. Request &amp; scope</span><span>2. SBD prepares quote</span><span>3. Review document</span><span>4. Approve or request changes</span></div>

    <dl className="portal-request-summary">

      <div><dt>Request summary</dt><dd>{request?.summary || project.summary || "No request recorded yet."}</dd></div>

      <div><dt>Date received</dt><dd>{request ? displayDate(request.receivedAt) : "Not recorded"}</dd></div>

      <div><dt>Project type</dt><dd>{request?.type || "Not recorded"}</dd></div>

      <div><dt>Assigned to</dt><dd>{request?.assignedTo || "Unassigned"}</dd></div>

      <div><dt>Presentation</dt><dd>{request?.presentation || "Not started"}</dd></div>

      {staff && <div><dt>Quoted amount · internal</dt><dd>{amount(request?.quotedAmount)}</dd></div>}

    </dl>

    {(staff || (!request && canRequest)) && <details className="portal-request-editor"><summary>{staff ? "Manage request & pipeline" : "Submit a project request"}</summary>

      <form key={`request-${project.version}`} className="portal-request-form" onSubmit={e => { const data = fields(e); void workflow(staff ? "update-request" : "submit-request", data); }}>

        <label>Request / scope<textarea name="summary" required rows={3} maxLength={2000} defaultValue={request?.summary || project.summary} /></label>

        <div className="portal-request-form-grid">

          <label>Project type<select name="type" defaultValue={request?.type || "Remodel"}>{requestTypes.map(v => <option key={v}>{v}</option>)}</select></label>

          {staff && <>

            <label>Date received<input type="date" name="receivedAt" required defaultValue={request?.receivedAt || new Date().toLocaleDateString("en-CA")} /></label>

            <label>Preparation stage<select name="stage" defaultValue={request?.stage || "New Request"}>{requestStages.map(v => <option key={v}>{v}</option>)}</select></label>

            <label>Assigned to<input name="assignedTo" maxLength={200} defaultValue={request?.assignedTo} /></label>

            <label>Presentation<select name="presentation" defaultValue={request?.presentation || "Not started"}>{presentationStages.map(v => <option key={v}>{v}</option>)}</select></label>

            <label>Quoted amount · internal (USD)<input name="quotedAmount" type="number" min="0" max="10000000000" step="0.01" defaultValue={request?.quotedAmount} /></label>

          </>}

        </div>

        {staff && <><p className="portal-muted">Approval stages follow the published quote decisions automatically.</p><label>Update note<input name="note" required maxLength={2000} /></label></>}

        <button disabled={busy}>{staff ? "Save request details" : "Submit request to SBD"}</button>

      </form>

    </details>}

    <h3 className="portal-quotes-title">Quotes &amp; decisions</h3>

    {!project.scopes.length && <p>No quote has been published yet. SBD will prepare a quote after reviewing the request.</p>}

    {project.scopes.map(scope => {

      const relevant = !request?.quoteReferences || request.quoteReferences.includes(scope.quote);
      const ready = quoteReady(project, scope);

      const document = documents.find(d => d.id === scope.documentId);

      const reviewKey = `${scope.quote}-${scope.revision}-${scope.documentId}`;

      return <article className="portal-quote-card" key={scope.quote}>

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
