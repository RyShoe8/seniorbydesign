import { sendTransactionalEmail } from "../brevo";
import { collections } from "./db";
import { renderProjectUpdateEmail } from "./email";
import { accountOrigin } from "./origins";
import type { Project } from "./types";

/** What clients were last told about a project. Kept on the project so every way of editing it is covered. */
export interface ClientNotified { stage: string; phase: string; note: string }

export const clientView = (project: Pick<Project, "request">): ClientNotified => ({
  stage: project.request?.stage || "",
  phase: project.request?.projectPhase || "",
  note: (project.request?.clientNotes || "").trim(),
});

/** The changes a client should hear about: a new status, a new project phase, or a new note from SBD. */
export function clientChanges(prior: ClientNotified, now: ClientNotified) {
  const lines: string[] = [];
  if (now.stage && now.stage !== prior.stage) lines.push(`Status: ${now.stage}`);
  if (now.phase && now.phase !== prior.phase) lines.push(`Project phase: ${now.phase}`);
  const note = now.note && now.note !== prior.note ? now.note : "";
  return { lines, note };
}

/** Set PORTAL_CLIENT_EMAILS=off to stop client update emails without a code change. */
const emailsOn = () => (process.env.PORTAL_CLIENT_EMAILS || "").trim().toLowerCase() !== "off";

/**
 * Call after a project is saved, from anywhere. Emails the project's client contacts when its
 * status, phase or client note has changed since they were last told. The first time a project
 * is seen it only records where things stand, so linking or importing never sends a burst of email.
 * Never throws: a failed email must not undo or block the edit that led to it.
 */
export async function announceProject(projectId: string) {
  try {
    const c = await collections();
    const project = await c.projects.findOne({ _id: projectId });
    if (!project) return;
    const now = clientView(project);
    const prior = project.clientNotified;
    if (prior && prior.stage === now.stage && prior.phase === now.phase && prior.note === now.note) return;
    await c.projects.updateOne({ _id: projectId }, { $set: { clientNotified: now } });
    if (!prior || project.archived || !emailsOn()) return;
    const { lines, note } = clientChanges(prior, now);
    if (!lines.length && !note) return;
    const members = await c.memberships
      .find({ organizationId: { $in: [project.companyId, project.operatorId] }, active: true })
      .toArray();
    const recipients = [...new Set(members.map((member) => member.email.toLowerCase()))];
    const origin = accountOrigin("client");
    if (!recipients.length || !origin) return;
    const url = new URL(`/portal/projects/${encodeURIComponent(project._id)}`, origin).href;
    const email = renderProjectUpdateEmail({ project: project.name, lines, note }, url, origin);
    // One email each, so clients never see each other's addresses.
    const results = await Promise.allSettled(
      recipients.map((address) => sendTransactionalEmail([{ email: address }], email.subject, email.html, email.text)),
    );
    await c.db.collection("portalClientEmails").insertOne({
      projectId: project._id, project: project.name, lines, note, at: new Date(),
      sent: results.filter((result) => result.status === "fulfilled").length,
      failed: results.filter((result) => result.status === "rejected").length,
    });
  } catch (error) {
    console.error("Client update email failed", error);
  }
}

/** Records where every not-yet-seen project stands, so its next change is announced rather than missed. */
export async function baselineProjects(projects: Project[]) {
  const c = await collections();
  for (const project of projects) {
    if (project.clientNotified) continue;
    await c.projects.updateOne(
      { _id: project._id, clientNotified: { $exists: false } },
      { $set: { clientNotified: clientView(project) } },
    );
  }
}
