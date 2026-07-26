"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, Phone, MapPin } from "lucide-react";
import type { SiteConfig } from "@/lib/server/site";
import { accentOf } from "@/lib/server/site";
import { siteTheme } from "./theme";

function navItems(slug: string) {
  const base = `/site/${slug}`;
  return [
    { href: base, label: "Home" },
    { href: `${base}/inventory`, label: "Inventory" },
    { href: `${base}/financing`, label: "Financing" },
    { href: `${base}/about`, label: "About" },
    { href: `${base}/contact`, label: "Contact" },
  ];
}

export function SiteHeader({ config }: { config: SiteConfig }) {
  const accent = accentOf(config.primaryColor);
  const ui = siteTheme(config.template);
  const dark = ui.header === "dark";
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const items = navItems(config.slug);
  const cityLine = [config.city, config.state].filter(Boolean).join(", ");

  return (
    <header className="sticky top-0 z-40 w-full">
      {/* utility strip (light headers only) */}
      {!dark && (
        <div className="hidden w-full text-white sm:block" style={{ background: "#0f172a" }}>
          <div className={`mx-auto flex h-9 ${ui.container} items-center gap-5 px-5 text-[12px] text-white/80`}>
            {config.address && <span className="inline-flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" />{config.address}{cityLine ? `, ${cityLine}` : ""}</span>}
            {config.phone && <a href={`tel:${config.phone}`} className="ml-auto inline-flex items-center gap-1.5 hover:text-white"><Phone className="h-3.5 w-3.5" />{config.phone}</a>}
          </div>
        </div>
      )}
      {/* main bar */}
      <div className={dark ? "w-full border-b border-white/10" : "w-full border-b border-black/8 bg-white"} style={dark ? { background: "#0f172a" } : undefined}>
        <div className={`mx-auto flex ${dark ? "h-[68px]" : "h-16"} ${ui.container} items-center gap-4 px-5`}>
          <Link href={`/site/${config.slug}`} className="flex items-center gap-2.5">
            {config.logoUrl
              // eslint-disable-next-line @next/next/no-img-element
              ? <img src={config.logoUrl} alt={config.dealershipName} className="h-9 w-auto max-w-[180px] object-contain" />
              : <span className={`text-[18px] font-extrabold tracking-tight ${dark ? "text-white" : "text-[#0f172a]"}`}>{config.dealershipName}</span>}
          </Link>
          <nav className="ml-auto hidden items-center gap-7 lg:flex">
            {items.map((it) => {
              const active = pathname === it.href;
              return <Link key={it.href} href={it.href} className="text-[14px] font-medium transition" style={{ color: active ? accent : dark ? "rgba(255,255,255,0.82)" : "#334155" }}>{it.label}</Link>;
            })}
          </nav>
          <Link href={`/site/${config.slug}/financing`} className="ml-auto hidden rounded-lg px-4 py-2 text-[13.5px] font-semibold text-white lg:ml-4 lg:inline-block" style={{ background: accent }}>Get financing</Link>
          <button onClick={() => setOpen((v) => !v)} className={`ml-auto grid h-10 w-10 place-items-center rounded-lg lg:hidden ${dark ? "text-white" : "text-[#334155]"}`}>{open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}</button>
        </div>
        {open && (
          <div className={dark ? "border-t border-white/10 lg:hidden" : "border-t border-black/8 bg-white lg:hidden"} style={dark ? { background: "#0f172a" } : undefined}>
            <div className={`mx-auto ${ui.container} px-5 py-2`}>
              {items.map((it) => <Link key={it.href} href={it.href} onClick={() => setOpen(false)} className={`block py-2.5 text-[15px] font-medium ${dark ? "text-white/85" : "text-[#334155]"}`}>{it.label}</Link>)}
              <Link href={`/site/${config.slug}/financing`} onClick={() => setOpen(false)} className="mt-2 mb-3 block rounded-lg py-2.5 text-center text-[14px] font-semibold text-white" style={{ background: accent }}>Get financing</Link>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}

export function SiteFooter({ config }: { config: SiteConfig }) {
  const accent = accentOf(config.primaryColor);
  const C = siteTheme(config.template).container;
  const items = navItems(config.slug);
  const cityLine = [config.city, config.state, config.zip].filter(Boolean).join(", ");
  const mapQuery = encodeURIComponent([config.address, cityLine].filter(Boolean).join(", "));

  return (
    <footer className="w-full text-white" style={{ background: "#0f172a" }}>
      <div className={`mx-auto grid ${C} gap-8 px-5 py-12 sm:grid-cols-2 lg:grid-cols-4`}>
        <div>
          <p className="text-[16px] font-bold">{config.dealershipName}</p>
          {config.address && <a href={`https://maps.google.com/?q=${mapQuery}`} target="_blank" rel="noreferrer" className="mt-3 block text-[13px] text-white/70 hover:text-white">{config.address}{cityLine ? `, ${cityLine}` : ""}</a>}
          {config.phone && <a href={`tel:${config.phone}`} className="mt-2 block text-[13px] text-white/70 hover:text-white">{config.phone}</a>}
          {config.email && <a href={`mailto:${config.email}`} className="mt-1 block text-[13px] text-white/70 hover:text-white">{config.email}</a>}
        </div>
        <div>
          <p className="text-[12px] font-semibold uppercase tracking-wide text-white/50">Explore</p>
          <div className="mt-3 space-y-2">{items.map((it) => <Link key={it.href} href={it.href} className="block text-[13px] text-white/70 hover:text-white">{it.label}</Link>)}</div>
        </div>
        <div>
          <p className="text-[12px] font-semibold uppercase tracking-wide text-white/50">Hours</p>
          <div className="mt-3 space-y-1.5">
            {config.hours.length ? config.hours.map((h, i) => <div key={i} className="flex justify-between gap-4 text-[13px] text-white/70"><span>{h.day}</span><span>{h.open}–{h.close}</span></div>) : <p className="text-[13px] text-white/50">Call for hours</p>}
          </div>
        </div>
        <div>
          <p className="text-[12px] font-semibold uppercase tracking-wide text-white/50">Ready to drive?</p>
          <p className="mt-3 text-[13px] text-white/70">Browse our latest inventory and get pre-qualified in minutes.</p>
          <Link href={`/site/${config.slug}/inventory`} className="mt-3 inline-block rounded-lg px-4 py-2 text-[13px] font-semibold text-white" style={{ background: accent }}>View inventory</Link>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className={`mx-auto flex ${C} flex-wrap items-center justify-between gap-2 px-5 py-4 text-[12px] text-white/50`}>
          <span>© {config.dealershipName}. All rights reserved.</span>
          <span>Powered by Krakd</span>
        </div>
      </div>
    </footer>
  );
}
