# SEO recrawl checklist (post–SEO hardening deploy)

Use this after deploying canonical service URLs, schema fixes, and listing `ItemList` JSON-LD.

## 1. Spot-check rendered HTML (view source)

For each URL, confirm a unique `<title>`, `<meta name="description">`, `<link rel="canonical">`, and Open Graph / Twitter tags.

- Blog post: `/blog/who-we-are-and-what-we-stand-for`
- Services (canonical lowercase paths):
  - `/services/ffe-services`
  - `/services/overall-design-and-development`
  - `/services/interior-environments-and-design`
  - `/services/procurement-and-installation`

**Redirects:** Opening legacy mixed-case paths (e.g. `/services/FFE-Services`) should **308/301** to the lowercase canonical path.

## 2. Structured data

- Run Google’s [Rich Results Test](https://search.google.com/test/rich-results) on:
  - One blog post URL
  - One service detail URL
  - `/blog` and `/services` (ItemList + breadcrumbs)
- Confirm no `SearchAction` on `WebSite` unless `/blog` implements the same search query contract.

## 3. Search Console

- Submit / resubmit `https://seniorbydesign.com/sitemap.xml`
- Use **URL Inspection** → **Request indexing** for the blog post and the four service URLs (canonical form)
- Monitor **Pages** / **Sitemaps** for duplicate URLs on `/services/*` (should trend down after recrawl)

## 4. Internal links

- From `/services`, “Learn More” should point at lowercase service paths only.
- Blog post should show **More from the Journal** with valid internal links.

## 5. Environment

- Confirm production `NEXT_PUBLIC_SITE_URL` is `https://seniorbydesign.com` so canonicals and JSON-LD `@id` values match the live host.

## 6. GEO / AI citation (on-site)

- Homepage and firm page HTML include **Reid Bonner** and **Senior By Design** in early body copy.
- Footer, contact, and firm page show the same address and phone: 5015 Catron Dr, Dallas, TX 75220 · (833) 773-3744.
- Blog posts include an **About Senior By Design** box at the bottom.
- Service detail pages lead with a direct-answer entity paragraph (`#service-entity-lead`).
- Off-site actions for marketing: see [GEO_OFFSITE_RECOMMENDATIONS.md](GEO_OFFSITE_RECOMMENDATIONS.md).
