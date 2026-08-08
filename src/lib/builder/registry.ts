import type { NodeType } from "./types";

/* Single source of truth for the advanced builder. Each element declares its default
 * props and the property-panel controls. The palette, property panel and (with the
 * renderer) the canvas are all generated from this — adding an element = one entry. */

export type ControlType = "text" | "textarea" | "image" | "color" | "select" | "number" | "toggle" | "link";
export type Control = { key: string; label: string; type: ControlType; options?: { value: string; label: string }[]; min?: number; max?: number; placeholder?: string };

export type ElementDef = {
  type: NodeType;
  label: string;
  icon: string;              // lucide icon name (resolved in the palette)
  category: "layout" | "content" | "media";
  container?: boolean;       // can hold children
  defaultProps: Record<string, unknown>;
  defaultChildren?: NodeType[];
  controls: Control[];
};

const ALIGN: Control = { key: "align", label: "Alignment", type: "select", options: [{ value: "left", label: "Left" }, { value: "center", label: "Center" }, { value: "right", label: "Right" }] };

export const ELEMENTS: ElementDef[] = [
  {
    type: "section", label: "Section", icon: "Square", category: "layout", container: true,
    defaultProps: { bg: "", paddingY: 40 },
    controls: [
      { key: "bg", label: "Background color", type: "color" },
      { key: "paddingY", label: "Vertical padding", type: "number", min: 0, max: 160 },
    ],
  },
  {
    type: "columns", label: "Columns", icon: "Columns", category: "layout", container: true,
    defaultProps: { gap: 24 },
    controls: [{ key: "gap", label: "Gap between columns", type: "number", min: 0, max: 64 }],
  },
  { type: "column", label: "Column", icon: "Square", category: "layout", container: true, defaultProps: {}, controls: [] },
  {
    type: "heading", label: "Heading", icon: "Heading", category: "content",
    defaultProps: { text: "Your heading", align: "left", size: "lg" },
    controls: [
      { key: "text", label: "Text", type: "text", placeholder: "Heading" },
      ALIGN,
      { key: "size", label: "Size", type: "select", options: [{ value: "md", label: "Medium" }, { value: "lg", label: "Large" }, { value: "xl", label: "Extra large" }] },
      { key: "color", label: "Color", type: "color" },
    ],
  },
  {
    type: "text", label: "Text", icon: "Type", category: "content",
    defaultProps: { text: "Add your text here.", align: "left" },
    controls: [{ key: "text", label: "Text", type: "textarea" }, ALIGN, { key: "color", label: "Color", type: "color" }],
  },
  {
    type: "richText", label: "Paragraph", icon: "AlignLeft", category: "content",
    defaultProps: { text: "A longer paragraph of copy that keeps its line breaks." },
    controls: [{ key: "text", label: "Text", type: "textarea" }, ALIGN],
  },
  {
    type: "image", label: "Image", icon: "Image", category: "media",
    defaultProps: { src: "", alt: "", radius: 16 },
    controls: [{ key: "src", label: "Image", type: "image" }, { key: "alt", label: "Alt text", type: "text" }, { key: "radius", label: "Corner radius", type: "number", min: 0, max: 40 }],
  },
  {
    type: "button", label: "Button", icon: "MousePointerClick", category: "content",
    defaultProps: { label: "Learn more", href: "", align: "left" },
    controls: [{ key: "label", label: "Label", type: "text" }, { key: "href", label: "Link", type: "link", placeholder: "/financing or https://…" }, ALIGN],
  },
  {
    type: "inventoryGrid", label: "Inventory grid", icon: "LayoutGrid", category: "content",
    defaultProps: { heading: "Featured inventory", count: 4 },
    controls: [{ key: "heading", label: "Heading", type: "text" }, { key: "count", label: "How many to show", type: "number", min: 2, max: 12 }],
  },
  {
    type: "spacer", label: "Spacer", icon: "MoveVertical", category: "layout",
    defaultProps: { height: 40 },
    controls: [{ key: "height", label: "Height", type: "number", min: 0, max: 240 }],
  },
  {
    type: "divider", label: "Divider", icon: "Minus", category: "layout",
    defaultProps: {},
    controls: [],
  },
];

export const elementDef = (type: NodeType) => ELEMENTS.find((e) => e.type === type);
