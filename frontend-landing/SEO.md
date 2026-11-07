# SEO: rendering and verification

The landing site prerenders its actual React application. Avoid adding a second
HTML-only description or a second metadata/JSON-LD effect inside a page.

The prerenderer waits for lazy boundaries before serializing the tree with
`renderToString`. React 18's Node stream can insert zero padding at UTF-8 buffer
boundaries; the output verification rejects NUL bytes. Regulatory dates use
shared month names because Kazakh ICU support differs between Node and browsers.
Always specify a locale for rendered numbers: Node on Linux and browsers can have
different system defaults. The prerenderer wraps the React root in Cloudflare's
`email_off` exclusion comments so email obfuscation cannot replace hydrated
contact text or mailto links. This does not change account-wide Cloudflare settings.

## Shared sources

- `src/data/pageMetadata.ts`: metadata for the ten static page templates, RU/KZ/EN.
- `src/utils/pageSeo.ts`: dynamic metadata, canonical, hreflang and current-page schemas.
- `src/utils/seoPaths.ts`: preferred paths; `/kz` is the URL prefix, `kk` the language code.
- `src/context/PublicPricingContext.tsx`: one tariff snapshot for the application.
- `src/data/publicPricing.ts`: validation and the verified public fallback.
- `src/data/categoriesData.ts`: the owner's category content, banners and complete timelines.
- `src/data/categoryStageTranslations.ts`: timeline translations preserving the original dates.
- `src/data/regulatoryRequirements.ts`: exact TAÑBA category URLs and supporting official sources.
- `src/data/articleRevisions.ts`: reviewed article changes and translated case content.
- `src/data/homeFaq.ts`: the same FAQ data for visible content and structured data.

The build reads the unauthenticated public `/api/tariffs` endpoint and embeds a
sanitized numeric snapshot. It never updates tariffs or creates an order. The
browser can refresh the same public resource, explicitly allowed in robots.txt.
If the default endpoint cannot be reached, the build logs a warning and uses the
shared fallback. An explicitly configured `TANBOX_PUBLIC_PRICING_URL` is strict:
an invalid/unavailable response fails the build.

When tariffs change, rebuild the landing site so initial HTML also contains the
new rates. Do not put independent prices into `index.html` or schema strings.
Keep fallback rates synchronized with the public tariff configuration.

## Build and checks

```sh
npm ci
npm run test:seo
```

`test:seo` runs TypeScript, the production build, prerenders all 114 current
canonical URLs plus three localized error documents, and verifies the output:
unique metadata, one H1, canonical, reciprocal language links, static commercial
links, current schemas, public pricing, internal targets and reachability from
the Russian homepage through ordinary anchors.

`npm run verify:seo` checks an existing build. Update its explicit route-count
assertion intentionally when adding/removing a canonical page.

`dist/sitemap.xml` is generated from real routes. The source sitemap remains a
static inventory. No artificial build date is assigned as `lastmod`. Article
`dateModified` is emitted only for a recorded content update.

## Server and browser acceptance

Validate `nginx.conf` with `nginx -t` in the landing container. This file includes
an HTTP-context language map and the server block. Caddy continues handling host,
HTTPS and legacy-alias redirects; Nginx handles slash/index variants and localized
HTTP 404 documents. Check at least:

- `/services/` and `/services/index.html`: 301 to `/services`, preserving query.
- `/index.html`: 301 to `/`; `/kz/`: 301 to `/kz`.
- unknown page/category/article paths in all three languages: HTTP 404, localized
  error body, `noindex,follow`, no canonical or stale Article schema.
- direct entries and SPA transitions: no hydration errors; HTML/DOM metadata
  agree; article-to-calculator navigation removes Article/FAQ/BreadcrumbList.
- RU/KZ/EN calculator: quantities around 5,000 and 25,000, SSCC and urgency;
  never submit a lead/order during verification.
- mobile widths 360/390: no page overflow, menu and ordinary links work; hidden
  service/calculator banners are not requested. Category heroes use live HTML
  and SVG icons, avoiding obsolete text baked into large infographics.
- desktop: optimized service/calculator WebP banners render correctly.

The initial remediation was checked against the public tariff data on 2026-11-06.
Category banners and complete editorial timelines were restored after the owner
identified https://tanba.telecom.kz as the timeline source. Preserve historical
pilot stages as well as future milestones; do not shorten a timeline to dates
found in a different document. Record discrepancies separately instead of changing
editorial dates or replacing original infographics during technical SEO work.
Source-review dates are manual records, not automatic build timestamps. The water
category has no matching page in the checked TAÑBA category list; its timeline
requires separate confirmation and is not claimed to be verified by TAÑBA.

Search Console index status, Google-selected canonical, organic query data and
field Core Web Vitals require their own available data source. A successful local
build or Lighthouse score does not establish those results. Production deployment
and post-deployment HTTP checks are separate from the local build verification.
