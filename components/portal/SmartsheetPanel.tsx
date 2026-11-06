"use client";
import { useCallback, useEffect, useState } from "react";

interface Change { project: string; action: string; portal: string[]; sheetCells: number; issues: string[] }
interface Status {
  configured: boolean; writesEnabled: boolean; webhookActive: boolean; lastSyncAt: string | null; lastError: string;
  issues: { rowId: number; project: string; messages: string[] }[];
  linked?: number;
  sheet: { name: string; rows: number } | null;
  report: {
    fields: { key: string; label: string; column: string | null; readOnly: boolean }[];
    reference: string[];
  } | null;
}
const actionLabel: Record<string, string> = { create: "New project", update: "Update", link: "Link to existing", unlink: "Unlink (row removed)", quote: "Attach to existing quote" };

export default function SmartsheetPanel({ admin }: { admin: boolean }) {
  const [status, setStatus] = useState<Status | null>(null);
  const [plan, setPlan] = useState<Change[] | null>(null);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const load = useCallback(async () => {
    const response = await fetch("/api/portal/smartsheet");
    const data = await response.json();
    if (!response.ok) throw new Error(data.error);
    setStatus(data);
  }, []);
  useEffect(() => { load().catch((error) => setMessage(error.message)); }, [load]);
  async function act(action: string, done: string) {
    setBusy(true); setMessage("");
    try {
      const response = await fetch("/api/portal/smartsheet", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      if (data.plan) setPlan(data.plan);
      setMessage(done);
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Please try again.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="portal-panel portal-smartsheet">
      {message && <p className="portal-alert" role="status">{message}</p>}
      {!status && !message && <p>Checking the connection…</p>}
      {status && !status.configured && <p className="portal-alert">Smartsheet is not connected yet. Add SMARTSHEET_ACCESS_TOKEN to the site settings to read the sheet.</p>}
      {status?.sheet && <>
        <dl className="portal-project-stats">
          <div><dt>Sheet</dt><dd>{status.sheet.name}</dd></div>
          <div><dt>Rows linked</dt><dd>{status.linked ?? 0} of {status.sheet.rows}</dd></div>
          <div><dt>Portal edits to sheet</dt><dd>{status.writesEnabled ? "On" : "Off"}</dd></div>
          <div><dt>Live updates</dt><dd>{status.webhookActive ? "On" : "Off"}</dd></div>
        </dl>
        <p className="portal-muted">Tick Portal Visible on a row to bring it into the portal. The sync never adds or deletes rows or columns and never blanks a cell. Removing a row only unlinks its project.{status.lastSyncAt ? ` Last synced ${new Date(status.lastSyncAt).toLocaleString()}.` : ""}</p>
        {status.lastError && <p className="portal-alert">{status.lastError}</p>}
        <div className="portal-actions">
          <button disabled={busy} onClick={() => act("preview", "Preview ready. Nothing was changed.")}>Preview sync</button>
          {admin && <button className="secondary" disabled={busy} onClick={() => act("sync", "Sync finished.")}>Sync now</button>}
          {admin && !status.webhookActive && <button className="secondary" disabled={busy} onClick={() => act("connect-webhook", "Live updates are on.")}>Turn on live updates</button>}
        </div>
        {plan && <>
          <h2>Preview</h2>
          {plan.length === 0 ? <p>Everything already matches.</p> : <div className="portal-tracker-scroll"><table><thead><tr><th scope="col">Project</th><th scope="col">Action</th><th scope="col">Portal fields</th><th scope="col">Sheet cells</th><th scope="col">Needs attention</th></tr></thead>
            <tbody>{plan.map((entry, index) => <tr key={index}><td>{entry.project}</td><td>{actionLabel[entry.action] || entry.action}</td><td>{entry.portal.join(", ") || "None"}</td><td>{entry.sheetCells}</td><td>{entry.issues.join("; ") || "None"}</td></tr>)}</tbody></table></div>}
        </>}
        {status.issues.length > 0 && <>
          <h2>Needs attention</h2>
          <ul>{status.issues.map((issue) => <li key={issue.rowId}><strong>{issue.project}</strong>: {issue.messages.join("; ")}</li>)}</ul>
        </>}
        {status.report && <>
          <h2>Field mapping</h2>
          <div className="portal-tracker-scroll"><table><thead><tr><th scope="col">Portal field</th><th scope="col">Smartsheet column</th><th scope="col">Direction</th></tr></thead>
            <tbody>
              {status.report.fields.map((field) => <tr key={field.key}><td>{field.label}</td><td>{field.column || "Not on this sheet"}</td><td>{field.readOnly ? "From sheet" : "Both ways"}</td></tr>)}
            </tbody></table></div>
          {status.report.reference.length > 0 && <p className="portal-muted">Shown to staff on each project for reference, never changed: {status.report.reference.join(", ")}</p>}
        </>}
      </>}
    </section>
  );
}
