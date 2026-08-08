"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiFetch, getToken } from "@/lib/api";
import { Uploader } from "@/components/app/website/panels";
import { ELEMENTS, elementDef, type Control } from "@/lib/builder/registry";
import { newNode, updateNode, removeNode, insertNode, moveNode, moveNodeTo, duplicateNode, findNode, parentOf } from "@/lib/builder/ops";
import { BLOCKS } from "@/lib/builder/blocks";
import type { BuilderNode, NodeType } from "@/lib/builder/types";
import { Square, Heading, Type, AlignLeft, Image as ImageIcon, MousePointerClick, MoveVertical, Minus, Columns, LayoutGrid, Trash2, Copy, ChevronUp, ChevronDown, ArrowLeft, Loader2, Rocket, Monitor, Smartphone, GripVertical, Undo2, Redo2, Plus } from "lucide-react";

const ICON: Record<string, typeof Square> = { Square, Heading, Type, AlignLeft, Image: ImageIcon, MousePointerClick, MoveVertical, Minus, Columns, LayoutGrid };
const HSIZE: Record<string, string> = { md: "text-[20px]", lg: "text-[28px]", xl: "text-[40px]" };

type Drop = { id: string; pos: "before" | "after" | "inside" } | null;

/* Caret-safe inline editable text: only writes to the DOM when the element isn't focused,
 * so autosave re-renders never reset what you're typing. Commits on blur. */
function Editable({ tag, value, onCommit, className, style }: { tag: "h2" | "p" | "span"; value: string; onCommit: (v: string) => void; className?: string; style?: React.CSSProperties }) {
  const ref = useRef<HTMLElement | null>(null);
  useEffect(() => {
    const el = ref.current;
    if (el && document.activeElement !== el && el.textContent !== value) el.textContent = value;
  }, [value]);
  const Tag = tag as unknown as React.ElementType;
  return <Tag ref={ref} contentEditable suppressContentEditableWarning spellCheck={false} onBlur={(e: React.FocusEvent<HTMLElement>) => onCommit(e.currentTarget.textContent ?? "")} className={`outline-none ${className ?? ""}`} style={style} />;
}

function CanvasNode({ node, accent, sel, onSelect, onEdit, dnd }: {
  node: BuilderNode; accent: string; sel: string | null; onSelect: (id: string) => void;
  onEdit: (id: string, patch: Record<string, unknown>) => void;
  dnd: { drop: Drop; onDragStart: (id: string) => void; onDragOver: (e: React.DragEvent, node: BuilderNode) => void; onDrop: (e: React.DragEvent, node: BuilderNode) => void };
}) {
  const p = node.props ?? {};
  const s = (k: string) => (typeof p[k] === "string" ? (p[k] as string) : undefined);
  const n = (k: string, d: number) => (typeof p[k] === "number" ? (p[k] as number) : d);
  const isSel = sel === node.id;
  const pick = (e: React.MouseEvent) => { e.stopPropagation(); onSelect(node.id); };
  const ring = isSel ? "outline outline-2 outline-brand" : "outline outline-1 outline-transparent hover:outline-brand/40";
  const drop = dnd.drop;
  const dropCls = drop?.id === node.id ? (drop.pos === "before" ? "before:absolute before:-top-1 before:left-0 before:right-0 before:h-1 before:rounded before:bg-brand" : drop.pos === "after" ? "after:absolute after:-bottom-1 after:left-0 after:right-0 after:h-1 after:rounded after:bg-brand" : "outline-dashed outline-2 outline-brand") : "";
  const dragProps = {
    onDragOver: (e: React.DragEvent) => dnd.onDragOver(e, node),
    onDrop: (e: React.DragEvent) => dnd.onDrop(e, node),
  };
  const handle = (
    <span draggable onDragStart={(e) => { e.stopPropagation(); dnd.onDragStart(node.id); e.dataTransfer.effectAllowed = "move"; }} className="absolute -left-2 top-1 z-10 cursor-grab rounded bg-brand p-0.5 text-white opacity-0 group-hover:opacity-100"><GripVertical className="h-3.5 w-3.5" /></span>
  );

  const container = (inner: React.ReactNode, cls = "", style?: React.CSSProperties) => (
    <div onClick={pick} {...dragProps} className={`group relative ${cls} ${ring} ${dropCls}`} style={style}>{handle}{isSel && <NodeTag label={elementDef(node.type)?.label ?? node.type} />}{inner}</div>
  );

  switch (node.type) {
    case "section":
      return container(
        <div className="mx-auto max-w-6xl px-5" style={{ paddingTop: n("paddingY", 40), paddingBottom: n("paddingY", 40) }}>
          {(node.children ?? []).length === 0
            ? <div className="rounded-lg border border-dashed border-n300 py-10 text-center text-[12.5px] text-n400">Empty section — drop or add elements here</div>
            : (node.children ?? []).map((c) => <CanvasNode key={c.id} node={c} accent={accent} sel={sel} onSelect={onSelect} onEdit={onEdit} dnd={dnd} />)}
        </div>, "cursor-pointer", { background: s("bg") || undefined });
    case "columns":
      return container(
        <div className="grid" style={{ gridTemplateColumns: `repeat(${Math.max(1, (node.children ?? []).length)}, minmax(0,1fr))`, gap: n("gap", 24) }}>
          {(node.children ?? []).map((c) => <CanvasNode key={c.id} node={c} accent={accent} sel={sel} onSelect={onSelect} onEdit={onEdit} dnd={dnd} />)}
        </div>, "my-2 cursor-pointer p-1");
    case "column":
      return container(
        (node.children ?? []).length === 0
          ? <div className="rounded border border-dashed border-n300 py-8 text-center text-[11.5px] text-n400">Column</div>
          : <div className="space-y-2">{(node.children ?? []).map((c) => <CanvasNode key={c.id} node={c} accent={accent} sel={sel} onSelect={onSelect} onEdit={onEdit} dnd={dnd} />)}</div>,
        "min-h-[60px] cursor-pointer rounded p-1");
    case "heading":
      return container(<Editable tag="h2" value={s("text") ?? ""} onCommit={(v) => onEdit(node.id, { text: v })} className={`font-bold tracking-tight ${HSIZE[s("size") ?? "lg"]}`} style={{ textAlign: (s("align") as "left") ?? "left", color: s("color") || "#0f172a" }} />, "my-2 cursor-text");
    case "text":
      return container(<Editable tag="p" value={s("text") ?? ""} onCommit={(v) => onEdit(node.id, { text: v })} className="text-[15px] leading-relaxed" style={{ textAlign: (s("align") as "left") ?? "left", color: s("color") || "#475569" }} />, "my-2 cursor-text");
    case "richText":
      return container(<Editable tag="p" value={s("text") ?? ""} onCommit={(v) => onEdit(node.id, { text: v })} className="whitespace-pre-line text-[15px] leading-relaxed text-[#475569]" style={{ textAlign: (s("align") as "left") ?? "left" }} />, "my-2 cursor-text");
    case "image":
      return container(s("src")
        ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={s("src")} alt={s("alt") ?? ""} className="w-full object-cover" style={{ borderRadius: n("radius", 16) }} />
        : <div className="grid aspect-[16/7] w-full place-items-center rounded-2xl bg-black/5 text-[12.5px] text-n400">Select → add an image in the panel →</div>, "my-2 cursor-pointer");
    case "button":
      return container(<div style={{ textAlign: (s("align") as "left") ?? "left" }}><span className="inline-flex items-center rounded-full px-6 py-3 text-[14px] font-semibold text-white" style={{ background: accent }}><Editable tag="span" value={s("label") ?? ""} onCommit={(v) => onEdit(node.id, { label: v })} /></span></div>, "my-2 cursor-text");
    case "inventoryGrid":
      return container(
        <div>
          {s("heading") && <h2 className="mb-4 text-[22px] font-bold tracking-tight text-[#0f172a]">{s("heading")}</h2>}
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">{Array.from({ length: Math.min(4, n("count", 4)) }).map((_, k) => <div key={k} className="rounded-xl border border-n200 bg-n50 p-3"><div className="mb-2 aspect-[4/3] rounded-lg bg-black/5" /><div className="h-2.5 w-3/4 rounded bg-black/10" /><div className="mt-1.5 h-2.5 w-1/2 rounded bg-black/10" /></div>)}</div>
          <p className="mt-2 text-[11px] text-n400">Live vehicles from your inventory show here on the published site.</p>
        </div>, "my-2 cursor-pointer");
    case "spacer":
      return container(<div style={{ height: n("height", 40) }} className="grid place-items-center text-[10px] uppercase tracking-wide text-n300">spacer</div>, "my-2 cursor-pointer");
    case "divider":
      return container(<hr className="border-black/10" />, "my-2 cursor-pointer");
    default:
      return null;
  }
}

function NodeTag({ label }: { label: string }) {
  return <span className="absolute -top-2.5 left-3 z-10 rounded bg-brand px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">{label}</span>;
}

export default function BuildPage() {
  const router = useRouter();
  const [nodes, setNodesRaw] = useState<BuilderNode[]>([]);
  const past = useRef<BuilderNode[][]>([]);
  const future = useRef<BuilderNode[][]>([]);
  // Every user mutation goes through commit() so undo/redo get a clean history.
  const commit = useCallback((next: BuilderNode[] | ((p: BuilderNode[]) => BuilderNode[])) => {
    setNodesRaw((prev) => {
      const n = typeof next === "function" ? (next as (p: BuilderNode[]) => BuilderNode[])(prev) : next;
      if (n !== prev) { past.current.push(prev); if (past.current.length > 60) past.current.shift(); future.current = []; }
      return n;
    });
  }, []);
  const undo = useCallback(() => setNodesRaw((cur) => { const p = past.current.pop(); if (p === undefined) return cur; future.current.push(cur); return p; }), []);
  const redo = useCallback(() => setNodesRaw((cur) => { const f = future.current.pop(); if (f === undefined) return cur; past.current.push(cur); return f; }), []);
  const [accent, setAccent] = useState("#2b6ba4");
  const [sel, setSel] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [saved, setSaved] = useState<"idle" | "saving" | "done">("idle");
  const [device, setDevice] = useState<"desktop" | "mobile">("desktop");
  const [publishing, setPublishing] = useState(false);
  const [drop, setDrop] = useState<Drop>(null);
  const dragId = useRef<string | null>(null);
  const first = useRef(true);

  useEffect(() => {
    if (!getToken()) { router.replace("/login"); return; }
    apiFetch<{ tree?: BuilderNode[]; primaryColor?: string }>("/website").then((w) => {
      setAccent(w.primaryColor || "#2b6ba4");
      setNodesRaw(Array.isArray(w.tree) && w.tree.length ? w.tree : [newNode("section")]);
      setReady(true);
    }).catch(() => setReady(true));
  }, [router]);

  useEffect(() => {
    if (!ready) return;
    if (first.current) { first.current = false; return; }
    setSaved("saving");
    const t = setTimeout(() => {
      apiFetch("/website", { method: "PATCH", body: JSON.stringify({ tree: nodes }) }).then(() => setSaved("done")).catch(() => setSaved("idle"));
    }, 700);
    return () => clearTimeout(t);
  }, [nodes, ready]);

  // Undo/redo shortcuts — but let the browser handle text undo inside fields.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!(e.metaKey || e.ctrlKey) || e.key.toLowerCase() !== "z") return;
      const el = document.activeElement as HTMLElement | null;
      if (el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.isContentEditable)) return;
      e.preventDefault();
      if (e.shiftKey) redo(); else undo();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [undo, redo]);

  const selectedNode = sel ? findNode(nodes, sel) : null;
  const editProp = useCallback((id: string, patch: Record<string, unknown>) => commit((ns) => updateNode(ns, id, patch)), []);

  const addElement = useCallback((type: NodeType) => {
    if (type === "section") { const s = newNode("section"); commit((ns) => insertNode(ns, null, s)); setSel(s.id); return; }
    commit((ns) => {
      let parentId: string | null = null;
      if (sel) { const cur = findNode(ns, sel); const curDef = cur && elementDef(cur.type); parentId = curDef?.container ? cur!.id : (parentOf(ns, sel) ?? null); }
      const node = newNode(type);
      if (parentId) { setSel(node.id); return insertNode(ns, parentId, node); }
      const sec = newNode("section"); const withSec = insertNode(ns, null, sec); setSel(node.id); return insertNode(withSec, sec.id, node);
    });
  }, [sel]);

  // ── drag & drop ──
  const onDragStart = (id: string) => { dragId.current = id; };
  const onDragOver = (e: React.DragEvent, node: BuilderNode) => {
    e.preventDefault(); e.stopPropagation();
    if (!dragId.current || dragId.current === node.id) return;
    const def = elementDef(node.type);
    const emptyContainer = def?.container && (node.children ?? []).length === 0;
    if (emptyContainer) { setDrop({ id: node.id, pos: "inside" }); return; }
    const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setDrop({ id: node.id, pos: e.clientY < r.top + r.height / 2 ? "before" : "after" });
  };
  const onDrop = (e: React.DragEvent, node: BuilderNode) => {
    e.preventDefault(); e.stopPropagation();
    const id = dragId.current; dragId.current = null;
    const d = drop; setDrop(null);
    if (!id || !d || id === node.id) return;
    commit((ns) => {
      if (d.pos === "inside") return moveNodeTo(ns, id, node.id, 0);
      const parent = parentOf(ns, node.id) ?? null;
      const siblings = parent ? (findNode(ns, parent)?.children ?? []) : ns;
      const idx = siblings.findIndex((x) => x.id === node.id);
      return moveNodeTo(ns, id, parent, idx + (d.pos === "after" ? 1 : 0));
    });
  };

  const publish = async () => { setPublishing(true); try { await apiFetch("/website/publish", { method: "POST", body: JSON.stringify({ status: "PUBLISHED" }) }); } catch { /* */ } setPublishing(false); };

  if (!ready) return <div className="grid h-full place-items-center text-[13px] text-n400">Loading builder…</div>;

  const dnd = { drop, onDragStart, onDragOver, onDrop };
  const selDef = selectedNode ? elementDef(selectedNode.type) : null;

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex items-center gap-3 border-b border-n200 bg-white px-4 py-2.5">
        <Link href="/dashboard/website" className="inline-flex items-center gap-1.5 text-[13px] font-medium text-n600 hover:text-n900"><ArrowLeft className="h-4 w-4" />Exit</Link>
        <span className="text-[13px] font-semibold text-n900">Visual builder</span>
        <span className="text-[12px] text-n400">{saved === "saving" ? "Saving…" : saved === "done" ? "Staged" : ""}</span>
        <div className="ml-auto flex items-center gap-2">
          <div className="inline-flex rounded-lg border border-n200 p-0.5">
            <button title="Undo (⌘Z)" onClick={undo} className="grid h-7 w-8 place-items-center rounded text-n500 hover:bg-n100"><Undo2 className="h-4 w-4" /></button>
            <button title="Redo (⇧⌘Z)" onClick={redo} className="grid h-7 w-8 place-items-center rounded text-n500 hover:bg-n100"><Redo2 className="h-4 w-4" /></button>
          </div>
          <div className="inline-flex rounded-lg border border-n200 p-0.5">
            <button onClick={() => setDevice("desktop")} className={`grid h-7 w-8 place-items-center rounded ${device === "desktop" ? "bg-n100 text-n900" : "text-n500"}`}><Monitor className="h-4 w-4" /></button>
            <button onClick={() => setDevice("mobile")} className={`grid h-7 w-8 place-items-center rounded ${device === "mobile" ? "bg-n100 text-n900" : "text-n500"}`}><Smartphone className="h-4 w-4" /></button>
          </div>
          <button onClick={publish} disabled={publishing} className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-brand px-4 text-[12.5px] font-semibold text-white hover:bg-brand-hover disabled:opacity-60">{publishing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Rocket className="h-3.5 w-3.5" />}Publish</button>
        </div>
      </div>

      <div className="flex min-h-0 flex-1">
        <aside className="w-[172px] shrink-0 overflow-y-auto border-r border-n200 bg-white p-3">
          <p className="mb-2 text-[10.5px] font-semibold uppercase tracking-[0.08em] text-n400">Add element</p>
          <div className="space-y-1">
            {ELEMENTS.filter((e) => e.type !== "column").map((e) => {
              const I = ICON[e.icon] ?? Square;
              return <button key={e.type} onClick={() => addElement(e.type)} className="flex w-full items-center gap-2.5 rounded-lg border border-n200 px-2.5 py-2 text-[12.5px] font-medium text-n700 hover:bg-n50"><I className="h-4 w-4 text-n500" />{e.label}</button>;
            })}
          </div>

          <p className="mb-2 mt-5 text-[10.5px] font-semibold uppercase tracking-[0.08em] text-n400">Blocks</p>
          <div className="space-y-1">
            {BLOCKS.map((b) => (
              <button key={b.key} onClick={() => { const node = b.build(); commit((ns) => insertNode(ns, null, node)); setSel(node.id); }} className="flex w-full items-center gap-2 rounded-lg border border-n200 px-2.5 py-2 text-[12.5px] font-medium text-n700 hover:bg-n50"><Plus className="h-3.5 w-3.5 text-n500" />{b.label}</button>
            ))}
          </div>

          <p className="mt-4 text-[10.5px] leading-relaxed text-n400">Drag the grip to reorder. Click text to edit it inline. ⌘Z / ⇧⌘Z to undo.</p>
        </aside>

        <main onClick={() => setSel(null)} className="min-h-0 flex-1 overflow-y-auto bg-n100 p-6">
          <div className={`mx-auto overflow-hidden rounded-xl border border-n300 bg-white shadow-sm ${device === "mobile" ? "w-[390px]" : "w-full max-w-5xl"}`}>
            {nodes.length === 0 ? <div className="p-16 text-center text-[13px] text-n400">Add a section to begin.</div>
              : nodes.map((node) => <CanvasNode key={node.id} node={node} accent={accent} sel={sel} onSelect={setSel} onEdit={editProp} dnd={dnd} />)}
          </div>
        </main>

        <aside className="w-[280px] shrink-0 overflow-y-auto border-l border-n200 bg-white p-4">
          {!selectedNode ? <p className="text-[12.5px] text-n400">Select an element on the canvas to edit it.</p> : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-[13px] font-semibold text-n900">{selDef?.label}</p>
                <div className="flex items-center gap-1">
                  <button title="Move up" onClick={() => commit((ns) => moveNode(ns, selectedNode.id, -1))} className="grid h-7 w-7 place-items-center rounded text-n500 hover:bg-n100"><ChevronUp className="h-4 w-4" /></button>
                  <button title="Move down" onClick={() => commit((ns) => moveNode(ns, selectedNode.id, 1))} className="grid h-7 w-7 place-items-center rounded text-n500 hover:bg-n100"><ChevronDown className="h-4 w-4" /></button>
                  <button title="Duplicate" onClick={() => commit((ns) => duplicateNode(ns, selectedNode.id))} className="grid h-7 w-7 place-items-center rounded text-n500 hover:bg-n100"><Copy className="h-3.5 w-3.5" /></button>
                  <button title="Delete" onClick={() => { commit((ns) => removeNode(ns, selectedNode.id)); setSel(null); }} className="grid h-7 w-7 place-items-center rounded text-err hover:bg-err-soft"><Trash2 className="h-3.5 w-3.5" /></button>
                </div>
              </div>
              {selectedNode.type === "columns" && (
                <div className="flex gap-2">
                  <button onClick={() => commit((ns) => insertNode(ns, selectedNode.id, newNode("column")))} className="flex-1 rounded-md border border-n200 py-1.5 text-[12px] font-semibold text-n700 hover:bg-n50">+ Column</button>
                  <button onClick={() => commit((ns) => { const kids = findNode(ns, selectedNode.id)?.children ?? []; return kids.length > 1 ? removeNode(ns, kids[kids.length - 1].id) : ns; })} className="flex-1 rounded-md border border-n200 py-1.5 text-[12px] font-semibold text-n700 hover:bg-n50">− Column</button>
                </div>
              )}
              {(selDef?.controls ?? []).length === 0 && selectedNode.type !== "columns" && <p className="text-[12px] text-n400">No options for this element.</p>}
              {(selDef?.controls ?? []).map((c) => (
                <ControlField key={c.key} c={c} value={selectedNode.props?.[c.key]} onChange={(v) => commit((ns) => updateNode(ns, selectedNode.id, { [c.key]: v }))} />
              ))}
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

function ControlField({ c, value, onChange }: { c: Control; value: unknown; onChange: (v: unknown) => void }) {
  const input = "h-9 w-full rounded-md border border-n200 bg-white px-2.5 text-[12.5px] text-n900 outline-none focus:border-brand focus:ring-2 focus:ring-brand/20";
  const str = typeof value === "string" ? value : "";
  const num = typeof value === "number" ? value : Number(c.min ?? 0);
  return (
    <div>
      <label className="mb-1 block text-[11.5px] font-medium text-n600">{c.label}</label>
      {c.type === "textarea" ? <textarea value={str} onChange={(e) => onChange(e.target.value)} rows={4} className={`${input} h-auto resize-none py-2`} />
        : c.type === "select" ? <select value={str} onChange={(e) => onChange(e.target.value)} className={input}>{(c.options ?? []).map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</select>
        : c.type === "number" ? <input type="number" min={c.min} max={c.max} value={num} onChange={(e) => onChange(Number(e.target.value))} className={input} />
        : c.type === "toggle" ? <label className="flex items-center gap-2 text-[12.5px] text-n600"><input type="checkbox" checked={!!value} onChange={(e) => onChange(e.target.checked)} />Enabled</label>
        : c.type === "color" ? <div className="flex items-center gap-2"><input type="color" value={str || "#000000"} onChange={(e) => onChange(e.target.value)} className="h-9 w-10 rounded border border-n200" /><input value={str} onChange={(e) => onChange(e.target.value)} placeholder="#hex or blank" className={input} /></div>
        : c.type === "image" ? <Uploader value={str} onChange={onChange} label="" aspect="wide" />
        : <input value={str} onChange={(e) => onChange(e.target.value)} placeholder={c.placeholder} className={input} />}
    </div>
  );
}
