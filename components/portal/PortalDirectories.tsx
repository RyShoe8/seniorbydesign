"use client";
import Link from "next/link";
import type { DisplayProject } from "./PortalWorkspace";
import type { Organization } from "@/lib/portal/types";
import { approvalState } from "@/lib/portal/requests";
import { StatusBadge } from "./PortalWorkspace";
export function ApprovalQueue({ projects, organizations, organizationId = "" }: { projects: DisplayProject[]; organizations: Organization[]; organizationId?: string }) {
  const name = (id: string) => organizations.find(o => o._id === id)?.name || "Company";
  return <><div className="portal-page-heading portal-tracker-hero"><div><span className="portal-eyebrow">SENIOR BY DESIGN · CLIENT EXPERIENCE</span><h1>Presentations &amp; Approvals</h1><p>A clear record of what has been presented and what needs a decision.</p></div></div><section className="portal-panel"><h2>Approval Queue</h2>{projects.filter(p => !p.archived).map(p => <div className="portal-approval-queue-row" key={p._id}><div><strong>{name(p.companyId)} · {p.name}</strong><p>Presentation: {p.request?.presentation || "Not started"} · {p.request?.summary || p.summary}</p></div><StatusBadge value={approvalState(p)} /><Link className="portal-link secondary" href={`/portal/projects/${encodeURIComponent(p._id)}?from=approvals${organizationId ? `&organization=${encodeURIComponent(organizationId)}` : ""}#approvals`}>Open →<span className="portal-sr-only"> {p.name}</span></Link></div>)}{!projects.some(p => !p.archived) && <p>No projects available.</p>}</section></>;
}
export function ClientContacts({ projects, organizations }: { projects: DisplayProject[]; organizations: Organization[] }) {
  const contacts = [...new Map(projects.filter(p => !p.archived && (p.request?.contactName || p.request?.contactEmail)).map(p => [`${p.companyId}/${p.request?.contactEmail || p.request?.contactName}`, p])).values()];
  return <><div className="portal-page-heading portal-tracker-hero"><div><span className="portal-eyebrow">SENIOR BY DESIGN · CLIENT EXPERIENCE</span><h1>Client Contacts</h1><p>Key contacts organized by client and community.</p></div></div><div className="portal-contacts-grid">{contacts.map(p => <section className="portal-panel" key={`${p.companyId}/${p.request?.contactEmail || p.request?.contactName}`}><span className="portal-eyebrow">{organizations.find(o => o._id === p.companyId)?.name || "Company"}</span><h2>{p.request?.contactName || "Client contact"}</h2><p>{p.request?.contactEmail ? <a href={`mailto:${p.request.contactEmail}`}>{p.request.contactEmail}</a> : "Email not recorded"}</p><p>SBD owner: {p.request?.assignedTo || "Unassigned"}</p></section>)}</div>{!contacts.length && <section className="portal-panel"><p>No client contacts have been recorded. SBD can add them using Edit project details.</p></section>}</>;
}
