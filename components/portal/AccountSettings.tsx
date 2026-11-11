"use client";
import Image from "next/image";
import { useEffect, useState } from "react";
import { signOut } from "next-auth/react";
import PasswordInput from "./PasswordInput";
import "./portal.css";
import "./portal-work.css";
import "@/components/brand/workspace-theme.css";

type Section = "details" | "email" | "password";

/** One page for everything about your own account: name, email, password and signing out. */
export default function AccountSettings() {
  const [loaded, setLoaded] = useState(false);
  const [staff, setStaff] = useState(false);
  const [profile, setProfile] = useState({ fullName: "", position: "", phone: "" });
  const [email, setEmail] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [emailPassword, setEmailPassword] = useState("");
  const [current, setCurrent] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState<Section | null>(null);
  const [notice, setNotice] = useState<{ section: Section; text: string; error?: boolean } | null>(null);

  async function call(payload: Record<string, unknown>) {
    const response = await fetch("/api/account", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Please try again.");
    return data;
  }

  useEffect(() => {
    call({ action: "me" })
      .then((me) => {
        setEmail(me.email);
        setStaff(me.staff);
        setProfile({ fullName: me.fullName, position: me.position, phone: me.phone });
        setLoaded(true);
      })
      .catch(() => { location.href = "/account/login"; });
  }, []);

  async function run(section: Section, payload: Record<string, unknown>, after?: () => void | Promise<void>) {
    setBusy(section);
    setNotice(null);
    try {
      const data = await call(payload);
      setNotice({ section, text: data.message || "Saved." });
      await after?.();
    } catch (error) {
      setNotice({ section, text: error instanceof Error ? error.message : "Please try again.", error: true });
    } finally {
      setBusy(null);
    }
  }
  // Changing your email or password ends every session, so you sign in again with the new one.
  const signInAgain = async () => {
    await signOut({ redirect: false });
    setTimeout(() => { location.href = "/account/login"; }, 1800);
  };
  const message = (section: Section) =>
    notice?.section === section && (
      <p role={notice.error ? "alert" : "status"} className="portal-alert">{notice.text}</p>
    );
  const home = staff ? "/admin" : "/portal";

  return (
    <div className="portal-app">
      <div className="portal-panel portal-login portal-account-settings">
        <Image src="/images/sbd-logo-no-tagline.png" alt="Senior By Design" width={180} height={180} style={{ height: "auto" }} />
        <h1>Your account</h1>
        {!loaded ? <p className="portal-muted">Loading…</p> : <>
          <p className="portal-muted">Signed in as {email}</p>

          <form onSubmit={(e) => { e.preventDefault(); run("details", { action: "update-profile", ...profile }); }}>
            <h2>Your details</h2>
            {message("details")}
            <label>Full name<input autoComplete="name" required maxLength={150} value={profile.fullName} onChange={(e) => setProfile({ ...profile, fullName: e.target.value })} /></label>
            <label>Position<input autoComplete="organization-title" maxLength={150} value={profile.position} onChange={(e) => setProfile({ ...profile, position: e.target.value })} /></label>
            <label>Phone number (optional)<input type="tel" autoComplete="tel" maxLength={50} value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} /></label>
            <button disabled={busy === "details"}>{busy === "details" ? "Saving…" : "Save details"}</button>
          </form>

          <form onSubmit={(e) => { e.preventDefault(); run("email", { action: "change-email", email: newEmail, currentPassword: emailPassword }, signInAgain); }}>
            <h2>Email address</h2>
            {message("email")}
            <label>New email<input type="email" autoComplete="email" required value={newEmail} onChange={(e) => setNewEmail(e.target.value)} /></label>
            <label>Current password<PasswordInput autoComplete="current-password" required value={emailPassword} onChange={(e) => setEmailPassword(e.target.value)} /></label>
            <p className="portal-muted">You sign in with this address and project updates are sent to it. You will be asked to sign in again.</p>
            <button disabled={busy === "email"}>{busy === "email" ? "Saving…" : "Change email"}</button>
          </form>

          <form onSubmit={(e) => { e.preventDefault(); run("password", { action: "change-password", currentPassword: current, password }, signInAgain); }}>
            <h2>Password</h2>
            {message("password")}
            <label>Current password<PasswordInput autoComplete="current-password" required value={current} onChange={(e) => setCurrent(e.target.value)} /></label>
            <label>New password (at least 8 characters)<PasswordInput autoComplete="new-password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} /></label>
            <button disabled={busy === "password"}>{busy === "password" ? "Saving…" : "Change password"}</button>
          </form>

          <div className="portal-actions">
            <a href={home}>Back to {staff ? "the workspace" : "your projects"}</a>
            <button type="button" className="secondary" onClick={() => signOut({ callbackUrl: "/account/login" })}>Sign out</button>
          </div>
        </>}
      </div>
    </div>
  );
}
