import Link from "next/link";
import { MapPin, Phone, Clock } from "lucide-react";
import type { SiteConfig, SidebarBlock } from "@/lib/server/site";
import { accentOf } from "@/lib/server/site";
import { LeadForm } from "./LeadForm";

const DEFAULT_BLOCKS: SidebarBlock[] = [
  { id: "d1", type: "contactForm" },
  { id: "d2", type: "address" },
  { id: "d3", type: "hours" },
  { id: "d4", type: "pages" },
];

export function PageSidebar({ config, activeSlug }: { config: SiteConfig; activeSlug?: string }) {
  const accent = accentOf(config.primaryColor);
  const blocks = config.sidebar.length ? config.sidebar : DEFAULT_BLOCKS;
  const cityLine = [config.city, config.state, config.zip].filter(Boolean).join(", ");
  const mapQ = encodeURIComponent([config.address, cityLine].filter(Boolean).join(", "));
  const pages = config.pages.filter((p) => p.showSidebar || p.inNav);

  const Card = ({ title, children }: { title?: string; children: React.ReactNode }) => (
    <div className="rounded-xl border border-black/8 bg-white p-4">{title && <p className="mb-2.5 text-[11px] font-semibold uppercase tracking-wide text-[#94a3b8]">{title}</p>}{children}</div>
  );

  return (
    <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
      {blocks.map((b) => {
        switch (b.type) {
          case "contactForm":
            return <Card key={b.id} title={b.title || "Get in touch"}><LeadForm slug={config.slug} accent={accent} compact /></Card>;
          case "address":
            return config.address ? <Card key={b.id} title={b.title || "Visit us"}><a href={`https://maps.google.com/?q=${mapQ}`} target="_blank" rel="noreferrer" className="flex items-start gap-2 text-[13px] text-[#334155] hover:underline"><MapPin className="mt-0.5 h-4 w-4 shrink-0" style={{ color: accent }} />{config.address}{cityLine ? `, ${cityLine}` : ""}</a></Card> : null;
          case "phone":
            return config.phone ? <Card key={b.id}><a href={`tel:${config.phone}`} className="flex items-center gap-2 text-[13.5px] font-semibold" style={{ color: accent }}><Phone className="h-4 w-4" />{config.phone}</a></Card> : null;
          case "hours":
            return config.hours.length ? <Card key={b.id} title={b.title || "Hours"}><div className="space-y-1">{config.hours.map((h, i) => <div key={i} className="flex justify-between text-[12.5px] text-[#475569]"><span>{h.day}</span><span className="text-[#94a3b8]">{h.open}–{h.close}</span></div>)}</div></Card> : null;
          case "text":
            return <Card key={b.id} title={b.title}><p className="whitespace-pre-wrap text-[13px] leading-relaxed text-[#334155]">{b.body}</p></Card>;
          case "pages":
            return pages.length ? <Card key={b.id} title={b.title || "Pages"}><nav className="space-y-1">{pages.map((x) => { const on = x.slug === activeSlug; return <Link key={x.id} href={`/site/${config.slug}/${x.slug}`} className="block rounded-lg px-3 py-2 text-[13px] font-medium transition" style={on ? { background: accent, color: "#fff" } : { color: "#334155" }}>{x.title}</Link>; })}</nav></Card> : null;
          default:
            return null;
        }
      })}
    </aside>
  );
}
