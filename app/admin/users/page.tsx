"use client";
import { useEffect, useState } from "react";
import "@/components/portal/portal.css";
export default function StaffAccess() {
  const [users, setUsers] = useState<
      { _id: string; email: string; role: string; disabled?: boolean }[]
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
      <h1>Staff Access</h1>
      <p>
        Administrators invite SBD Team members. Company and operator accounts
        are managed in Client Portal.
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
          <input type="email" name="email" required />
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
            {u.role !== "admin" && (
              <button
                disabled={busy}
                onClick={() =>
                  send({ id: u._id, disabled: !u.disabled }, "PUT")
                }
              >
                {u.disabled ? "Restore" : "Disable"}
              </button>
            )}
          </div>
        ))}
      </section>
      <section className="portal-panel">
        <h2>Invitations</h2>
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
