"use client";
import Link from "next/link";
import type { DisplayProject } from "./PortalWorkspace";
import type { Organization } from "@/lib/portal/types";
import { approvalState, currentScopes, needsDecision, needsRevision, projectAction } from "@/lib/portal/requests";
import { StatusBadge } from "./PortalWorkspace";
export function ApprovalQueue({ projects, organizations, staff = false, organizationId = "" }: { projects: DisplayProject[]; organizations: Organization[]; staff?: boolean; organizationId?: string }) {
  const name = (id: string) => organizations.find(o => o._id === id)?.name || "Company";
  const open = projects.filter(p => !p.archived);
  const waiting = open.filter(p => needsDecision(p) && !needsRevision(p));
  const revising = open.filter(needsRevision);
  const rest = open.filter(p => !waiting.includes(p) && !revising.includes(p));
  const row = (p: DisplayProject) => {
    const quotes = currentScopes(p).map(s => `${s.label} · Quote ${s.quote}`).join(", ");
    const action = projectAction(p, staff);
    const decision = waiting.includes(p) || revising.includes(p);
    return <div className="portal-approval-queue-row" key={p._id}>
      <div><strong>{p.name}</strong><p>{staff ? `${name(p.companyId)} · ` : ""}{quotes || "No quote published yet"}</p>{decision && <p>{action.label}</p>}</div>
      <StatusBadge value={approvalState(p)} />
      <Link className={`portal-link ${decision && !staff ? "" : "secondary"}`} href={`/portal/projects/${encodeURIComponent(p._id)}?from=approvals${organizationId ? `&organization=${encodeURIComponent(organizationId)}` : ""}#approvals`}>{decision ? action.cta : "Open"} →<span className="portal-sr-only"> {p.name}</span></Link>
    </div>;
  };
  return <>
    <div className="portal-work-heading"><div><h1>Approvals</h1><p>{staff ? "Quotes with clients, and quotes you owe a revision on." : "Quotes waiting for your decision."}</p></div></div>
    <section className="portal-panel portal-queue primary">
      <h2>{staff ? "Waiting on clients" : "Waiting for your decision"} <span className="portal-count">{waiting.length}</span></h2>
      {waiting.length ? waiting.map(row) : <p className="portal-empty-copy">{staff ? "No quotes are with clients right now." : "Nothing needs your decision. You're all caught up."}</p>}
    </section>
    {revising.length > 0 && <section className="portal-panel portal-queue"><h2>{staff ? "Revisions to send" : "SBD is revising"} <span className="portal-count">{revising.length}</span></h2>{revising.map(row)}</section>}
    {rest.length > 0 && <details className="portal-panel portal-approval-rest"><summary>All other projects ({rest.length})</summary>{rest.map(row)}</details>}
    {!open.length && <p>No projects available.</p>}
  </>;
}
export function ClientContacts({ projects, organizations }: { projects: DisplayProject[]; organizations: Organization[] }) {
  const contacts = [...new Map(projects.filter(p => !p.archived && (p.request?.contactName || p.request?.contactEmail)).map(p => [`${p.companyId}/${p.request?.contactEmail || p.request?.contactName}`, p])).values()];
  return <><div className="portal-work-heading"><div><h1>Client Contacts</h1><p>Key contacts organized by client and community.</p></div></div><div className="portal-contacts-grid">{contacts.map(p => <section className="portal-panel" key={`${p.companyId}/${p.request?.contactEmail || p.request?.contactName}`}><span className="portal-eyebrow">{organizations.find(o => o._id === p.companyId)?.name || "Company"}</span><h2>{p.request?.contactName || "Client contact"}</h2><p>{p.request?.contactEmail ? <a href={`mailto:${p.request.contactEmail}`}>{p.request.contactEmail}</a> : "Email not recorded"}</p><p>SBD owner: {p.request?.assignedTo || "Unassigned"}</p></section>)}</div>{!contacts.length && <section className="portal-panel"><p>No client contacts have been recorded. SBD can add them using Edit project details.</p></section>}</>;
}
