"use client";
import Image from "next/image";
import { useEffect, useState } from "react";
import { signIn, signOut } from "next-auth/react";
import "./portal.css";
export default function AccountForm({
  mode,
}: {
  mode: "login" | "reset" | "accept" | "change";
}) {
  const [email, setEmail] = useState(""),
    [password, setPassword] = useState(""),
    [current, setCurrent] = useState(""),
    [token, setToken] = useState(""),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false);
  useEffect(() => {
    if (mode === "accept") {
      setToken(location.hash.slice(1));
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
          }),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error);
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
          {mode === "change" && (
            <label>
              Current password
              <input
                type="password"
                autoComplete="current-password"
                value={current}
                onChange={(e) => setCurrent(e.target.value)}
                required
              />
            </label>
          )}
          {mode !== "reset" && (
            <label>
              {mode === "login"
                ? "Password"
                : "New password (new accounts and password resets)"}
              <input
                type="password"
                autoComplete={
                  mode === "login" ? "current-password" : "new-password"
                }
                minLength={mode === "login" ? undefined : 12}
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
            {busy ? "Please wait…" : mode === "login" ? "Sign in" : "Continue"}
          </button>
        </form>
        <div className="portal-actions">
          <a href="/account/login">Sign in</a>
          <a href="/account/reset">Forgot password?</a>
        </div>
      </div>
    </div>
  );
}
