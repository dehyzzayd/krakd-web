# Krakd Website Module — Build Roadmap

Bringing the neptune-ai capability set (see `WEBSITE_CAPABILITIES_REPORT.md`) into
krakd-web's multi-tenant Next.js website builder. Concepts adapted, not copied:
neptune is single-tenant Laravel/Livewire; krakd is multi-tenant Next + Prisma, so
per-dealer config lives on the `Website` row (JSON) and rendering is Next server components.

Sequenced top-down. Each phase is shippable on its own.

## Phase 1 — Staged Draft → Preview → Publish  ✅ (foundation)
Today every builder save writes straight to the live row. Add a `draft` JSON overlay:
saves stage into `draft`; the builder + preview render the merged draft; the public
site keeps serving the last-published columns; **Publish** materializes draft→live;
**Discard** drops the draft. One write path, backward-compatible.

## Phase 2 — Section-based page composition  ✅
Ordered list of composable content sections (rich text, image+text, CTA, stats, FAQ)
with per-section config, rendered after each template's built-in blocks. Add / reorder /
remove / configure. Rides on the Phase-1 draft model.

## Phase 2.5 — Advanced Builder (Elementor/Webflow-class)  ← PRIORITY
Full visual, drag-and-drop, click-to-edit page builder on a node-tree model so dealers
never file a ticket to change anything. Detailed architecture in `ADVANCED_BUILDER.md`.
Sub-phases: A) engine (node tree + registry + renderer), B) editor shell (iframe canvas
+ property panel), C) direct manipulation (inline edit + drag/drop), D) power (undo/redo,
blocks/templates, data-bound elements), E) polish. The Phase-2 flat sections keep working
and auto-migrate into the tree.

## Phase 3 — Form Builder
Dealer-defined forms (multi-step, custom fields, per-field rules) replacing the single
fixed lead form. Submissions flow through the existing lead pipeline (dedup / assign /
consent). Forms referenceable by sections and popups.

## Phase 4 — Lead Maximizer + anti-spam
Timed promotional popups (multiple layouts, per-page targeting, session-frequency cap)
embedding a Form-Builder form. Plus reCAPTCHA v3 + rate-limiting on all public submits
(the report's #1 risk).

## Phase 5 — Media library
R2-backed asset library (krakd already uses R2) + a reusable image picker across every
panel, replacing one-off data-URL uploads.

## Phase 6 — Blog / CMS
Content-entry model, blog index + post pages, author/date/tags, feeds the SEO layer.

## Phase 7 — SEO
Per-site meta + OpenGraph, JSON-LD structured data (LocalBusiness + Vehicle), auto
`sitemap.xml` + `robots.txt`, canonical URLs across `<slug>.krakd.io` / custom domains.

## Phase 8 — Analytics & reputation
GA4 wiring, Google Business reviews import + Reviews section, PageSpeed score surfaced
in the dashboard.

## Phase 9 — Multi-language
Content translation + a language switcher on the public site.

## Phase 10 — Hardening
Audit log of publishes, optional per-user drafts, tests for the new surfaces.
