import { createHash } from "crypto";
import type {
  Actor,
  ImportProject,
  Project,
  Scope,
  PortalDocument,
} from "./types";

export class PortalError extends Error {
  constructor(
    message: string,
    public status = 400,
  ) {
    super(message);
  }
}
export const emailKey = (value: string) => value.trim().toLowerCase();
export const adminEmails = [
  "ryanschumacher@themediashop.co",
  "glenn@sbdid.com",
];
export function staffRole(user: { role?: string; email: string; adminGranted?: boolean }) {
  if (user.role === "admin" && (user.adminGranted === true || adminEmails.includes(emailKey(user.email))))
    return "admin";
  return ["admin", "user", "team"].includes(user.role || "")
    ? "team"
    : undefined;
}
export const isStaff = (actor: Pick<Actor, "role">) =>
  actor.role === "admin" || actor.role === "team";
export const hash = (value: string) =>
  createHash("sha256").update(value).digest("hex");
export function text(
  value: unknown,
  path: string,
  max = 300,
  optional = false,
): string {
  if (optional && (value === undefined || value === null)) return "";
  if (
    typeof value !== "string" ||
    value.length > max ||
    (!optional && !value.trim())
  )
    throw new PortalError(
      `${path}: enter text${optional ? "" : " (required)"} within ${max} characters`,
    );
  return value.trim();
}
export function slug(value: unknown, path: string) {
  const v = text(value, path, 100);
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(v))
    throw new PortalError(`${path}: use a lowercase slug`);
  return v;
}
export function makeSlug(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
export function documentUrl(value: unknown): string {
  const v = text(value, "Document URL", 4096);
  try {
    const u = new URL(v);
    if (
      u.protocol === "https:" &&
      u.hostname === "seniorbydesign.sharepoint.com" &&
      !u.username &&
      !u.password &&
      !u.port
    )
      return u.href;
  } catch {}
  throw new PortalError(
    "Document URL must be an HTTPS link on seniorbydesign.sharepoint.com",
  );
}
export function dateOnly(value: unknown): string | null {
  if (value === "" || value === null || value === undefined) return null;
  const v = text(value, "Install date", 10);
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(v);
  const iso = m ? `${m[3]}-${m[1]}-${m[2]}` : v;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso))
    throw new PortalError("Install date: use MM/DD/YYYY");
  const d = new Date(`${iso}T12:00:00Z`);
  if (isNaN(d.getTime()) || d.toISOString().slice(0, 10) !== iso)
    throw new PortalError("Install date is not a real calendar date");
  return iso;
}
export function enumValue<T extends string>(
  v: unknown,
  allowed: readonly T[],
  path: string,
): T {
  const match =
    typeof v === "string" &&
    allowed.find((x) => x.toLowerCase() === v.trim().toLowerCase());
  if (!match) throw new PortalError(`${path}: expected ${allowed.join(", ")}`);
  return match;
}
export const payments = [
  "Awaiting Confirmation",
  "Awaiting Payment",
  "Paid",
] as const;
export const orders = [
  "Awaiting Confirmation",
  "Ordered",
  "Delivered",
] as const;
function record(v: unknown, path: string): Record<string, unknown> {
  if (!v || typeof v !== "object" || Array.isArray(v))
    throw new PortalError(`${path}: expected an object`);
  return v as Record<string, unknown>;
}
function array(v: unknown, path: string, max: number): unknown[] {
  if (!Array.isArray(v) || v.length > max)
    throw new PortalError(
      `${path}: expected an array with at most ${max} entries`,
    );
  return v;
}
export function parseImport(input: unknown): {
  projects: ImportProject[];
  warnings: string[];
} {
  const rows: {
    raw: Record<string, unknown>;
    companyId: unknown;
    companyName: unknown;
  }[] = [];
  const original = Array.isArray(input);
  if (original)
    for (const v of array(input, "Projects", 500)) {
      const r = record(v, "Project");
      rows.push({ raw: r, companyId: r.companyId, companyName: r.companyName });
    }
  else {
    const root = record(input, "File");
    if (root.schemaVersion !== 1)
      throw new PortalError(
        "Unsupported schemaVersion; expected 1 or the original project array",
      );
    for (const v of array(root.companies, "Companies", 100)) {
      const c = record(v, "Company");
      for (const r of array(c.projects, "Company projects", 500))
        rows.push({
          raw: record(r, "Project"),
          companyId: c.companyid,
          companyName: c.companyname,
        });
    }
  }
  if (!rows.length || rows.length > 500)
    throw new PortalError("Upload between 1 and 500 projects");
  const seen = new Set<string>(),
    quotes = new Set<string>(),
    companies = new Map<string, string>(),
    operators = new Map<string, string>();
  const projects = rows.map(
    ({ raw: r, companyId, companyName }, i): ImportProject => {
      const path = `Project ${i + 1}`;
      const cid = slug(companyId, `${path} company ID`),
        cn = text(companyName, `${path} company name`);
      if (companies.has(cid) && companies.get(cid) !== cn)
        throw new PortalError(`${path}: company ID has conflicting names`);
      companies.set(cid, cn);
      const sourceId = text(
        original ? r._id : r.id,
        `${path} permanent ID`,
        150,
      );
      const key = `${cid}/${sourceId}`;
      if (seen.has(key)) throw new PortalError(`${path}: duplicate project ID`);
      seen.add(key);
      const op =
        typeof r.operator === "string"
          ? { operatorid: makeSlug(r.operator), operatorname: r.operator }
          : record(r.operator, `${path} operator`);
      const oid = slug(op.operatorid, `${path} operator ID`),
        on = text(op.operatorname, `${path} operator name`);
      if (operators.has(oid) && operators.get(oid) !== on)
        throw new PortalError(`${path}: operator slug has conflicting names`);
      operators.set(oid, on);
      const codes = new Set<string>();
      const scopes = array(r.scopes, `${path} scopes`, 30).map((v): Scope => {
        const s = record(v, "Scope");
        const code = enumValue(
          s.code,
          ["MC", "AL", "IL"] as const,
          "Scope code",
        );
        const label = {
          MC: "Memory Care",
          AL: "Assisted Living",
          IL: "Independent Living",
        }[code];
        if (s.label !== label)
          throw new PortalError(`${path}: ${code} label must be ${label}`);
        if (codes.has(code))
          throw new PortalError(`${path}: duplicate scope code`);
        codes.add(code);
        const quote = text(s.quote, "Quote ID", 100);
        if (quotes.has(quote))
          throw new PortalError(`${path}: duplicate quote ${quote}`);
        quotes.add(quote);
        return {
          code,
          label,
          quote,
          approval: enumValue(
            s.approval,
            ["Approved", "Needs Approval"] as const,
            "Approval",
          ),
          revision: 1,
        };
      });
      if (!scopes.length)
        throw new PortalError(`${path}: at least one scope is required`);
      const urls = new Set<string>();
      const documents = array(r.documents, `${path} documents`, 300).map(
        (v): PortalDocument => {
          const d = record(v, "Document"),
            url = documentUrl(d.url);
          if (urls.has(url))
            throw new PortalError(`${path}: duplicate document URL`);
          urls.add(url);
          if (d.historical !== undefined && typeof d.historical !== "boolean")
            throw new PortalError("historical must be true or false");
          return {
            id: hash(url).slice(0, 32),
            name: text(d.name, "Document filename", 500),
            url,
            category: enumValue(
              d.category,
              ["Quotes", "Contracts", "Presentations"] as const,
              "Document category",
            ),
            historical: d.historical === true,
          };
        },
      );
      return {
        sourceId,
        companyId: `company:${cid}`,
        companyName: cn,
        operatorId: `operator:${oid}`,
        operatorName: on,
        name: text(r.name, `${path} name`),
        location: text(r.location, "Location"),
        address: text(r.address, "Address", 500),
        summary: text(r.summary, "Summary", 4000, true),
        scopes,
        documents,
        payment: enumValue(r.payment, payments, "Payment"),
        order: enumValue(r.order, orders, "Order"),
        install: dateOnly(r.install),
      };
    },
  );
  return {
    projects,
    warnings: original
      ? [
          "Original format converted. Visibility and areas fields are ignored. Company/operator assignments determine access.",
          "Quote document associations must be confirmed before portal approval is enabled.",
        ]
      : [
          "Quote document associations must be confirmed before portal approval is enabled.",
        ],
  };
}
export function canRead(actor: Actor, project: Project) {
  return (
    isStaff(actor) ||
    (!project.archived &&
      actor.memberships.some(
        (m) =>
          m.active &&
          [project.companyId, project.operatorId].includes(m.organizationId),
      ))
  );
}
export function actionMembership(
  actor: Actor,
  project: Project,
  approve = false,
) {
  return actor.memberships.find(
    (m) =>
      m.active &&
      m.role === "admin" &&
      (m.organizationId === project.companyId ||
        (m.organizationId === project.operatorId &&
          (!approve || project.operatorApproval))),
  );
}
