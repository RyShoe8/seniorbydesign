"use client";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import "@/components/portal/portal.css";
export default function StaffAccess() {
  const { data: session } = useSession();
  const [roles, setRoles] = useState<Record<string, string>>({});
  const [users, setUsers] = useState<
      { _id: string; email: string; role: string; disabled?: boolean; portalAccess?: boolean }[]
    >([]),
    [invites, setInvites] = useState<
      {
        email: string;
        delivery: string;
        revoked?: boolean;
        expiresAt: string;
      }[]
    >([]),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false);
  async function load() {
    const r = await fetch("/api/admin/users");
    const d = await r.json();
    if (!r.ok) throw new Error(d.error);
    setUsers(d.users);
    setRoles(Object.fromEntries(d.users.map((u: { _id: string; role: string }) => [u._id, u.role])));
    setInvites(d.invitations);
  }
  useEffect(() => {
    load().catch((e) => setMessage(e.message));
  }, []);
  async function send(data: unknown, method = "POST") {
    setBusy(true);
    try {
      const r = await fetch("/api/admin/users", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      await load();
      setMessage("Saved successfully.");
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Please try again");
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="portal-app">
      <h1>Staff access</h1>
      <p>
        Administrators manage staff invitations and roles. Team members manage website content;
        Administrators can also manage staff access. Company and operator accounts are managed in Client Portal.
      </p>
      {message && (
        <p role="status" className="portal-alert">
          {message}
        </p>
      )}
      <form
        className="portal-panel"
        onSubmit={(e) => {
          e.preventDefault();
          const f = new FormData(e.currentTarget);
          send({ email: f.get("email") });
        }}
      >
        <label>
          Team member email
          <input type="email" name="email" placeholder="name@seniorbydesign.com" autoComplete="email" required />
        </label>
        <button disabled={busy}>Send invitation</button>
      </form>
      <section className="portal-panel">
        <h2>Staff</h2>
        {users.map((u) => (
          <div className="portal-row" key={u._id}>
            <span>
              {u.email} · {u.role === "admin" ? "Administrator" : "Team"} ·{" "}
              {u.disabled ? "Disabled" : "Active"}
            </span>
            <label><input type="checkbox" disabled={busy} checked={u.portalAccess ?? (u.email.toLowerCase() === "ryanschumacher@themediashop.co")} onChange={e => send({ id: u._id, portalAccess: e.target.checked }, "PUT")} /> Client portal access</label>
            {!["ryanschumacher@themediashop.co", "glenn@sbdid.com"].includes(u.email.toLowerCase()) && u._id !== session?.user?.id && (
              <div className="portal-actions">
              <label>Role for {u.email}
                <select value={roles[u._id] || u.role} disabled={busy} onChange={e => setRoles({ ...roles, [u._id]: e.target.value })}>
                  <option value="team">Team</option>
                  <option value="admin">Administrator</option>
                </select>
              </label>
              <button disabled={busy || roles[u._id] === u.role} onClick={() => {
                if (confirm(`Change ${u.email} to ${roles[u._id] === 'admin' ? 'Administrator (can manage staff access)' : 'Team'}? They will need to sign in again.`))
                  send({ id: u._id, role: roles[u._id] }, "PUT");
              }}>Save role</button>
              <button
                disabled={busy}
                onClick={() =>
                  send({ id: u._id, disabled: !u.disabled }, "PUT")
                }
              >
                {u.disabled ? "Restore" : "Disable"}
              </button>
              </div>
            )}
          </div>
        ))}
      </section>
      <section className="portal-panel">
        <h2>Invitations</h2>
        {invites.length === 0 && <p className="admin-empty">No invitations yet. Invite a team member using the form above.</p>}
        {invites.map((i, n) => (
          <div className="portal-row" key={n}>
            <span>
              {i.email} ·{" "}
              {i.revoked
                ? "Revoked"
                : new Date(i.expiresAt) < new Date()
                  ? "Expired"
                  : i.delivery}
            </span>
            <div className="portal-actions">
              <button disabled={busy} onClick={() => send({ email: i.email })}>
                Resend
              </button>
              <button
                className="secondary"
                disabled={busy}
                onClick={() => send({ email: i.email, action: "revoke" })}
              >
                Revoke
              </button>
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
