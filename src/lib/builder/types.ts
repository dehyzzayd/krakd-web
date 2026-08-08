/** Advanced-builder node tree (see docs/ADVANCED_BUILDER.md). A page is a flat list of
 *  top-level nodes; containers nest via `children`. Props are per-type; the registry
 *  validates them. Unknown types render nothing so a bad node never crashes a page. */

export type NodeType =
  | "section" | "columns" | "column"
  | "heading" | "text" | "richText" | "image" | "button" | "spacer" | "divider"
  | "inventoryGrid";

export type BuilderNode = {
  id: string;
  type: NodeType;
  props?: Record<string, unknown>;
  children?: BuilderNode[];
};

export const isNodeTree = (v: unknown): v is BuilderNode[] =>
  Array.isArray(v) && v.every((n) => n && typeof n === "object" && typeof (n as BuilderNode).type === "string");

/** Convert a Phase-2 flat section list into a node tree (each block → a section node).
 *  Lets a dealer graduate from the simple sections editor to the advanced builder without
 *  losing their content. */
export function migrateLayoutToTree(layout: Array<Record<string, unknown>>): BuilderNode[] {
  const uid = (i: number) => `mig-${i}-${Math.round((i + 1) * 97)}`;
  return (layout ?? []).map((b, i) => {
    const children: BuilderNode[] = [];
    if (b.heading) children.push({ id: `${uid(i)}-h`, type: "heading", props: { text: b.heading } });
    if (b.image) children.push({ id: `${uid(i)}-img`, type: "image", props: { src: b.image } });
    if (b.body) children.push({ id: `${uid(i)}-t`, type: "richText", props: { text: b.body } });
    if (b.buttonLabel) children.push({ id: `${uid(i)}-btn`, type: "button", props: { label: b.buttonLabel, href: b.buttonUrl } });
    return { id: uid(i), type: "section", props: { variant: b.type }, children };
  });
}
