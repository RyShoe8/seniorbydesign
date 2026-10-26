# V2 deployment

Public design and builder-driven brochure are isolated under /v2 and /v2/experience. Existing public pages/components remain at their original routes. The brochure uses the same designGuideContent collection and admin builder, including all text/image fields, ordering, contact data, and existing-content switches. Both hero CTA labels and destinations follow the builder. Admin preview opens /v2/experience.

/v2 (including descendants), /portal, and /account return X-Robots-Tag: noindex, nofollow, noarchive. V2 pages also emit noindex metadata; robots.txt excludes these paths. V2 is absent from the sitemap. This is indexing control, not access control. Portal authentication still applies at /portal.

Until the clients subdomain is available, invitation origins fall back to the configured NEXTAUTH_URL if the specific SBD origin variables are absent. Set SBD_PORTAL_ORIGIN when the clients subdomain is ready. Existing MongoDB/Brevo configuration remains in use.

Validation: optimized production build, TypeScript, portal policy tests, and HTTP checks of legacy/V2 headers, metadata and navigation. Browser rendering verification was unavailable because local browser access is disabled. The existing portal setup script supports a read-only audit followed by --apply for indexes/account normalization; production execution requires the production environment and has not been performed locally.
