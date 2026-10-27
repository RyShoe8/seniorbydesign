"use client";
import { useState } from "react";
import type { DisplayProject } from "./PortalWorkspace";
import { displayDate, StatusBadge } from "./PortalWorkspace";
import { approvalState, projectPhase, projectWorkflow, paymentLabel, orderLabel, paymentStages, orderStages } from "@/lib/portal/requests";

type Workflow = (action: string, data?: Record<string, unknown>) => Promise<unknown> | undefined;
export function ProjectProgress({ project, showStats = true, showTimeline = true }: { project: DisplayProject; showStats?: boolean; showTimeline?: boolean }) {
  return <>
    {showStats && <dl className="portal-project-stats">
      <div><dt>Current phase</dt><dd>{projectPhase(project)}</dd></div>
      <div><dt>Approval</dt><dd>{approvalState(project)}</dd></div>
      <div><dt>Payment</dt><dd>{paymentLabel(project)}</dd></div>
      <div><dt>Anticipated install</dt><dd>{displayDate(project.install)}</dd></div>
    </dl>}
    {showTimeline && <section className="portal-workflow-panel" aria-labelledby="project-workflow-title">
      <h2 id="project-workflow-title">Workflow</h2>
      <ol className="portal-workflow-timeline">{projectWorkflow(project).map((step, index) => <li key={`${index}-${step.id}`} className={`is-${step.state}`} aria-current={step.state === "current" ? "step" : undefined}><span>{index + 1}. {step.label}</span></li>)}</ol>
      <p className="portal-muted">{project.request ? "SBD manages the current phase. Approval, payment, and order statuses are tracked separately." : "The current phase has not been recorded for this project. SBD can set it under Request & Quote."}</p>
    </section>}
  </>;
}

export function ProjectOperations({ project, section, staff, canManage, busy, workflow }: {
  project: DisplayProject; section: "payment" | "orders"; staff: boolean; canManage: boolean; busy: boolean; workflow: Workflow;
}) {
  const payment = section === "payment";
  const [field, setField] = useState(payment ? "payment" : "order");
  const [action, setAction] = useState(payment ? "report-payment" : "report-delivery");
  return <section className="portal-panel" id={section}>
    <h2>{payment ? "Payment" : "Order & Install"}</h2>
    <dl className="portal-request-summary">
      <div><dt>{payment ? "Payment status" : "Order status"}</dt><dd><StatusBadge value={payment ? paymentLabel(project) : orderLabel(project)} /></dd></div>
      <div><dt>Current phase</dt><dd>{projectPhase(project)}</dd></div>
      <div><dt>{payment ? "Approval status" : "Anticipated installation"}</dt><dd>{payment ? approvalState(project) : displayDate(project.install)}</dd></div>
      <div><dt>SBD owner</dt><dd>{project.request?.assignedTo || "Unassigned"}</dd></div>
    </dl>
    <p>{staff ? "Confirm official project statuses below. Each change is recorded in the project activity." : "Send an update for SBD to review. SBD confirms the official payment, delivery, and installation status."}</p>
    {canManage && <details><summary>{staff ? "Confirm a status update" : "Send an update to SBD"}</summary><form key={`${section}-${project.version}`} className="portal-request-form" onSubmit={e => {
      e.preventDefault(); const data = Object.fromEntries(new FormData(e.currentTarget));
      void workflow(staff ? "status" : action, { ...data, field: staff ? field : undefined });
    }}>
      {staff ? <>
        {!payment && <label>Status field<select value={field} onChange={e => setField(e.target.value)}><option value="order">Order status</option><option value="install">Anticipated installation</option></select></label>}
        <label>{field === "install" ? "Target installation date" : "Official status"}
          {field === "install" ? <input key="install" name="value" type="date" defaultValue={project.install || ""} /> : <select key={field} name="value" defaultValue={payment ? paymentLabel(project) : orderLabel(project)}>{(payment ? Array.from(new Set([paymentLabel(project), ...paymentStages])) : Array.from(new Set([orderLabel(project), ...orderStages]))).map(value => <option key={value}>{value}</option>)}</select>}
        </label>
      </> : <>
        <label>Update type<select value={action} onChange={e => setAction(e.target.value)}>{payment ? <option value="report-payment">Report payment sent</option> : <><option value="report-delivery">Report delivery received</option><option value="delivery-issue">Report delivery issue</option><option value="request-install">Request installation date</option></>}</select></label>
        {action === "request-install" && <label>Requested installation date<input name="value" type="date" required /></label>}
      </>}
      <label>Details / reason<textarea name="note" rows={3} required maxLength={2000} placeholder="Include dates, references, and relevant details." /></label>
      <button disabled={busy}>{staff ? "Confirm status update" : "Send update to SBD"}</button>
    </form></details>}
  </section>;
}
