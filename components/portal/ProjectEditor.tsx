"use client";
import { useEffect, useRef, useState } from "react";
import type { Organization } from "@/lib/portal/types";
import type { DisplayProject } from "./PortalWorkspace";
import { approvalState, orderLabel, orderStages, paymentLabel, paymentStages, presentationStages, requestStages, requestTypes } from "@/lib/portal/requests";

export function ProjectEditor({ project, organizations, onSaved, buttonLabel }: {
  project?: DisplayProject; organizations: Organization[]; onSaved: (id: string) => Promise<void> | void; buttonLabel?: string;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const request = project?.request;
  const today = new Date().toLocaleDateString("en-CA", { timeZone: "America/Chicago" });
  useEffect(() => { dialog.current?.close(); setError(""); }, [project?._id]);
  const select = (name: string, label: string, options: readonly string[], value?: string) => <label>{label}<select name={name} defaultValue={value || options[0]}>{Array.from(new Set(value ? [value, ...options] : options)).map(option => <option key={option}>{option}</option>)}</select></label>;
  return <>
    <button type="button" onClick={() => { setError(""); dialog.current?.showModal(); }}>{buttonLabel || (project ? "Edit project details" : "+ New request")}</button>
    <dialog className="portal-project-dialog" ref={dialog} aria-labelledby={`editor-title-${project?._id || "new"}`} onCancel={event => { if (busy) event.preventDefault(); }} onClick={event => { if (event.target === event.currentTarget && !busy) dialog.current?.close(); }}>
      <div className="portal-project-dialog-body">
        <h2 id={`editor-title-${project?._id || "new"}`}>{project ? "Update Project" : "New Remodel / Project Request"}</h2>
        <p>Project details, scope, and workflow are managed by SBD. Approval decisions are recorded against the published quote revision.</p>
        {error && <p className="portal-alert" role="alert">{error}</p>}
        <form key={`${project?._id || "new"}-${project?.version || 0}`} onSubmit={async event => {
          event.preventDefault(); setError(""); setBusy(true);
          const fields = Object.fromEntries(new FormData(event.currentTarget));
          try {
            const response = await fetch("/api/portal/manage-project", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...fields, action: project ? "update" : "create", id: project?._id, version: project?.version, archived: fields.archived === "on" }) });
            const result = await response.json();
            if (!response.ok) throw new Error(result.error || "Could not save project");
            await onSaved(result.id || project?._id);
            dialog.current?.close();
          } catch (error) { setError(error instanceof Error ? error.message : "Please try again"); }
          finally { setBusy(false); }
        }}>
          <fieldset disabled={busy}>
            <div className="portal-request-form-grid">
              <label>Client<select name="companyId" required defaultValue={project?.companyId || ""} disabled={!!project}><option value="" disabled>Choose a client</option>{organizations.filter(o => o.type === "company" && o.active).map(o => <option key={o._id} value={o._id}>{o.name}</option>)}</select></label>
              <label>Community / project<input name="name" required maxLength={200} defaultValue={project?.name} /></label>
              {select("type", "Project type", requestTypes, request?.type)}
              <label>Location<input name="location" required defaultValue={project?.location} /></label>
              <label>Operator<select name="operatorId" required defaultValue={project?.operatorId || ""}><option value="" disabled>Choose an operator</option>{organizations.filter(o => o.type === "operator" && o.active).map(o => <option key={o._id} value={o._id}>{o.name}</option>)}</select></label>
              <label>Address<input name="address" required maxLength={500} defaultValue={project?.address} /></label>
              <label>Request / scope<textarea name="requestSummary" required rows={2} maxLength={2000} defaultValue={request?.summary || project?.summary} /></label>
              <label>Request date<input name="receivedAt" type="date" required defaultValue={request?.receivedAt || today} /></label>
              <label>Quote reference<input name="quoteReference" maxLength={100} defaultValue={request?.quoteReference || project?.scopes.map(scope => scope.quote).join(", ")} /></label>
              <label>Quoted amount · internal (USD)<input name="quotedAmount" type="number" min="0" max="10000000000" step="0.01" defaultValue={request?.quotedAmount} /></label>
              {select("stage", "Current stage", requestStages, request?.stage)}
              {select("presentation", "Presentation", presentationStages, request?.presentation)}
              <label>Approval<input readOnly value={project ? approvalState(project) : "Not requested"} /><small>Managed in the Approvals tab.</small></label>
              {select("paymentDetail", "Payment", paymentStages, project ? paymentLabel(project) : "Not invoiced")}
              {select("orderDetail", "Order", orderStages, project ? orderLabel(project) : "Not ordered")}
              <label>Anticipated installation<input name="install" type="date" defaultValue={project?.install || ""} /></label>
              <label>Client contact<input name="contactName" maxLength={200} defaultValue={request?.contactName} /></label>
              <label>Contact email<input name="contactEmail" type="email" maxLength={320} defaultValue={request?.contactEmail} /></label>
              <label>SBD owner<input name="assignedTo" maxLength={200} defaultValue={request?.assignedTo} /></label>
              <label>Progress estimate %<input name="progressEstimate" type="number" min="0" max="100" defaultValue={request?.progressEstimate ?? 0} /></label>
            </div>
            <label>Project summary<textarea name="summary" rows={2} maxLength={4000} defaultValue={project?.summary} /></label>
            <label>Notes<textarea name="notes" rows={2} maxLength={2000} defaultValue={request?.notes} /></label>
            {project && <label className="portal-review-confirm"><input name="archived" type="checkbox" defaultChecked={project.archived} />Archive project (removes external access)</label>}
          </fieldset>
          <div className="portal-dialog-footer"><button type="button" className="secondary" disabled={busy} onClick={() => dialog.current?.close()}>Cancel</button><button disabled={busy}>{busy ? "Saving…" : project ? "Save changes" : "Add request"}</button></div>
        </form>
      </div>
    </dialog>
  </>;
}
