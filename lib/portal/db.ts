import { getDb } from "../db";
import getClientPromise from "../mongodb";
import type { ClientSession } from "mongodb";
import type { Organization, Membership, Project, WorkflowEvent } from "./types";

export async function collections() {
  const db = await getDb();
  return {
    db,
    organizations: db.collection<Organization>("portalOrganizations"),
    memberships: db.collection<Membership>("portalMemberships"),
    projects: db.collection<Project>("portalProjects"),
    events: db.collection<WorkflowEvent>("portalWorkflowEvents"),
  };
}
export async function transaction<T>(
  fn: (session: ClientSession) => Promise<T>,
): Promise<T> {
  const session = (await getClientPromise()).startSession();
  try {
    return (await session.withTransaction(() => fn(session))) as T;
  } finally {
    await session.endSession();
  }
}
