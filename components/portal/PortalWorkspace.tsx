"use client";
import Link from "next/link";
import { projectAction, projectInstall, orderStatusText, paymentStatusText } from "@/lib/portal/requests";
import { ProjectSteps, QuickFind, WaitingBadge, WorkQueue } from "./ProjectWork";
import Image from "next/image";
import { useEffect, useRef, useState, type ReactNode } from "react";
import type { Project, Organization, SheetQuoteRow } from "@/lib/portal/types";

export type DisplayProject = Omit<Project, "documents" | "smartsheet" | "sheetQuoteRows"> & {
  documents: Omit<Project["documents"][number], "url">[];
  smartsheetDetails?: Record<string, string>;
  /** Clients receive these without `rowId` and `details`. */
  sheetQuoteRows?: (Pick<SheetQuoteRow, "quote" | "name" | "install" | "projectPhase"> & Partial<Pick<SheetQuoteRow, "rowId" | "details">>)[];
};
export function PortalIcon({
  name,
  size = 20,
}: {
  name: string;
  size?: number;
}) {
  const paths: Record<string, ReactNode> = {
    overview: (
      <>
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
      </>
    ),
    projects: (
      <>
        <path d="M3 21V7l9-4 9 4v14M8 21v-5h8v5M7 9h2m6 0h2M7 12h2m6 0h2M1 21h22" />
      </>
    ),
    approvals: (
      <>
        <rect x="5" y="3" width="14" height="18" rx="2" />
        <path d="m8 12 3 3 5-6M9 3V1m6 2V1" />
      </>
    ),
    orders: (
      <>
        <rect x="3" y="5" width="18" height="16" rx="2" />
        <path d="M3 10h18M8 2v6m8-6v6m-9 7h3m4 0h3" />
      </>
    ),
    documents: (
      <>
        <path d="M14 2H5v20h14V7zM14 2v5h5M8 12h8m-8 4h8" />
      </>
    ),
    members: (
      <>
        <circle cx="9" cy="8" r="3" />
        <path d="M2 21v-3a7 7 0 0 1 14 0v3M16 5a3 3 0 0 1 0 6m2 3a6 6 0 0 1 4 6" />
      </>
    ),
    organizations: (
      <>
        <rect x="3" y="5" width="18" height="16" rx="1" />
        <path d="M8 5V2h8v3M7 10h2m6 0h2M7 14h2m6 0h2m-6 7v-4h2v4" />
      </>
    ),
    imports: (
      <>
        <path d="M12 16V3m-5 5 5-5 5 5M3 15v6h18v-6" />
      </>
    ),
    arrow: <path d="M4 12h16m-6-6 6 6-6 6" />,
    search: (
      <>
        <circle cx="10" cy="10" r="6" />
        <path d="m15 15 6 6" />
      </>
    ),
    check: <path d="m5 12 4 4L20 5" />,
    pin: (
      <>
        <path d="M19 9c0 6-7 12-7 12S5 15 5 9a7 7 0 1 1 14 0Z" />
        <circle cx="12" cy="9" r="2" />
      </>
    ),
    logout: (
      <>
        <path d="M9 3H3v18h6m4-9h9m-4-4 4 4-4 4" />
      </>
    ),
    menu: <path d="M3 6h18M3 12h18M3 18h18" />,
    home: <path d="m3 11 9-8 9 8M5 9.5V21h14V9.5M10 21v-6h4v6" />,
    portfolio: (<><rect x="3" y="3" width="18" height="18" rx="1" /><path d="m3 17 5-5 4 4 3-3 6 6M15 8h.01" /></>),
    services: <path d="m12 3 9 9-9 9-9-9zM8 12h8" />,
    team: (<><circle cx="12" cy="8" r="4" /><path d="M4 21v-1a8 8 0 0 1 16 0v1" /></>),
    journal: <path d="M5 3h14v18H5zM9 8h6M9 12h6M9 16h4" />,
    link: <path d="M10 14a4 4 0 0 0 6 0l3-3a4 4 0 0 0-6-6l-1 1m2 4a4 4 0 0 0-6 0l-3 3a4 4 0 0 0 6 6l1-1" />,
    brochure: <path d="M12 6c-2-2-5-3-9-3v16c4 0 7 1 9 3 2-2 5-3 9-3V3c-4 0-7 1-9 3Zm0 0v16" />,
    mail: (<><rect x="3" y="5" width="18" height="14" rx="1" /><path d="m3 7 9 7 9-7" /></>),
    media: <path d="M3 6h6l2 3h10v11H3z" />,
    pen: <path d="M4 20l1-5L16 4l4 4L9 19zM14 6l4 4" />,
    gear: (<><circle cx="12" cy="12" r="3" /><path d="M12 2v4m0 12v4M2 12h4m12 0h4M5 5l3 3m8 8 3 3M5 19l3-3m8-8 3-3" /></>),
    sync: <path d="M4 10a8 8 0 0 1 14-4l2 2m0-5v5h-5M20 14a8 8 0 0 1-14 4l-2-2m0 5v-5h5" />,
  };
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[name] || paths.projects}
    </svg>
  );
}
export function displayDate(value: string | null) {
  return value
    ? new Date(`${value}T12:00:00`).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "To be scheduled";
}
export function StatusBadge({ value }: { value: string }) {
  const tone = ["Approved", "Paid", "Delivered"].includes(value)
    ? "complete"
    : value === "Ordered"
      ? "progress"
      : "pending";
  return (
    <span className={`portal-status ${tone}`}>
      <i />
      {value}
    </span>
  );
}
export function PortalShell({
  children,
  tab,
  title,
  email,
  organization,
  navigation,
  navigate,
  signOut,
  staff,
  projects = [],
  name = (id: string) => id,
  badges = {},
}: {
  /** For the find box. */
  projects?: DisplayProject[];
  name?: (id: string) => string;
  /** Counts of waiting work, by navigation key. */
  badges?: Record<string, number>;
  children: ReactNode;
  tab: string;
  title: string;
  email: string;
  organization: string;
  navigation: string[][];
  navigate: (tab: string) => void;
  signOut: () => void;
  staff: boolean;
}) {
  const [menu, setMenu] = useState(false);
  const menuButton = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!menu) return;
    const dismiss = (event: KeyboardEvent) => {
      if (event.key === "Escape") { setMenu(false); menuButton.current?.focus(); }
    };
    document.addEventListener("keydown", dismiss);
    return () => document.removeEventListener("keydown", dismiss);
  }, [menu]);
  useEffect(() => { setMenu(false); }, [tab, title]);
  return (
    <div className="portal-app portal-workspace">
      <a className="workspace-skip" href="#portal-content">Skip to content</a>
      {menu && <button className="portal-menu-backdrop" aria-label="Close navigation" onClick={() => setMenu(false)} />}
      <aside id="portal-navigation" className={`portal-sidebar ${menu ? "is-open" : ""}`}>
        <button
          className="portal-brand"
          onClick={() => navigate("overview")}
          aria-label="Senior By Design overview"
        >
          <Image
            src="/images/sbd-logo-no-tagline.png"
            alt="Senior By Design"
            width={86}
            height={86}
          />
          <span>SOUL WARMING INTERIORS</span>
        </button>
        <div className="portal-workspace-label">{staff ? "PROJECT WORKSPACE" : "YOUR PROJECTS"}</div>
        <nav aria-label="Portal navigation">
          {navigation.map(([key, label]) => (
            <Link
              href={`/portal/${key}`}
              key={key}
              className={`portal-nav-item ${tab === key ? "active" : ""}`}
              aria-current={tab === key ? "page" : undefined}
              onClick={() => {
                setMenu(false);
              }}
            >
              <PortalIcon name={key === "requests" ? "approvals" : key === "remodels" ? "projects" : key === "contacts" ? "members" : key === "smartsheet" ? "sync" : key} />
              <span>{label}</span>
              {badges[key] > 0 && <span className="portal-nav-badge"><span className="portal-sr-only">, waiting: </span>{badges[key]}</span>}
            </Link>
          ))}
        </nav>
        <div className="portal-sidebar-bottom">
          <div className="portal-concierge">
            <span className="portal-eyebrow">THOUGHTFULLY CONNECTED</span>
            <p>
              Every detail.
              <br />
              All in one place.
            </p>
            <span>Your partnership with SBD.</span>
          </div>
          {staff && (
            <a href="/admin" className="portal-website-link">
              Website administration <PortalIcon name="arrow" size={15} />
            </a>
          )}
          <button className="portal-signout" onClick={signOut}>
            <PortalIcon name="logout" size={17} />
            Sign out
          </button>
        </div>
      </aside>
      <div className="portal-main-shell">
        <header className="portal-topbar">
          <div className="portal-breadcrumb">
            <button
              ref={menuButton}
              className="portal-mobile-menu"
              aria-controls="portal-navigation"
              onClick={() => setMenu(!menu)}
              aria-label="Toggle navigation"
              aria-expanded={menu}
            >
              <PortalIcon name="menu" />
            </button>
            <span>{staff ? "Workspace" : "Client portal"}</span>
            <span className="portal-breadcrumb-divider">/</span>
            <strong>{title}</strong>
          </div>
          <QuickFind projects={projects} name={name} />
          <div className="portal-identity">
            <div>
              <strong>{organization}</strong>
              <span>{email}</span>
            </div>
            <details className="portal-account-menu">
              <summary className="portal-avatar" aria-label="Account menu">
                {(organization || email || "SBD")
                  .split(/[ @]/)
                  .filter(Boolean)
                  .slice(0, 2)
                  .map((w) => w[0])
                  .join("")
                  .toUpperCase()}
              </summary>
              <div className="portal-account-menu-list">
                <span>{email}</span>
                <a href="/account/change">Account settings</a>
                <button type="button" onClick={signOut}>Sign out</button>
              </div>
            </details>
          </div>
        </header>
        <main id="portal-content" className="portal-content">
          {children}
          <footer className="portal-footer">
            <span>SENIOR BY DESIGN</span>
            <span>Thoughtful spaces. Lasting partnerships.</span>
          </footer>
        </main>
      </div>
    </div>
  );
}

export function PortalPortfolio({
  staff,
  view,
  projects,
  organizations,
  search,
  setSearch,
  org,
  setOrg,
  name,
  open,
  navigate,
}: {
  staff: boolean;
  view: string;
  projects: DisplayProject[];
  organizations: Organization[];
  search: string;
  setSearch: (s: string) => void;
  org: string;
  setOrg: (s: string) => void;
  name: (id: string) => string;
  open: (id: string) => void;
  navigate: (s: string) => void;
}) {
  const [filter, setFilter] = useState("all");
  const scopeProjects = projects.filter(
    (p) =>
      (!p.archived ||
        (staff && view === "projects" && filter === "archived")) &&
      (!org || [p.companyId, p.operatorId].includes(org)),
  );
  const scheduled = scopeProjects
    .map((p) => ({ project: p, install: projectInstall(p) }))
    .filter(({ install }) => install && install >= new Date().toLocaleDateString("en-CA"))
    .sort((a, b) => a.install!.localeCompare(b.install!));
  const filtered = scopeProjects.filter(
    (p) =>
      `${p.name} ${p.location} ${p.scopes.map((s) => s.quote).join(" ")}`
        .toLowerCase()
        .includes(search.toLowerCase()) &&
      (filter === "all" ||
        (filter === "archived"
          ? p.archived
          : filter === "approval"
            ? p.scopes.some((s) => s.approval === "Needs Approval")
            : p.order === filter)),
  );
  const overview = view === "overview";
  const headings: Record<string, [string, string]> = {
    overview: [
      staff ? "What needs attention" : `Welcome, ${org ? name(org) : organizations.find(o => o.type === "company")?.name || "your workspace"}`,
      staff ? "Who is holding each project, and the next move." : "What we need from you, and where everything stands.",
    ],
    projects: [
      "Your projects",
      "From the first selections to the finishing touches.",
    ],
    approvals: [
      "Requests & Quotes",
      "Review your current quotes and keep each project moving forward.",
    ],
    orders: [
      "Orders & installations",
      "A clear view of what is on its way and what comes next.",
    ],
    documents: [
      "Your document library",
      "Current documents and earlier revisions, organized by project.",
    ],
  };
  const [title, description] = headings[view] || headings.projects;
  return (
    <>
      <div className="portal-page-heading">
        <div>
          <span className="portal-eyebrow">
            {overview ? (staff ? "TODAY" : "YOUR PROJECTS") : "PROJECT WORKSPACE"}
          </span>
          <h1>{title}</h1>
          <p>{description}</p>
        </div>
        {staff && organizations.length > 1 && <label className="portal-org-filter">
          <span>Viewing</span>
          <select
            aria-label="Filter by organization"
            value={org}
            onChange={(e) => setOrg(e.target.value)}
          >
            <option value="">All organizations</option>
            {organizations.map((o) => (
              <option key={o._id} value={o._id}>
                {o.name}
              </option>
            ))}
          </select>
          <small role="status">{org ? `${name(org)} · ${scopeProjects.length} projects` : `All organizations · ${scopeProjects.length} projects`}</small>
        </label>}
      </div>
      {overview && <WorkQueue projects={scopeProjects} staff={staff} name={name} organizationId={org} />}
      {overview && (
        <section className="portal-section-card portal-upcoming">
          <h2>Upcoming installations <span className="portal-count">{scheduled.length}</span></h2>
          {scheduled.length ? (
            <div className="portal-upcoming-list">
              {scheduled.slice(0, 4).map(({ project: p, install }) => (
                <button className="portal-install-row" key={p._id} onClick={() => open(p._id)}>
                  <span className="portal-date-tile">
                    <span>{new Date(install + "T12:00:00").toLocaleDateString("en-US", { month: "short" })}</span>
                    <strong>{install!.slice(8)}</strong>
                  </span>
                  <span className="portal-row-main">
                    <strong>{p.name}</strong>
                    <span>{p.location} · Estimated</span>
                  </span>
                </button>
              ))}
            </div>
          ) : (
            <p className="portal-empty-copy">Installation dates will appear here as they are scheduled.</p>
          )}
        </section>
      )}
      {(overview || view === "projects") && (
        <section className="portal-project-section">
          <div className="portal-section-title">
            <div>
              <h2>
                {overview ? "Your projects" : "Project portfolio"}{" "}
                <span className="portal-count">{filtered.length}</span>
              </h2>
            </div>
            {overview && (
              <button
                className="portal-text-button"
                onClick={() => navigate("projects")}
              >
                All projects <PortalIcon name="arrow" size={16} />
              </button>
            )}
          </div>
          {!overview && (
            <div className="portal-filter-bar">
              <label className="portal-search">
                <PortalIcon name="search" size={18} />
                <input
                  aria-label="Search projects"
                  placeholder="Search project, location, or quote…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </label>
              <select
                aria-label="Filter project status"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
              >
                <option value="all">All statuses</option>
                <option value="approval">Needs approval</option>
                <option value="Ordered">Ordered</option>
                <option value="Delivered">Delivered</option>
                {staff && <option value="archived">Archived</option>}
              </select>
            </div>
          )}
          <div className="portal-project-grid">
            {filtered.slice(0, overview ? 6 : filtered.length).map((p, i) => (
              <article className="portal-project-card" key={p._id}>
                <div className="portal-project-card-top">
                  <p className="portal-property-owner">{name(p.companyId)}</p>
                  {p.archived ? <StatusBadge value="Archived" /> : <WaitingBadge project={p} staff={staff} />}
                </div>
                <h3>{p.name}</h3>
                <p className="portal-property-location">
                  <PortalIcon name="pin" size={14} />
                  {p.location}
                </p>
                <ProjectSteps project={p} />
                <p className="portal-card-next-step">{projectAction(p, staff).label}</p>
                <p className="portal-card-install">Install: {displayDate(projectInstall(p))}</p>
                <Link
                  className="portal-project-open"
                  href={`/portal/projects/${encodeURIComponent(p._id)}?from=overview${org ? `&organization=${encodeURIComponent(org)}` : ""}`}
                >
                  View project <PortalIcon name="arrow" size={18} />
                </Link>
              </article>
            ))}
          </div>
          {!filtered.length && (
            <div className="portal-calm-state">
              <h3>No matching projects</h3>
              <p>Try a different search or organization.</p>
            </div>
          )}
        </section>
      )}
      {view === "orders" && (
        <section className="portal-section-card portal-scroll">
          <table className="portal-table">
            <thead>
              <tr>
                <th>Project</th>
                <th>Payment</th>
                <th>Order status</th>
                <th>Estimated install</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {scopeProjects.map((p) => (
                <tr key={p._id}>
                  <td>
                    <strong>{p.name}</strong>
                    <small>{p.location}</small>
                  </td>
                  <td>
                    <StatusBadge value={paymentStatusText(p)} />
                  </td>
                  <td>
                    <StatusBadge value={orderStatusText(p)} />
                  </td>
                  <td>{displayDate(p.install)}</td>
                  <td>
                    <button
                      className="portal-text-button"
                      onClick={() => open(p._id)}
                      aria-label={`Open ${p.name}`}
                    >
                      <PortalIcon name="arrow" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}
      {view === "documents" && (
        <>
          <label className="portal-search portal-library-search">
            <PortalIcon name="search" />
            <input
              aria-label="Search documents"
              placeholder="Search document or project name…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </label>
          {scopeProjects.map((p) => {
            const docs = p.documents.filter((d) =>
              `${d.name} ${p.name}`
                .toLowerCase()
                .includes(search.toLowerCase()),
            );
            return docs.length ? (
              <section className="portal-section-card" key={p._id}>
                <div className="portal-section-title">
                  <div>
                    <span className="portal-eyebrow">{p.location}</span>
                    <h2>{p.name}</h2>
                  </div>
                  <button
                    className="portal-text-button"
                    onClick={() => open(p._id)}
                  >
                    Project details <PortalIcon name="arrow" size={16} />
                  </button>
                </div>
                {docs
                  .filter((d) => !d.historical)
                  .map((d) => (
                    <a
                      className="portal-library-row"
                      key={d.id}
                      href={`/api/portal/documents?project=${p._id}&document=${d.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <span className="portal-file-icon">
                        <PortalIcon name="documents" />
                      </span>
                      <span className="portal-row-main">
                        <strong>{d.name}</strong>
                        <span>{d.category} · Current version</span>
                      </span>
                      <PortalIcon name="arrow" size={17} />
                    </a>
                  ))}
                {docs.some((d) => d.historical) && (
                  <details className="portal-revisions">
                    <summary>
                      Earlier revisions (
                      {docs.filter((d) => d.historical).length})
                    </summary>
                    {docs
                      .filter((d) => d.historical)
                      .map((d) => (
                        <a
                          className="portal-library-row"
                          key={d.id}
                          href={`/api/portal/documents?project=${p._id}&document=${d.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <PortalIcon name="documents" />
                          <span>{d.name}</span>
                          <PortalIcon name="arrow" size={17} />
                        </a>
                      ))}
                  </details>
                )}
              </section>
            ) : null;
          })}
          <p className="portal-muted">
            Documents open securely in SharePoint. Your Microsoft access
            permissions apply.
          </p>
        </>
      )}
    </>
  );
}
