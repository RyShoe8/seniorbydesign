"use client";
import { useState } from "react";
import type { Organization, Membership, Project } from "@/lib/portal/types";
type Invitation = { email: string; organizationId: string; role?: string; delivery: string; revoked?: boolean; expiresAt: string };
export default function OrganizationDirectory({ organizations, members, invitations, projects, staff, busy, manage, send }: { organizations: Organization[]; members: Membership[]; invitations: Invitation[]; projects: Pick<Project, "companyId" | "request">[]; staff: boolean; busy: boolean; manage: (id: string) => boolean; send: (data: unknown) => void }) {
  const [query, setQuery] = useState("");
  const term = query.trim().toLowerCase();
  const includes = (...values: (string | undefined)[]) => values.join(" ").toLowerCase().includes(term);
  return <section>
    <h1>Companies &amp; operators</h1>
    <label className="portal-directory-search">Search companies, operators, and people<input type="search" value={query} onChange={e => setQuery(e.target.value)} placeholder="Name, email, phone, position, or organization…" /></label>
    {!organizations.length && <p>No companies or operators are assigned yet.</p>}
    {organizations.map(o => {
      const people = members.filter(m => m.organizationId === o._id);
      const contacts = projects.filter(p => p.companyId === o._id && p.request?.contactEmail && !people.some(m => m.email.toLowerCase() === p.request!.contactEmail!.toLowerCase())).map(p => p.request!).filter((r, i, all) => all.findIndex(a => a.contactEmail === r.contactEmail) === i);
      const pending = invitations.filter(i => i.organizationId === o._id);
      const orgMatch = includes(o.name, o.type);
      const matching = people.filter(m => orgMatch || includes(m.fullName, m.email, m.phone, m.position));
      const matchingContacts = contacts.filter(c => orgMatch || includes(c.contactName, c.contactEmail));
      if (!orgMatch && !matching.length && !matchingContacts.length && !pending.some(i => includes(i.email))) return null;
      return <details className="portal-panel portal-organization" key={o._id} open={term ? true : undefined}>
        <summary><strong>{o.name}</strong><span>{o.type} · {people.length} people{o.active ? "" : " · Inactive"}</span></summary>
        <div className="portal-actions"><a href={`/portal/projects?organization=${encodeURIComponent(o._id)}`}>View projects</a>{staff && <button className="secondary" disabled={busy} onClick={() => { const name = prompt("Organization name", o.name); if (name) send({ action: "rename", organizationId: o._id, name }); }}>Edit name</button>}</div>
        <h2>People</h2>
        {!matching.length && !matchingContacts.length && <p>No people match this search.</p>}
        {matching.map(m => <div className="portal-row" key={m._id}><div><strong>{m.fullName || "Name not recorded"}</strong><p>{m.position || "Position not recorded"}</p><a href={`mailto:${m.email}`}>{m.email}</a><p>{m.phone ? <a href={`tel:${m.phone}`}>{m.phone}</a> : "Phone not provided"}</p><small>{m.role === "admin" ? "Account administrator" : "Member"} · {m.active ? "Active" : "Disabled"}</small></div>{manage(o._id) && <div className="portal-actions"><button className="secondary" disabled={busy} onClick={() => send({ action: "membership", organizationId: o._id, memberId: m._id, role: m.role === "admin" ? "member" : "admin", active: m.active })}>{m.role === "admin" ? "Make member" : "Make admin"}</button><button className="secondary" disabled={busy} onClick={() => send({ action: "membership", organizationId: o._id, memberId: m._id, role: m.role, active: !m.active })}>{m.active ? "Disable" : "Restore"}</button></div>}</div>)}
        {matchingContacts.map(c => <div className="portal-row" key={c.contactEmail}><div><strong>{c.contactName || "Project contact"}</strong><p><a href={`mailto:${c.contactEmail}`}>{c.contactEmail}</a></p><small>Project contact · Portal account not assigned · Phone not recorded</small></div></div>)}
        {manage(o._id) && o.active && <><h2>{staff ? "Invite an account administrator" : "Invite a teammate"}</h2><p>{staff ? "They can manage this account and invite their company or operator team." : "Invite someone to this account and choose their access."}</p><form onSubmit={e => { e.preventDefault(); const f = new FormData(e.currentTarget); send({ action: "invite", organizationId: o._id, email: f.get("email"), role: staff ? "admin" : f.get("role") }); }}><label>Email<input name="email" type="email" autoComplete="email" required /></label>{!staff && <label>Access<select name="role"><option value="member">Member</option><option value="admin">Account administrator</option></select></label>}<button disabled={busy}>Send invitation</button></form><h3>Invitations</h3>{pending.map((i,n) => <div className="portal-row" key={n}><span>{i.email} · {i.revoked ? "Revoked" : new Date(i.expiresAt) < new Date() ? "Expired" : i.delivery}</span><div className="portal-actions"><button disabled={busy} onClick={() => send({ action: "invite", organizationId: o._id, email: i.email, role: i.role || "admin" })}>Resend</button><button className="secondary" disabled={busy} onClick={() => send({ action: "revoke-invite", organizationId: o._id, email: i.email })}>Revoke</button></div></div>)}</>}
      </details>;
    })}
  </section>;
}
