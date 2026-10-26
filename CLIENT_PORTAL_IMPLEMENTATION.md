# Client portal implementation and verification

This implementation is new code; the supplied patch was not applied. The original SBD JSON is accepted through `/admin/portal` → JSON imports. Client entry is `/portal`; shared account entry is `/account/login`. Account invitations and resets use `/account/accept` with a token in the URL fragment, removed from browser history on load.

## Environment and deployment

Use a separate preview database/cluster and controlled inboxes. The current database helper uses the database name `seniorbydesign`, so isolate preview through a separate MongoDB URI/cluster, not an unimplemented database-name variable. Transactions require a replica set or MongoDB Atlas; standalone MongoDB is unsupported and must not be used for commits or account acceptance.

Required settings: `MONGODB_URI`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, `SBD_ADMIN_ORIGIN`, `SBD_PORTAL_ORIGIN`, `BREVO_API_KEY`, and the existing Brevo sender settings. For production, the origins are `https://seniorbydesign.com` and `https://clients.seniorbydesign.com`.

Use two deployments of this codebase with the same production database and identity data, but canonical `NEXTAUTH_URL` per host and host-only cookies. This avoids relying on one NextAuth 4 canonical URL for two origins. Staff access stays on the main site; the client host redirects `/` to `/portal`. Local preview can use one localhost origin for both settings. Configure DNS/TLS on Vercel before live use. No deployment or DNS change has been performed.

Run `node --env-file=.env.local scripts/portal-setup.cjs` for a read-only account collision check. Back up the intended database before the deliberate `--apply` migration. Apply normalizes emails, changes legacy staff roles to Team except the two designated Administrators, invalidates sessions, and creates indexes. It does not reset passwords. Any accounts affected by the removed historical seed password need password rotation before production use. No migration has been run during development.

## Implemented paths

- Staff-only live database permission checks across existing CMS APIs; public seeding disabled.
- Shared email/password sign-in, invite verification/password setup, reset, change password, session revocation, rate limiting.
- Staff invitation management; company/operator creation, external invitations, member/admin roles, last-admin protection.
- Original-array and company-envelope JSON parsing, preview, atomic commit, stable matching, history preservation, workflow-state protection.
- Project views, SharePoint-authorized redirects, earlier revisions, quote approval/revision association, change requests, payment/delivery reports, staff status updates, operator approval grants, activity history.
- SBD-branded responsive account and portal screens.

## Verification and remaining release checks

Run `npm run test:portal`, `npx tsc --noEmit`, and `npm run build`. Policy tests cover original-format conversion, cross-company operator visibility, client isolation, approval authority, malformed data, dates, and document origins. The supplied private JSON was parsed directly from Downloads; it has not been copied into source control or written to a database.

An ephemeral local MongoDB replica set was used for signed-in HTTP integration tests: imports, tenant isolation, role restrictions, revision-bound approval, report/status separation, reimport preservation, last-admin checks, account revocation, invitations, reset expiry/replay, and concurrent invitation acceptance passed. No real database or email provider was used.

To repeat: install `mongodb-memory-server` in a temporary prefix (`sbd-portal-test-tools` under the OS temp directory), or expose its node_modules path as `SBD_TEST_MODULES`, then run `npm run test:portal:integration`. The runner starts and removes its own ephemeral replica set on port 27187 and dev server on 3100. Those ports must be unused. Do not run alongside a production build because Next shares its build directory.

Actual email delivery, Microsoft guest document access, and configured-domain callbacks still require the intended isolated preview environment. The sign-in screen was visually inspected and login/reset routes returned successful HTTP responses; authenticated layouts still need browser review with preview test users.

Notification delivery: configure `PORTAL_NOTIFICATION_SECRET` and comma-separated `PORTAL_NOTIFICATION_EMAILS`, then schedule GET `/api/portal/notifications` with the bearer secret. Pending/failed jobs appear for staff and failed jobs can be retried after checking provider delivery logs. A crashed sending job requires staff/provider reconciliation to avoid duplicate email. No scheduler or actual email delivery has been configured during development.

Import history includes guarded rollback; unchanged reimports preserve project versions. Project details, operator assignment, and archive state can be edited. The upload review includes editable company name/slug, operator name, project name, and payment fields, without modifying the original file; source JSON remains available for less common corrections. Organization names can be edited by SBD staff. Quote approval requires SBD to attest a stable revision link, which must be validated with the actual SharePoint document process. Imported source `Approved` is not evidence of a portal user approval.

SharePoint file copying/private hosting remains V2. Portal actions do not charge cards, place orders, or provide an electronic-signature service.

## Development verification result

The 11 policy tests and 17 isolated integration checkpoints passed. TypeScript validation passed. Production compilation, lint/type validation, and static-page generation passed; existing SEO build code logs the absent local MongoDB URI while building its public sitemap. Existing deployed MongoDB/Brevo configuration was left unchanged. No source data, credentials, real invitations, production migrations, or deployment were performed.
