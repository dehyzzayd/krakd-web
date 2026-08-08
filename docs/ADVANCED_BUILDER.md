# Krakd Advanced Builder — Architecture (Elementor/Webflow-class)

Goal: a visual, drag-and-drop, click-to-edit page builder so a dealer **never files a
ticket** to change copy, swap an image, or add a section. Edit the real page, on the
page, and hit publish. This is the "editor" layer on top of the Phase-1 draft model and
the Phase-2 sections — evolved from a flat block list into a full node tree.

## 1. Core model — a node tree (the single source of truth)
Everything on a page is a **node**: `{ id, type, props, children[], responsive? }`.
- **Containers**: `page` → `section` → `row`/`columns` → `column`.
- **Elements**: `heading`, `text`, `richText`, `image`, `button`, `spacer`, `divider`,
  `icon`, `video`, `gallery`, `map`, `stats`, `faq`, `form` (Phase-3), `inventoryGrid`
  (data-bound to the dealer's live vehicles), `reviews`, `staff`.
- `props` are per-type (validated by a Zod schema in the registry). `responsive` holds
  per-breakpoint overrides (`base`/`sm`/`lg`) for style props.

Stored as `Website.tree` (Json) — staged through the existing `draft` overlay, published
the same way. The Phase-2 flat `layout` becomes a migration source (auto-converted to a
`section[]` subtree) so nothing is lost.

## 2. Element registry (`src/lib/builder/registry.ts`)
One registry drives editor + renderer + property panel. Each entry:
```
{
  type, label, category, icon,
  defaultProps, propsSchema (zod),
  controls: [ {key, label, control: "text"|"textarea"|"image"|"color"|"select"|"slider"|"toggle"|"link"|"spacing"} ],
  allowedChildren?, render(node, ctx) → ReactNode
}
```
Adding a new element = one registry entry. Editor palette, canvas rendering, public
rendering, and the property panel are all generated from it. This is the leverage point:
new capabilities never touch the editor shell.

## 3. Dual rendering
`renderNode(node, ctx)` renders the tree to React and is used **twice**:
- **Public** (`/site/[slug]`, server component): static, fast, SEO-clean, cached.
- **Editor canvas** (iframe): the same output wrapped with selection hit-boxes +
  `data-node-id`. The canvas is an iframe so breakpoints key off the frame width
  (matches the existing preview trick) and dealer CSS can't leak into the app chrome.

## 4. Editor shell (`/dashboard/website/build`)
- **Left rail**: element palette (drag onto canvas) + a layer tree (outline).
- **Canvas** (iframe): renders the tree; click a node → select; hover → outline;
  drag handles to reorder; inline `contentEditable` for text/heading; drop zones between
  nodes. Communicates with the shell via `postMessage` (select/move/insert/update/patch).
- **Right rail**: the property panel for the selected node, generated from its `controls`
  — content + style (spacing, color, typography, background, border, radius, shadow) with
  a base/tablet/mobile breakpoint switch.
- **Top bar**: device preview toggle, undo/redo, Save draft (auto), Publish, Discard.

## 5. Interaction & state
- Editor state = the node tree + selection + a **command stack** (every edit is a
  command → free undo/redo). Autosave debounced to `PATCH /website { tree }` (draft).
- Drag/drop: pointer-based (no heavy dep), with drop-target computation from
  `getBoundingClientRect` of `data-node-id` elements inside the iframe.

## 6. Data-bound & dynamic elements
Some elements pull live data via `ctx` (server): `inventoryGrid` (filters → vehicles),
`reviews`, `form` (a Phase-3 form by id), `map`. In the editor they render with real or
sample data so the dealer sees the truth.

## 7. Templates & blocks library
Prebuilt **section blocks** (hero variants, feature grids, testimonial rows, pricing,
contact) as serialized subtrees a dealer inserts in one click. Whole-page **templates**
seed a full tree. Both are just node JSON — authored once, reused everywhere.

## 8. Guardrails
- Sanitize any raw HTML/embed props; whitelist embed origins.
- Props validated by registry Zod on save; unknown node types render nothing (never crash).
- Public render is pure/stateless and cache-friendly; no dealer JS executes in the app.

## Phased build
- **A. Engine** — node types, registry (first ~10 elements), `renderNode`, `Website.tree`
  column, public rendering, `layout`→tree migration. (foundation, non-visual)
- **B. Editor shell** — iframe canvas + selection + right-panel property editor generated
  from the registry; add/delete/reorder via the layer tree.
- **C. Direct manipulation** — inline text editing, drag-and-drop, drop zones, hover
  outlines, breakpoint style controls.
- **D. Power** — undo/redo, blocks/template library, data-bound elements, copy/paste,
  duplicate, keyboard shortcuts.
- **E. Polish** — responsive fine-tuning, a11y, performance, autosave/versioning.

The flat Phase-2 sections stay fully working throughout; the advanced builder is opt-in
per dealer until it reaches parity, then becomes the default editing surface.
