"use client";
import { useEffect, useState } from "react";
import type { DisplayProject } from "./PortalWorkspace";

type Candidate = { name: string; url: string; category: string; reason: string };
const categories = ["Presentations", "Documents", "Quotes", "Contracts"];
export default function FileIngest({ project, onChanged }: { project: DisplayProject; onChanged: () => Promise<void> }) {
  const [configured, setConfigured] = useState(false);
  const [files, setFiles] = useState<Candidate[]>([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [picked, setPicked] = useState<Candidate | null>(null);
  useEffect(() => { fetch("/api/portal/files").then(r => r.json()).then(data => setConfigured(data.configured === true)).catch(() => {}); }, []);
  const sync = project.filesSync;
  const check = async () => {
    setBusy(true); setMessage("");
    try {
      const response = await fetch("/api/portal/files", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "sync", projectId: project._id }) });
      const result = await response.json(); if (!response.ok) throw new Error(result.error);
      setMessage(result.error || `Checked. ${result.added} file${result.added === 1 ? "" : "s"} saved${result.review ? `, ${result.review} waiting for review` : ""}${result.more ? ". More files remain; they will be picked up on the next check" : ""}.`);
      await onChanged();
    } catch (error) { setMessage(error instanceof Error ? error.message : "Check failed"); }
    finally { setBusy(false); }
  };
  return <details className="portal-file-ingest" open={Boolean(sync?.pending.length || sync?.error)}>
    <summary>Files from SharePoint{sync?.pending.length ? ` (${sync.pending.length} waiting for review)` : ""}</summary>
    {project.filesFolder || sync ? <div className="portal-files-auto">
      <p><strong>Automatic sync is {configured ? "on" : "waiting for the Microsoft connection"}.</strong> Presentations and project documents in this project&apos;s SharePoint folder are saved here by themselves, and a changed file becomes a new version. Quotes, contracts and anything that looks internal wait for you below.</p>
      {project.filesFolder && <p className="portal-muted">Folder{project.filesFolderAuto ? " (found automatically)" : ""}: {decodeURIComponent(project.filesFolder.split("/Comm%20-%20Remodels/")[1] || project.filesFolder)}</p>}
      <p className="portal-muted">{sync ? `Last checked ${new Date(sync.at).toLocaleString()}. ${sync.added} saved on that check.` : "Not checked yet."}{sync?.more ? " More files remain for the next check." : ""}</p>
      {sync?.error && <p role="alert" className="portal-alert">{sync.error}</p>}
      {configured && <button type="button" className="secondary" disabled={busy} onClick={check}>Check SharePoint now</button>}
      {sync && sync.pending.length > 0 && <>
        <h4>Waiting for your review</h4>
        <ul>{sync.pending.map(file => <li key={file.url}><button type="button" className="portal-text-button" onClick={() => setPicked(file)}>{file.name}</button> — {file.category || "Needs a category"}<small>{file.reason}</small></li>)}</ul>
      </>}
    </div> : <p className="portal-muted">Not checked yet. The portal finds this project&apos;s folder in Comm - Remodels by itself on the next check.</p>}
    <p>Files are saved as private, versioned copies for <strong>{project.name}</strong>. To publish one yourself, review the file and its category below. Earlier versions stay available; unchanged copies are skipped.</p>
    {message && <p role="status" className="portal-alert">{message}</p>}
    {configured ? <form onSubmit={async event => {
      event.preventDefault(); const folder = new FormData(event.currentTarget).get("folder");
      setBusy(true); setMessage("");
      try {
        const response = await fetch("/api/portal/files", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "scan", projectId: project._id, folder }) });
        const result = await response.json(); if (!response.ok) throw new Error(result.error);
        setFiles(result.files); setMessage(`${result.files.length} files found. Choose the files that belong to this project.`);
      } catch (error) { setMessage(error instanceof Error ? error.message : "Scan failed"); }
      finally { setBusy(false); }
    }}>
      <label>Project folder in Comm - Remodels<input type="url" name="folder" required /></label>
      <button disabled={busy}>Scan SharePoint folder</button>
    </form> : <p className="portal-muted">Automatic folder scanning needs a Microsoft application connection. You can import downloaded SharePoint files below.</p>}
    {files.length > 0 && <ul>{files.map(file => <li key={file.url}><button className="portal-text-button" onClick={() => setPicked(file)}>{file.name}</button> — {file.category || "Needs review"}<small>{file.reason}</small></li>)}</ul>}
    <form key={picked?.url || "manual"} className="portal-request-form" onSubmit={async event => {
      event.preventDefault(); const form = event.currentTarget; const data = new FormData(form);
      data.set("action", "publish"); data.set("projectId", project._id); data.set("version", String(project.version));
      setBusy(true); setMessage("");
      try {
        const uploaded = data.get("file");
        const hasUpload = uploaded instanceof File && uploaded.size > 0;
        if (!configured && !hasUpload) throw new Error("Select the downloaded source file");
        const response = await fetch("/api/portal/files", hasUpload ? { method: "POST", body: data } : { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(Object.fromEntries(data)) });
        const result = await response.json(); if (!response.ok) throw new Error(result.error);
        setMessage(result.added ? "File version saved. Earlier versions are preserved." : "This version is already in the portal; no duplicate added.");
        form.reset(); setPicked(null); await onChanged();
      } catch (error) { setMessage(error instanceof Error ? error.message : "Import failed"); }
      finally { setBusy(false); }
    }}>
      <label>SharePoint source file link<input name="url" type="url" defaultValue={picked?.url || ""} required /></label>
      <label>File name<input name="name" defaultValue={picked?.name || ""} maxLength={300} placeholder="Leave blank to use the source filename" /></label>
      <label>Category<select name="category" defaultValue={picked?.category || ""} required><option value="">Choose after reviewing</option>{categories.map(category => <option key={category}>{category}</option>)}</select></label>
      <label>Version of<select name="replacesId"><option value="">Match the source file, or add as a new document</option>{project.documents.filter(file => !file.historical).map(file => <option key={file.id} value={file.id}>{file.name}{file.revision ? ` — version ${file.revision}` : ""}</option>)}</select></label>
      <p className="portal-muted">If the filename changed (for example, a new date or “Rev 2”), choose the earlier document above to keep its version history together. Replacing a quote requires a new approval.</p>
      <label>Downloaded source file{configured ? " (optional)" : ""}<input name="file" type="file" required={!configured} accept=".pdf,.ppt,.pptx,.pps,.ppsx,.doc,.docx,.xls,.xlsx,.csv,.txt,.png,.jpg,.jpeg,.webp" /></label>
      <small>Uploads up to 4 MB; connected SharePoint imports up to 100 MB.</small>
      <button disabled={busy}>Publish reviewed file</button>
    </form>
  </details>;
}
