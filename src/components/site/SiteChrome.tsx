"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, Phone, MapPin } from "lucide-react";

// lucide dropped brand glyphs — inline simple-icons paths
const SOCIAL_PATHS: Record<string, string> = {
  facebook: "M9.101 23.691v-7.98H6.627v-3.667h2.474v-1.58c0-4.085 1.848-5.978 5.858-5.978.401 0 .955.042 1.468.103a8.68 8.68 0 0 1 1.141.195v3.325a8.623 8.623 0 0 0-.653-.036 26.805 26.805 0 0 0-.733-.009c-.707 0-1.259.096-1.675.309a1.686 1.686 0 0 0-.679.622c-.258.42-.374.995-.374 1.752v1.297h3.919l-.386 2.103-.287 1.564h-3.246v8.245C19.396 23.238 24 18.179 24 12.044c0-6.628-5.373-12-12-12s-12 5.372-12 12c0 5.628 3.874 10.35 9.101 11.647Z",
  instagram: "M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z",
  youtube: "M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z",
  twitter: "M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z",
  linkedin: "M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z",
};
function SocialIcon({ name, className }: { name: string; className?: string }) {
  const d = SOCIAL_PATHS[name];
  return d ? <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden><path d={d} /></svg> : null;
}
import type { SiteConfig } from "@/lib/server/site";
import { accentOf } from "@/lib/server/site";
import { cn } from "@/lib/cn";
import { siteTheme } from "./theme";
import { vertical as verticalDef } from "./verticals";

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

function navItems(config: SiteConfig): { href: string; label: string; external?: boolean }[] {
  const base = `/site/${config.slug}`;
  const def = verticalDef(config.vertical);
  const builtin: Record<string, string> = { home: base, inventory: `${base}/inventory`, financing: `${base}/financing`, about: `${base}/about`, contact: `${base}/contact` };
  // curated menu wins
  if (config.nav && config.nav.length) {
    return config.nav.filter((i) => i.visible !== false).map((i) => {
      if (i.type === "link") return { href: i.value || "#", label: i.label, external: true };
      if (i.type === "page") return { href: `${base}/${i.value ?? ""}`, label: i.label };
      return { href: builtin[i.type] ?? base, label: i.label };
    });
  }
  // default: built-ins + any page flagged inNav (financing only when the vertical uses it)
  const items = [
    { href: base, label: "Home" },
    { href: `${base}/inventory`, label: cap(def.plural) },
    ...(def.market.financeNav ? [{ href: `${base}/financing`, label: def.market.financeNav }] : []),
    { href: `${base}/about`, label: "About" },
    { href: `${base}/contact`, label: "Contact" },
  ];
  for (const p of config.pages ?? []) if (p.inNav) items.push({ href: `${base}/${p.slug}`, label: p.title });
  return items;
}

export function SiteHeader({ config }: { config: SiteConfig }) {
  const accent = accentOf(config.primaryColor);
  const ui = siteTheme(config.template);
  // header color is dealer-controlled: "auto" defers to the template, else light | dark | accent
  const eff = config.headerStyle && config.headerStyle !== "auto" ? config.headerStyle : ui.header;
  const dark = eff !== "light";
  const barBg = eff === "accent" ? accent : eff === "dark" ? "#0a0a0a" : undefined;
  const navActive = eff === "accent" ? "#ffffff" : accent;
  const navIdle = dark ? "rgba(255,255,255,0.82)" : "#334155";
  const btnBg = eff === "accent" ? "#ffffff" : accent;
  const btnColor = eff === "accent" ? accent : "#ffffff";
  const struct = config.template === "INVENTORY_FIRST" || config.template === "SPORT" ? "bold"
    : config.template === "PREMIUM" ? "editorial"
    : config.template === "MINIMAL" ? "minimal"
    : "classic";
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const items = navItems(config);
  const market = verticalDef(config.vertical).market;
  const financeBtn = market.financeBtn;
  const ctaHref = `/site/${config.slug}/${market.headerCtaTo}`;
  const cityLine = [config.city, config.state].filter(Boolean).join(", ");

  // ─── Bespoke overlay chrome — transparent over the hero on the home, solid on inner pages.
  //     Used by the Editorial (PREMIUM) template and the Construction vertical (contractor site). ───
  const overlayChrome = config.template === "PREMIUM" || config.vertical === "CONSTRUCTION";
  if (overlayChrome) {
    const contractor = config.vertical === "CONSTRUCTION";
    const isHome = pathname === `/site/${config.slug}`;
    const solidBg = contractor ? "#17150f" : "#f3efe7";
    const solidFg = contractor ? "#ffffff" : "#1a1714";
    const fg = isHome ? "#ffffff" : solidFg;
    const logoFont = contractor ? "var(--font-display), 'Oswald', sans-serif" : "var(--font-serif), Georgia, serif";
    const DISP = { fontFamily: "var(--font-display), 'Oswald', sans-serif", letterSpacing: "0.24em" } as const;
    return (
      <header className={isHome ? "absolute inset-x-0 top-0 z-30" : "relative z-30 border-b border-black/12"} style={isHome ? undefined : { background: solidBg }}>
        <div className="mx-auto flex max-w-[1400px] items-center justify-between px-6 py-7 sm:px-10">
          <Link href={`/site/${config.slug}`} style={{ color: fg }}>
            {config.logoUrl
              // eslint-disable-next-line @next/next/no-img-element
              ? <img src={config.logoUrl} alt={config.dealershipName} className={cn(({ sm: "h-6", md: "h-9", lg: "h-12", xl: "h-16" } as Record<string, string>)[config.logoScale] ?? "h-9", "w-auto", (isHome || contractor) && "brightness-0 invert")} />
              : <span className={contractor ? "text-[20px] font-bold uppercase tracking-wide" : "text-[19px]"} style={{ fontFamily: logoFont, color: fg }}>{config.dealershipName}</span>}
          </Link>
          <nav className="hidden items-center gap-9 md:flex">
            {items.filter((i) => i.label !== "Home").map((it) => <Link key={it.href} href={it.href} className="text-[11px] uppercase transition hover:opacity-70" style={{ ...DISP, color: fg }}>{it.label}</Link>)}
          </nav>
          <Link href={ctaHref} className="hidden border px-5 py-2.5 text-[10.5px] uppercase transition hover:opacity-70 md:inline-block" style={{ ...DISP, color: fg, borderColor: isHome ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.22)" }}>{financeBtn}</Link>
          <button onClick={() => setOpen((v) => !v)} className="md:hidden" style={{ color: fg }}>{open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}</button>
        </div>
        {open && <div className="border-t border-black/10 px-6 pb-3 md:hidden" style={{ background: solidBg }}>{items.map((it) => <Link key={it.href} href={it.href} onClick={() => setOpen(false)} className="block py-2.5 text-[13px] uppercase" style={{ ...DISP, color: solidFg }}>{it.label}</Link>)}</div>}
      </header>
    );
  }

  const Logo = ({ className }: { className?: string }) => (
    <Link href={`/site/${config.slug}`} className={cn("flex items-center", className)}>
      {config.logoUrl
        // eslint-disable-next-line @next/next/no-img-element
        ? <img src={config.logoUrl} alt={config.dealershipName} className="h-9 w-auto max-w-[180px] object-contain" />
        : <span className={cn("text-[18px] font-extrabold tracking-tight", struct === "editorial" && "font-display text-[19px] font-light uppercase tracking-[0.22em]", dark ? "text-white" : "text-[#0f172a]")}>{config.dealershipName}</span>}
    </Link>
  );
  const navLink = (it: { href: string; label: string; external?: boolean }, extra?: string) => {
    const active = pathname === it.href;
    const base = struct === "bold" ? "font-display text-[13.5px] font-medium uppercase tracking-[0.1em]"
      : struct === "editorial" ? "font-display text-[12px] font-medium uppercase tracking-[0.2em]"
      : struct === "minimal" ? "text-[12.5px] font-medium uppercase tracking-[0.16em]"
      : "text-[14px] font-medium";
    const cls = cn("transition", base, extra);
    if (it.external) return <a key={it.href} href={it.href} target="_blank" rel="noreferrer" className={cls} style={{ color: navIdle }}>{it.label}</a>;
    return <Link key={it.href} href={it.href} className={cls} style={{ color: active ? navActive : navIdle }}>{it.label}</Link>;
  };

  return (
    <header className="sticky top-0 z-40 w-full">
      {/* utility strip — classic light only */}
      {eff === "light" && struct === "classic" && (
        <div className="hidden w-full text-white sm:block" style={{ background: "#0f172a" }}>
          <div className={`mx-auto flex h-9 ${ui.container} items-center gap-5 px-5 text-[12px] text-white/80`}>
            {config.address && <span className="inline-flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" />{config.address}{cityLine ? `, ${cityLine}` : ""}</span>}
            {config.phone && <a href={`tel:${config.phone}`} className="ml-auto inline-flex items-center gap-1.5 hover:text-white"><Phone className="h-3.5 w-3.5" />{config.phone}</a>}
          </div>
        </div>
      )}

      {/* main bar — layout differs per template */}
      <div className={dark ? "w-full" : "w-full border-b border-black/8 bg-white"} style={{ ...(barBg ? { background: barBg } : {}), ...(struct === "bold" ? { borderBottom: `2px solid ${accent}` } : dark ? { borderBottom: "1px solid rgba(255,255,255,0.14)" } : {}) }}>
        {struct === "editorial" ? (
          <div className={`mx-auto flex h-16 ${ui.container} items-center px-5`}>
            <nav className="hidden flex-1 items-center gap-7 lg:flex">{items.slice(0, 2).map((it) => navLink(it))}</nav>
            <Logo className="mx-auto shrink-0" />
            <nav className="hidden flex-1 items-center justify-end gap-7 lg:flex">{items.slice(2).map((it) => navLink(it))}</nav>
            <button onClick={() => setOpen((v) => !v)} className="ml-auto grid h-10 w-10 place-items-center text-white lg:hidden">{open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}</button>
          </div>
        ) : (
          <div className={`mx-auto flex ${struct === "bold" ? "h-[76px]" : "h-16"} ${ui.container} items-center gap-4 px-5`}>
            <Logo />
            <nav className="ml-auto hidden items-center gap-7 lg:flex">{items.map((it) => navLink(it))}</nav>
            <Link href={ctaHref} className={cn("ml-auto hidden px-4 py-2 text-[13.5px] font-semibold lg:ml-4 lg:inline-block", struct === "bold" ? "font-display text-[12.5px] uppercase tracking-[0.08em]" : "rounded-lg")} style={{ background: btnBg, color: btnColor }}>{financeBtn}</Link>
            <button onClick={() => setOpen((v) => !v)} className={cn("ml-auto grid h-10 w-10 place-items-center rounded-lg lg:hidden", dark ? "text-white" : "text-[#334155]")}>{open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}</button>
          </div>
        )}

        {open && (
          <div className={dark ? "lg:hidden" : "border-t border-black/8 bg-white lg:hidden"} style={dark ? { background: barBg ?? "#0a0a0a" } : undefined}>
            <div className={`mx-auto ${ui.container} px-5 py-2`}>
              {items.map((it) => <Link key={it.href} href={it.href} onClick={() => setOpen(false)} className={cn("block py-2.5 text-[15px] font-medium", dark ? "text-white/85" : "text-[#334155]")}>{it.label}</Link>)}
              <Link href={ctaHref} onClick={() => setOpen(false)} className="mt-2 mb-3 block rounded-lg py-2.5 text-center text-[14px] font-semibold" style={{ background: btnBg, color: btnColor }}>{financeBtn}</Link>
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
  const items = navItems(config);
  const cityLine = [config.city, config.state, config.zip].filter(Boolean).join(", ");
  const mapQuery = encodeURIComponent([config.address, cityLine].filter(Boolean).join(", "));

  // Dark typographic footer — matches the Editorial (PREMIUM) and Construction flagship homes
  if (config.template === "PREMIUM" || config.vertical === "CONSTRUCTION") {
    const contractor = config.vertical === "CONSTRUCTION";
    const DISP = { fontFamily: "var(--font-display), 'Oswald', sans-serif", letterSpacing: "0.24em" } as const;
    return (
      <footer className="px-6 py-12 sm:px-10" style={{ background: contractor ? "#17150f" : "#1a1714", color: "rgba(243,239,231,0.6)" }}>
        <div className="mx-auto flex max-w-[1400px] flex-col items-start justify-between gap-5 border-t pt-8 sm:flex-row sm:items-center" style={{ borderColor: "rgba(243,239,231,0.18)" }}>
          <Link href={`/site/${config.slug}`} className={contractor ? "text-[20px] font-bold uppercase tracking-wide" : "text-[19px]"} style={{ fontFamily: contractor ? "var(--font-display), 'Oswald', sans-serif" : "var(--font-serif), Georgia, serif", color: "#f3efe7" }}>{config.dealershipName}</Link>
          <nav className="flex flex-wrap gap-x-8 gap-y-2">{items.filter((i) => i.label !== "Home").map((it) => <Link key={it.href} href={it.href} className="text-[11px] uppercase transition hover:text-[#f3efe7]" style={DISP}>{it.label}</Link>)}</nav>
          <span className="text-[11px] uppercase" style={DISP}>{[config.phone, cityLine].filter(Boolean).join("  ·  ")}</span>
        </div>
      </footer>
    );
  }

  return (
    <footer className="w-full text-white" style={{ background: siteTheme(config.template).band }}>
      <div className={`mx-auto grid ${C} gap-8 px-5 py-12 sm:grid-cols-2 lg:grid-cols-4`}>
        <div>
          <p className="text-[16px] font-bold">{config.dealershipName}</p>
          {config.address && <a href={`https://maps.google.com/?q=${mapQuery}`} target="_blank" rel="noreferrer" className="mt-3 block text-[13px] text-white/70 hover:text-white">{config.address}{cityLine ? `, ${cityLine}` : ""}</a>}
          {config.phone && <a href={`tel:${config.phone}`} className="mt-2 block text-[13px] text-white/70 hover:text-white">{config.phone}</a>}
          {config.email && <a href={`mailto:${config.email}`} className="mt-1 block text-[13px] text-white/70 hover:text-white">{config.email}</a>}
          {(() => {
            const links = ["facebook", "instagram", "youtube", "twitter", "linkedin"].filter((k) => (config.socials?.[k] ?? "").trim());
            return links.length > 0 ? (
              <div className="mt-4 flex gap-2.5">
                {links.map((k) => (
                  <a key={k} href={config.socials[k]} target="_blank" rel="noreferrer" aria-label={k} className="grid h-9 w-9 place-items-center rounded-lg bg-white/10 text-white/80 transition hover:bg-white/20 hover:text-white"><SocialIcon name={k} className="h-4 w-4" /></a>
                ))}
              </div>
            ) : null;
          })()}
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
          <p className="text-[12px] font-semibold uppercase tracking-wide text-white/50">Ready to start?</p>
          <p className="mt-3 text-[13px] text-white/70">Browse our latest {verticalDef(config.vertical).plural} and reach out — we'll take it from there.</p>
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
