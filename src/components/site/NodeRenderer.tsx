import Link from "next/link";
import type { BuilderNode } from "@/lib/builder/types";

/* Renders an advanced-builder node tree to React. Used for the public site now and (with
 * selection wrappers) the editor canvas later. Pure + stateless so the public render stays
 * fast, SEO-clean and cacheable. Unknown node types render nothing. */

type Ctx = { accent: string };

const num = (v: unknown, d: number) => (typeof v === "number" ? v : d);
const str = (v: unknown) => (typeof v === "string" ? v : undefined);

function NodeView({ node, ctx }: { node: BuilderNode; ctx: Ctx }) {
  const p = node.props ?? {};
  const kids = (node.children ?? []).map((c) => <NodeView key={c.id} node={c} ctx={ctx} />);

  switch (node.type) {
    case "section":
      return <section className="mx-auto max-w-6xl px-5" style={{ paddingTop: num(p.paddingY, 40), paddingBottom: num(p.paddingY, 40), background: str(p.bg) || undefined }}>{kids}</section>;
    case "columns":
      return <div className="grid sm:[grid-template-columns:var(--cols)]" style={{ ["--cols" as string]: `repeat(${Math.max(1, (node.children ?? []).length)}, minmax(0,1fr))`, gap: num(p.gap, 24) }}>{kids}</div>;
    case "column":
      return <div className="space-y-3">{kids}</div>;
    case "heading":
      return <h2 className="text-[28px] font-bold tracking-tight text-[#0f172a]" style={{ textAlign: (str(p.align) as "left" | "center" | "right") ?? "left" }}>{str(p.text) ?? ""}</h2>;
    case "text":
      return <p className="text-[15px] leading-relaxed text-[#475569]">{str(p.text) ?? ""}</p>;
    case "richText":
      return <p className="whitespace-pre-line text-[15px] leading-relaxed text-[#475569]">{str(p.text) ?? ""}</p>;
    case "image":
      return str(p.src)
        ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={str(p.src)} alt={str(p.alt) ?? ""} className="w-full rounded-2xl object-cover" />
        : <div className="aspect-[4/3] w-full rounded-2xl bg-black/5" />;
    case "button": {
      const href = str(p.href) || "#";
      const cls = "inline-flex items-center rounded-full px-6 py-3 text-[14px] font-semibold text-white";
      return /^https?:\/\//.test(href)
        ? <a href={href} target="_blank" rel="noreferrer" className={cls} style={{ background: ctx.accent }}>{str(p.label) ?? "Learn more"}</a>
        : <Link href={href} className={cls} style={{ background: ctx.accent }}>{str(p.label) ?? "Learn more"}</Link>;
    }
    case "spacer":
      return <div style={{ height: num(p.height, 32) }} />;
    case "divider":
      return <hr className="border-black/10" />;
    default:
      return null;
  }
}

export function NodeRenderer({ nodes, accent }: { nodes: BuilderNode[]; accent: string }) {
  if (!nodes?.length) return null;
  return <div>{nodes.map((n) => <NodeView key={n.id} node={n} ctx={{ accent }} />)}</div>;
}
