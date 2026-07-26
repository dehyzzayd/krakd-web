---
name: no-mock-data-in-product
description: "In an authenticated product with real accounts + a backend, NO screen may render hardcoded/seed/mock data — every data surface reads from the tenant-scoped API, and a fresh account shows empty states EVERYWHERE. Use when: dashboards, list/table/detail pages, KPIs/stats, 'why do I see mock data', signup shows fake data, wiring UI to an API/DB, converting a static showcase into a real product."
---

# No mock data in the authenticated product

If the app has real accounts and a backend, **every data surface behind login must read from the backend, scoped to the current tenant.** A brand-new signup must show **empty states everywhere** — never showcase/seed data. Hardcoded arrays in a page (`const LEADS = [...]`, `const KPIS = [...]`) are a shipping bug in a real product.

## The failure to never repeat

Wiring pages **one at a time** and calling it done. User cleans Overview, sees it's real, clicks Leads → full of "Marcus Reed / Priya Shah" mock. That's whack-a-mole and it reads as sabotage. **Audit and wire ALL data surfaces as one job**, not page-by-page.

## Before you say a data-driven feature is "done"

1. **Grep for hardcoded data across every authenticated page**, not just the one you touched:
   ```bash
   grep -rlnE "const [A-Z_]+ ?= ?\[|Marcus Reed|Downtown Auto|from \"@/lib/(leads|inventory|crm|marketing|krakdai)\"" src/app/dashboard src/components/app
   ```
   Every hit is a screen still on mock data. List them; none may remain in the product.
2. **Create a brand-new account and click every nav item.** If anything shows numbers/rows for an empty account, it's not wired.
3. Marketing/showcase pages MAY use mock data. The **authenticated product may not.**

## The wiring pattern (do it for every surface)

- **Tenant-scoped API route** (`/api/v1/<thing>`) — always filter by the authed principal's tenant id, never a body param.
- **Client fetch** (`useApi`) with a redirect-to-login on 401.
- **Map** API → UI shape.
- **Empty state** for zero rows ("No leads yet — launch a campaign"). Zero is the *default* experience, so design it first, not last.
- Delete the seed import from the page. If a `src/lib/<seed>.ts` is now unused by the product, it should be gone or clearly marked marketing-only.

## Rule of thumb

Do a **sweep**, not a patch. When asked to make the product show real data, treat it as: "wire *all* dashboard data surfaces + verify an empty account is empty on every screen," then report the full list you covered — not one page.
