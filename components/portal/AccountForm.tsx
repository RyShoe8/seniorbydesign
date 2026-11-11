"use client";
import Image from "next/image";
import { useEffect, useState } from "react";
import { signIn, signOut } from "next-auth/react";
import PasswordInput from "./PasswordInput";
import "./portal.css";
import "./portal-work.css";
import "@/components/brand/workspace-theme.css";
export default function AccountForm({
  mode,
}: {
  mode: "login" | "reset" | "accept" | "change";
}) {
  const [invitation, setInvitation] = useState(false);
  const [profile, setProfile] = useState({ fullName: "", position: "", phone: "" });
  const [email, setEmail] = useState(""),
    [password, setPassword] = useState(""),
    [current, setCurrent] = useState(""),
    [token, setToken] = useState(""),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false);
  useEffect(() => {
    if (mode === "login" && new URLSearchParams(location.search).has("ready")) setMessage("Your account is ready. Sign in below.");
    if (mode === "accept") {
      const raw = location.hash.slice(1);
      setToken(raw);
      fetch("/api/account", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "inspect", token: raw }) }).then(async r => { const d = await r.json(); if (!r.ok) throw new Error(d.error); setInvitation(d.invitation); }).catch(e => setMessage(e.message));
      history.replaceState(null, "", location.pathname);
    }
  }, [mode]);
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      if (mode === "login") {
        const result = await signIn("credentials", {
          email,
          password,
          redirect: false,
        });
        if (result?.error)
          throw new Error(
            "Unable to sign in. Check your email and password or try again later.",
          );
        location.href = new URLSearchParams(location.search).has("staff")
          ? "/admin"
          : "/portal";
      } else {
        const response = await fetch("/api/account", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: mode === "change" ? "change-password" : mode,
            email,
            password,
            currentPassword: current,
            token,
            ...profile,
          }),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error);
        if (mode === "accept") {
          // Verified: go straight in, with no second trip to the sign-in page.
          const home = data.staff ? "/admin" : "/portal";
          if (password && data.email) {
            const result = await signIn("credentials", { email: data.email, password, redirect: false });
            location.href = result?.error ? "/account/login?ready=1" : home;
          } else location.href = home;
          return;
        }
        setMessage(
          data.message || "Your account is ready. You can now sign in.",
        );
        setPassword("");
        if (mode === "change") await signOut({ redirect: false });
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Please try again.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="portal-app">
      <div className="portal-panel portal-login">
        <Image
          src="/images/sbd-logo-no-tagline.png"
          alt="Senior By Design"
          width={180}
          height={180}
          style={{ height: "auto" }}
        />
        <h1>
          {
            {
              login: "Welcome back",
              reset: "Reset your password",
              accept: "Verify your account",
              change: "Change password",
            }[mode]
          }
        </h1>
        {message && (
          <p role="status" className="portal-alert">
            {message}
          </p>
        )}
        <form onSubmit={submit}>
          {["login", "reset"].includes(mode) && (
            <label>
              Email
              <input
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </label>
          )}
          {mode === "accept" && invitation && <>
            <label>Full name<input autoComplete="name" required value={profile.fullName} onChange={e => setProfile({ ...profile, fullName: e.target.value })} maxLength={150} /></label>
            <label>Position<input autoComplete="organization-title" required value={profile.position} onChange={e => setProfile({ ...profile, position: e.target.value })} maxLength={150} /></label>
            <label>Phone number (optional)<input type="tel" autoComplete="tel" value={profile.phone} onChange={e => setProfile({ ...profile, phone: e.target.value })} maxLength={50} /></label>
          </>}
          {mode === "change" && (
            <label>
              Current password
              <PasswordInput
                autoComplete="current-password"
                value={current}
                onChange={(e) => setCurrent(e.target.value)}
                required
              />
            </label>
          )}
          {mode !== "reset" && (
            <label>
              {mode === "login" ? "Password" : mode === "accept" ? "Choose a password (at least 8 characters)" : "New password (at least 8 characters)"}
              <PasswordInput
                autoComplete={
                  mode === "login" ? "current-password" : "new-password"
                }
                minLength={mode === "login" ? undefined : 8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required={mode !== "accept"}
              />
            </label>
          )}
          {mode === "accept" && (
            <p className="portal-muted">
              Already have an account? Sign in first, then reopen the invitation
              link. Existing members can leave the password blank.
            </p>
          )}
          <button disabled={busy}>
            {busy ? "Please wait…" : { login: "Sign in", reset: "Send reset link", accept: invitation ? "Accept invitation" : "Save new password", change: "Change password" }[mode]}
          </button>
        </form>
        <div className="portal-actions">
          {mode === "change" ? (
            <button type="button" className="secondary" onClick={() => history.back()}>Back</button>
          ) : (
            <>
              {mode !== "login" && <a href="/account/login">Back to sign in</a>}
              {mode !== "reset" && <a href="/account/reset">Forgot password?</a>}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
