"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { apiFetch, getToken } from "@/lib/api";
import { useRouter } from "next/navigation";
import { Uploader } from "@/components/app/website/panels";
import { ELEMENTS, elementDef, type Control } from "@/lib/builder/registry";
import { newNode, updateNode, removeNode, insertNode, moveNode, duplicateNode, findNode, parentOf } from "@/lib/builder/ops";
import type { BuilderNode, NodeType } from "@/lib/builder/types";
import { Square, Heading, Type, AlignLeft, Image as ImageIcon, MousePointerClick, MoveVertical, Minus, Trash2, Copy, ChevronUp, ChevronDown, ArrowLeft, Loader2, Rocket, Monitor, Smartphone } from "lucide-react";

const ICON: Record<string, typeof Square> = { Square, Heading, Type, AlignLeft, Image: ImageIcon, MousePointerClick, MoveVertical, Minus };
const HSIZE: Record<string, string> = { md: "text-[20px]", lg: "text-[28px]", xl: "text-[40px]" };

/* Visual node — renders the same output as the public NodeRenderer, wrapped with
 * selection chrome. Kept in sync with components/site/NodeRenderer.tsx. */
function CanvasNode({ node, accent, selected, onSelect }: { node: BuilderNode; accent: string; selected: string | null; onSelect: (id: string) => void }) {
  const p = node.props ?? {};
  const s = (k: string) => (typeof p[k] === "string" ? (p[k] as string) : undefined);
  const n = (k: string, d: number) => (typeof p[k] === "number" ? (p[k] as number) : d);
  const isSel = selected === node.id;
  const pick = (e: React.MouseEvent) => { e.stopPropagation(); onSelect(node.id); };
  const ring = isSel ? "outline outline-2 outline-brand" : "outline outline-1 outline-transparent hover:outline-brand/40";

  let inner: React.ReactNode = null;
  switch (node.type) {
    case "section":
      inner = (
        <div className="mx-auto max-w-6xl px-5" style={{ paddingTop: n("paddingY", 40), paddingBottom: n("paddingY", 40) }}>
          {(node.children ?? []).length === 0
            ? <div className="rounded-lg border border-dashed border-n300 py-10 text-center text-[12.5px] text-n400">Empty section — select it and add elements</div>
            : (node.children ?? []).map((c) => <CanvasNode key={c.id} node={c} accent={accent} selected={selected} onSelect={onSelect} />)}
        </div>
      );
      return <section onClick={pick} className={`relative cursor-pointer ${ring}`} style={{ background: s("bg") || undefined }}>{isSel && <NodeTag label="Section" />}{inner}</section>;
    case "heading":
      inner = <h2 className={`font-bold tracking-tight ${HSIZE[s("size") ?? "lg"]}`} style={{ textAlign: (s("align") as "left") ?? "left", color: s("color") || "#0f172a" }}>{s("text") || "Heading"}</h2>;
      break;
    case "text":
      inner = <p className="text-[15px] leading-relaxed" style={{ textAlign: (s("align") as "left") ?? "left", color: s("color") || "#475569" }}>{s("text") || "Text"}</p>;
      break;
    case "richText":
      inner = <p className="whitespace-pre-line text-[15px] leading-relaxed text-[#475569]" style={{ textAlign: (s("align") as "left") ?? "left" }}>{s("text") || "Paragraph"}</p>;
      break;
    case "image":
      inner = s("src")
        ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={s("src")} alt={s("alt") ?? ""} className="w-full object-cover" style={{ borderRadius: n("radius", 16) }} />
        : <div className="grid aspect-[16/7] w-full place-items-center rounded-2xl bg-black/5 text-[12.5px] text-n400">Add an image →</div>;
      break;
    case "button": {
      inner = <div style={{ textAlign: (s("align") as "left") ?? "left" }}><span className="inline-flex items-center rounded-full px-6 py-3 text-[14px] font-semibold text-white" style={{ background: accent }}>{s("label") || "Button"}</span></div>;
      break;
    }
    case "spacer":
      inner = <div style={{ height: n("height", 40) }} className="grid place-items-center text-[10px] uppercase tracking-wide text-n300">spacer</div>;
      break;
    case "divider":
      inner = <hr className="border-black/10" />;
      break;
  }
  return <div onClick={pick} className={`relative my-2 cursor-pointer rounded ${ring}`}>{isSel && <NodeTag label={elementDef(node.type)?.label ?? node.type} />}{inner}</div>;
}

function NodeTag({ label }: { label: string }) {
  return <span className="absolute -top-2.5 left-2 z-10 rounded bg-brand px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">{label}</span>;
}

export default function BuildPage() {
  const router = useRouter();
  const [nodes, setNodes] = useState<BuilderNode[]>([]);
  const [accent, setAccent] = useState("#2b6ba4");
  const [sel, setSel] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [saved, setSaved] = useState<"idle" | "saving" | "done">("idle");
  const [device, setDevice] = useState<"desktop" | "mobile">("desktop");
  const [publishing, setPublishing] = useState(false);
  const first = useRef(true);

  useEffect(() => {
    if (!getToken()) { router.replace("/login"); return; }
    apiFetch<{ tree?: BuilderNode[]; layout?: unknown[]; primaryColor?: string }>("/website").then((w) => {
      setAccent(w.primaryColor || "#2b6ba4");
      setNodes(Array.isArray(w.tree) && w.tree.length ? w.tree : [newNode("section")]);
      setReady(true);
    }).catch(() => setReady(true));
  }, [router]);

  // Debounced autosave into the draft (same pipeline as the rest of the builder).
  useEffect(() => {
    if (!ready) return;
    if (first.current) { first.current = false; return; }
    setSaved("saving");
    const t = setTimeout(() => {
      apiFetch("/website", { method: "PATCH", body: JSON.stringify({ tree: nodes }) })
        .then(() => setSaved("done")).catch(() => setSaved("idle"));
    }, 700);
    return () => clearTimeout(t);
  }, [nodes, ready]);

  const selectedNode = sel ? findNode(nodes, sel) : null;

  const addElement = useCallback((type: NodeType) => {
    if (type === "section") { const s = newNode("section"); setNodes((ns) => insertNode(ns, null, s)); setSel(s.id); return; }
    setNodes((ns) => {
      let sectionId: string | null = null;
      if (sel) { const cur = findNode(ns, sel); sectionId = cur?.type === "section" ? cur.id : (parentOf(ns, sel) ?? null); }
      const node = newNode(type);
      if (sectionId) { setSel(node.id); return insertNode(ns, sectionId, node); }
      const sec = newNode("section"); const withSec = insertNode(ns, null, sec); setSel(node.id); return insertNode(withSec, sec.id, node);
    });
  }, [sel]);

  const publish = async () => { setPublishing(true); try { await apiFetch("/website/publish", { method: "POST", body: JSON.stringify({ status: "PUBLISHED" }) }); } catch { /* */ } setPublishing(false); };

  if (!ready) return <div className="grid h-full place-items-center text-[13px] text-n400">Loading builder…</div>;

  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* top bar */}
      <div className="flex items-center gap-3 border-b border-n200 bg-white px-4 py-2.5">
        <Link href="/dashboard/website" className="inline-flex items-center gap-1.5 text-[13px] font-medium text-n600 hover:text-n900"><ArrowLeft className="h-4 w-4" />Exit</Link>
        <span className="text-[13px] font-semibold text-n900">Visual builder</span>
        <span className="text-[12px] text-n400">{saved === "saving" ? "Saving…" : saved === "done" ? "All changes staged" : ""}</span>
        <div className="ml-auto flex items-center gap-2">
          <div className="inline-flex rounded-lg border border-n200 p-0.5">
            <button onClick={() => setDevice("desktop")} className={`grid h-7 w-8 place-items-center rounded ${device === "desktop" ? "bg-n100 text-n900" : "text-n500"}`}><Monitor className="h-4 w-4" /></button>
            <button onClick={() => setDevice("mobile")} className={`grid h-7 w-8 place-items-center rounded ${device === "mobile" ? "bg-n100 text-n900" : "text-n500"}`}><Smartphone className="h-4 w-4" /></button>
          </div>
          <button onClick={publish} disabled={publishing} className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-brand px-4 text-[12.5px] font-semibold text-white hover:bg-brand-hover disabled:opacity-60">{publishing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Rocket className="h-3.5 w-3.5" />}Publish</button>
        </div>
      </div>

      <div className="flex min-h-0 flex-1">
        {/* left: palette */}
        <aside className="w-[172px] shrink-0 overflow-y-auto border-r border-n200 bg-white p-3">
          <p className="mb-2 text-[10.5px] font-semibold uppercase tracking-[0.08em] text-n400">Add element</p>
          <div className="space-y-1">
            {ELEMENTS.map((e) => {
              const I = ICON[e.icon] ?? Square;
              return <button key={e.type} onClick={() => addElement(e.type)} className="flex w-full items-center gap-2.5 rounded-lg border border-n200 px-2.5 py-2 text-[12.5px] font-medium text-n700 hover:bg-n50"><I className="h-4 w-4 text-n500" />{e.label}</button>;
            })}
          </div>
        </aside>

        {/* center: canvas */}
        <main onClick={() => setSel(null)} className="min-h-0 flex-1 overflow-y-auto bg-n100 p-6">
          <div className={`mx-auto overflow-hidden rounded-xl border border-n300 bg-white shadow-sm ${device === "mobile" ? "w-[390px]" : "w-full max-w-5xl"}`}>
            {nodes.length === 0 ? <div className="p-16 text-center text-[13px] text-n400">Add a section to begin.</div>
              : nodes.map((node) => <CanvasNode key={node.id} node={node} accent={accent} selected={sel} onSelect={setSel} />)}
          </div>
        </main>

        {/* right: properties */}
        <aside className="w-[280px] shrink-0 overflow-y-auto border-l border-n200 bg-white p-4">
          {!selectedNode ? <p className="text-[12.5px] text-n400">Select an element on the canvas to edit it.</p> : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-[13px] font-semibold text-n900">{elementDef(selectedNode.type)?.label}</p>
                <div className="flex items-center gap-1">
                  <button title="Move up" onClick={() => setNodes((ns) => moveNode(ns, selectedNode.id, -1))} className="grid h-7 w-7 place-items-center rounded text-n500 hover:bg-n100"><ChevronUp className="h-4 w-4" /></button>
                  <button title="Move down" onClick={() => setNodes((ns) => moveNode(ns, selectedNode.id, 1))} className="grid h-7 w-7 place-items-center rounded text-n500 hover:bg-n100"><ChevronDown className="h-4 w-4" /></button>
                  <button title="Duplicate" onClick={() => setNodes((ns) => duplicateNode(ns, selectedNode.id))} className="grid h-7 w-7 place-items-center rounded text-n500 hover:bg-n100"><Copy className="h-3.5 w-3.5" /></button>
                  <button title="Delete" onClick={() => { setNodes((ns) => removeNode(ns, selectedNode.id)); setSel(null); }} className="grid h-7 w-7 place-items-center rounded text-err hover:bg-err-soft"><Trash2 className="h-3.5 w-3.5" /></button>
                </div>
              </div>
              {(elementDef(selectedNode.type)?.controls ?? []).length === 0 && <p className="text-[12px] text-n400">No options for this element.</p>}
              {(elementDef(selectedNode.type)?.controls ?? []).map((c) => (
                <ControlField key={c.key} c={c} value={selectedNode.props?.[c.key]} onChange={(v) => setNodes((ns) => updateNode(ns, selectedNode.id, { [c.key]: v }))} />
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
      {c.type === "textarea" ? <textarea value={str} onChange={(e) => onChange(e.target.value)} rows={4} className={`${input} h-auto py-2 resize-none`} />
        : c.type === "select" ? <select value={str} onChange={(e) => onChange(e.target.value)} className={input}>{(c.options ?? []).map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</select>
        : c.type === "number" ? <input type="number" min={c.min} max={c.max} value={num} onChange={(e) => onChange(Number(e.target.value))} className={input} />
        : c.type === "toggle" ? <label className="flex items-center gap-2 text-[12.5px] text-n600"><input type="checkbox" checked={!!value} onChange={(e) => onChange(e.target.checked)} />Enabled</label>
        : c.type === "color" ? <div className="flex items-center gap-2"><input type="color" value={str || "#000000"} onChange={(e) => onChange(e.target.value)} className="h-9 w-10 rounded border border-n200" /><input value={str} onChange={(e) => onChange(e.target.value)} placeholder="#hex or blank" className={input} /></div>
        : c.type === "image" ? <Uploader value={str} onChange={onChange} label="" aspect="wide" />
        : <input value={str} onChange={(e) => onChange(e.target.value)} placeholder={c.placeholder} className={input} />}
    </div>
  );
}
