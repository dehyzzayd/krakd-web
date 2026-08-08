import type { BuilderNode } from "./types";
import { newNode } from "./ops";

/* Prebuilt section blocks — one-click, fully-editable subtrees. Each build() returns a
 * fresh section (new ids via newNode) so a dealer can drop in a polished layout and tweak
 * it inline. Adding a block = one entry here. */

const set = (n: BuilderNode, props: Record<string, unknown>): BuilderNode => ({ ...n, props: { ...(n.props ?? {}), ...props } });
const heading = (text: string, size = "lg", align = "left") => set(newNode("heading"), { text, size, align });
const text = (t: string, align = "left") => set(newNode("richText"), { text: t, align });
const button = (label: string, align = "left") => set(newNode("button"), { label, align });
const section = (children: BuilderNode[], props: Record<string, unknown> = {}) => ({ ...newNode("section"), props: { paddingY: 56, ...props }, children });

function columns(cols: BuilderNode[][], gap = 24): BuilderNode {
  const c = newNode("columns");
  return { ...c, props: { gap }, children: cols.map((kids) => ({ ...newNode("column"), children: kids })) };
}

export type BlockDef = { key: string; label: string; build: () => BuilderNode };

export const BLOCKS: BlockDef[] = [
  { key: "hero", label: "Hero", build: () => section([heading("A headline that sells.", "xl", "center"), text("One clear sentence about what you offer and why it's the obvious choice.", "center"), set(newNode("button"), { label: "Get started", align: "center" })]) },
  { key: "features", label: "Feature trio", build: () => section([heading("Why choose us", "lg", "center"), columns([
      [heading("Fast", "md"), text("Describe the first benefit in a line or two.")],
      [heading("Fair", "md"), text("Describe the second benefit in a line or two.")],
      [heading("Trusted", "md"), text("Describe the third benefit in a line or two.")],
    ])]) },
  { key: "stats", label: "Stats row", build: () => section([columns([
      [heading("500+", "xl", "center"), text("Happy customers", "center")],
      [heading("20", "xl", "center"), text("Years in business", "center")],
      [heading("4.9★", "xl", "center"), text("Average rating", "center")],
    ])]) },
  { key: "cta", label: "Call to action", build: () => section([heading("Ready to get started?", "lg", "center"), text("Add a short line of encouragement here.", "center"), button("Contact us", "center")], { bg: "#0f172a" }) },
  { key: "imageText", label: "Image + text", build: () => section([columns([
      [newNode("image")],
      [heading("Tell your story", "lg"), text("Two or three sentences about your business, your team, and what makes you different."), button("Learn more")],
    ], 40)]) },
  { key: "inventory", label: "Inventory showcase", build: () => section([{ ...newNode("inventoryGrid"), props: { heading: "Featured inventory", count: 4 } }]) },
];

export const blockByKey = (key: string) => BLOCKS.find((b) => b.key === key);
