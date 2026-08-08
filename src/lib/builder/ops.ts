import type { BuilderNode, NodeType } from "./types";
import { elementDef } from "./registry";

/* Pure tree operations for the builder. All return new arrays (immutable) so React
 * state updates and undo/redo stay simple. */

const rid = () => (typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `n-${Math.round(performance.now() * 1000)}`);

export function newNode(type: NodeType): BuilderNode {
  const def = elementDef(type);
  const node: BuilderNode = { id: rid(), type, props: { ...(def?.defaultProps ?? {}) }, children: def?.container ? [] : undefined };
  if (type === "columns") node.children = [newNode("column"), newNode("column")]; // start with 2 columns
  return node;
}

export function findNode(nodes: BuilderNode[], id: string): BuilderNode | null {
  for (const n of nodes) {
    if (n.id === id) return n;
    const c = n.children && findNode(n.children, id);
    if (c) return c;
  }
  return null;
}

export function updateNode(nodes: BuilderNode[], id: string, patch: Partial<Record<string, unknown>>): BuilderNode[] {
  return nodes.map((n) => {
    if (n.id === id) return { ...n, props: { ...(n.props ?? {}), ...patch } };
    if (n.children) return { ...n, children: updateNode(n.children, id, patch) };
    return n;
  });
}

export function removeNode(nodes: BuilderNode[], id: string): BuilderNode[] {
  return nodes.filter((n) => n.id !== id).map((n) => (n.children ? { ...n, children: removeNode(n.children, id) } : n));
}

/** Insert `node` into `parentId` (or the root when null) at `index` (end if omitted). */
export function insertNode(nodes: BuilderNode[], parentId: string | null, node: BuilderNode, index?: number): BuilderNode[] {
  if (parentId === null) {
    const next = [...nodes];
    next.splice(index ?? next.length, 0, node);
    return next;
  }
  return nodes.map((n) => {
    if (n.id === parentId) {
      const kids = [...(n.children ?? [])];
      kids.splice(index ?? kids.length, 0, node);
      return { ...n, children: kids };
    }
    return n.children ? { ...n, children: insertNode(n.children, parentId, node, index) } : n;
  });
}

/** Move a node up/down among its siblings. */
export function moveNode(nodes: BuilderNode[], id: string, dir: -1 | 1): BuilderNode[] {
  const idx = nodes.findIndex((n) => n.id === id);
  if (idx !== -1) {
    const j = idx + dir;
    if (j < 0 || j >= nodes.length) return nodes;
    const next = [...nodes];
    [next[idx], next[j]] = [next[j], next[idx]];
    return next;
  }
  return nodes.map((n) => (n.children ? { ...n, children: moveNode(n.children, id, dir) } : n));
}

function clone(node: BuilderNode): BuilderNode {
  return { ...node, id: rid(), props: { ...(node.props ?? {}) }, children: node.children?.map(clone) };
}

/** Duplicate a node right after itself in its sibling list. */
export function duplicateNode(nodes: BuilderNode[], id: string): BuilderNode[] {
  const idx = nodes.findIndex((n) => n.id === id);
  if (idx !== -1) {
    const next = [...nodes];
    next.splice(idx + 1, 0, clone(nodes[idx]));
    return next;
  }
  return nodes.map((n) => (n.children ? { ...n, children: duplicateNode(n.children, id) } : n));
}

/** Move a node to a new parent (null = root) at a given index — used by drag & drop.
 *  No-op if the target is the node itself or one of its descendants. */
export function moveNodeTo(nodes: BuilderNode[], id: string, targetParentId: string | null, index: number): BuilderNode[] {
  const node = findNode(nodes, id);
  if (!node) return nodes;
  if (targetParentId === id || (node.children && findNode(node.children, targetParentId ?? "__none__"))) return nodes; // can't drop into self/descendant
  const without = removeNode(nodes, id);
  return insertNode(without, targetParentId, node, index);
}

/** The parent id of a node (null if top-level, undefined if not found). */
export function parentOf(nodes: BuilderNode[], id: string, parent: string | null = null): string | null | undefined {
  for (const n of nodes) {
    if (n.id === id) return parent;
    if (n.children) { const p = parentOf(n.children, id, n.id); if (p !== undefined) return p; }
  }
  return undefined;
}
