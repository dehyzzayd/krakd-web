"use client";

import { useEffect, useState } from "react";
import { apiFetch, getToken } from "@/lib/api";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/cn";
import { Logo } from "@/components/layout/Logo";
import { useSidebar } from "./SidebarContext";
import { vertical as verticalDef } from "@/components/site/verticals";
import { Settings as SettingsIcon, FileText, Users as UsersIcon, BarChart3 } from "lucide-react";

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
import {
  IconOverview, IconInventory, IconLeads, IconInbox, IconMarketing,
  IconChevron, IconAI, IconWebsite,
} from "./AppIcons";

type Child = { href: string; label: string; logo?: string; connected?: boolean; badge?: number };
type Entry =
  | { type: "item"; href: string; label: string; Icon: (p: { className?: string }) => React.ReactElement; count?: number }
  | { type: "group"; id: string; label: string; Icon: (p: { className?: string }) => React.ReactElement; bases: string[]; children: Child[] };

const NAV: Entry[] = [
  { type: "item", href: "/dashboard", label: "Overview", Icon: IconOverview },
  {
    type: "group", id: "crm", label: "CRM", Icon: IconLeads, bases: ["/dashboard/leads", "/dashboard/crm", "/dashboard/inbox", "/dashboard/appointments"],
    children: [
      { href: "/dashboard/leads", label: "Pipeline" },
      { href: "/dashboard/followups", label: "Follow-ups" },
      { href: "/dashboard/crm/contacts", label: "Contacts" },
      { href: "/dashboard/crm/credit", label: "Credit apps" },
      { href: "/dashboard/inbox", label: "Inbox" },
      { href: "/dashboard/appointments", label: "Calendar" },
    ],
  },
  { type: "item", href: "/dashboard/krakd-ai", label: "Krakd AI", Icon: IconAI },
  { type: "item", href: "/dashboard/inventory", label: "Inventory", Icon: IconInventory },
  { type: "item", href: "/dashboard/website", label: "Website", Icon: IconWebsite },
  {
    type: "group", id: "mk", label: "Digital Marketing", Icon: IconMarketing, bases: ["/dashboard/marketing"],
    children: [
      { href: "/dashboard/marketing", label: "Overview" },
      { href: "/dashboard/marketing/campaigns", label: "Campaigns" },
      { href: "/dashboard/marketing/accounts", label: "Ad accounts" },
    ],
  },
  { type: "item", href: "/dashboard/reports", label: "Reports", Icon: (p: { className?: string }) => <BarChart3 className={p.className} /> },
  { type: "item", href: "/dashboard/team", label: "Team", Icon: (p: { className?: string }) => <UsersIcon className={p.className} /> },
  { type: "item", href: "/dashboard/settings", label: "Settings", Icon: (p: { className?: string }) => <SettingsIcon className={p.className} /> },
];

const MENU = [{ label: "Documentation", href: "/docs" }, { label: "Settings", href: "/dashboard/settings" }];

export function Sidebar() {
  const pathname = usePathname();
  const { collapsed, mobileOpen, setMobileOpen } = useSidebar();
  // close the mobile drawer whenever the route changes
  useEffect(() => { setMobileOpen(false); }, [pathname, setMobileOpen]);
  const [menu, setMenu] = useState(false);
  const [dealer, setDealer] = useState<string | null>(null);
  const [vertical, setVertical] = useState<string>("AUTOMOTIVE");
  useEffect(() => {
    if (!getToken()) return;
    apiFetch<{ dealershipName: string; vertical?: string }>("/overview").then((d) => { setDealer(d.dealershipName); if (d.vertical) setVertical(d.vertical); }).catch(() => {});
  }, []);
  // the inventory nav item speaks the business's language ("Inventory" vs "Listings")
  const invLabel = cap(verticalDef(vertical).plural);
  const auto = vertical === "AUTOMOTIVE";
  const labelFor = (e: Entry) => (e.type === "item" && e.href === "/dashboard/inventory" ? invLabel : e.label);
  // automotive-only CRM children (credit apps) are hidden for other verticals — keep it simple
  const AUTO_ONLY_CHILDREN = new Set(["/dashboard/crm/credit"]);
  // construction gets a Quotes/estimates module, slotted after its Projects (inventory) item
  const navList: Entry[] = vertical === "CONSTRUCTION"
    ? NAV.flatMap((e) => (e.type === "item" && e.href === "/dashboard/inventory"
        ? [e, { type: "item" as const, href: "/dashboard/quotes", label: "Quotes", Icon: (p: { className?: string }) => <FileText className={p.className} /> }]
        : [e]))
    : NAV;
  const dealerName = dealer ?? "Your business";
  const dealerInitials = dealerName.split(/\s+/).filter(Boolean).map((w) => w[0]).slice(0, 2).join("").toUpperCase();
  const [open, setOpen] = useState<Record<string, boolean>>({
    crm: pathname.startsWith("/dashboard/leads") || pathname.startsWith("/dashboard/crm") || pathname.startsWith("/dashboard/inbox") || pathname.startsWith("/dashboard/appointments"),
    mk: pathname.startsWith("/dashboard/marketing"),
  });

  return (
    <>
      {mobileOpen && <div className="fixed inset-0 z-40 bg-black/40 lg:hidden" onClick={() => setMobileOpen(false)} aria-hidden />}
      <aside className={cn(
        "z-50 flex shrink-0 flex-col border-r border-n200 bg-n50",
        "fixed inset-y-0 left-0 h-dvh w-[248px] transition-transform duration-200", // mobile: off-canvas drawer
        mobileOpen ? "translate-x-0 shadow-xl" : "-translate-x-full",
        "lg:static lg:h-full lg:translate-x-0 lg:shadow-none lg:transition-[width]", // desktop: in-flow, fills the shell, never scrolls with the page
        collapsed ? "lg:w-[68px]" : "lg:w-[248px]",
      )}>
      <div className={cn("flex h-16 items-center border-b border-n200", collapsed ? "justify-center px-0" : "px-4")}>
        <Link href="/dashboard" aria-label="Krakd" className={cn(collapsed && "flex h-9 w-9 items-center justify-center rounded-lg hover:bg-n100")}>
          {collapsed ? <span className="whitespace-nowrap text-[18px] font-semibold leading-none tracking-[-0.04em] text-ink">K<span className="text-accent">.</span></span> : <Logo />}
        </Link>
      </div>

      <nav className={cn("flex-1 space-y-0.5 overflow-y-auto py-3", collapsed ? "px-2" : "px-3")}>
        {navList.map((e) => {
          if (e.type === "item") {
            const active = pathname === e.href;
            return (
              <Link key={e.href} href={e.href} title={collapsed ? labelFor(e) : undefined} className={cn("flex items-center rounded-lg text-[13.5px] font-medium transition", collapsed ? "justify-center px-0 py-2.5" : "gap-3 px-3 py-2", active ? "bg-white text-n900 sh-card" : "text-n600 hover:bg-n100 hover:text-n900")}>
                <e.Icon className={cn("h-[18px] w-[18px] shrink-0", active ? "text-brand" : "text-n500")} />
                {!collapsed && (<><span className="flex-1">{labelFor(e)}</span>{e.count != null && <span className={cn("tnum rounded-full px-1.5 py-0.5 text-[11px] font-semibold", active ? "bg-brand-soft text-brand" : "bg-n200 text-n600")}>{e.count}</span>}</>)}
              </Link>
            );
          }
          const groupActive = e.bases.some((b) => pathname.startsWith(b));
          if (collapsed) return <Link key={e.id} href={e.children[0].href} title={e.label} className={cn("flex items-center justify-center rounded-lg px-0 py-2.5 transition", groupActive ? "bg-white sh-card" : "hover:bg-n100")}><e.Icon className={cn("h-[18px] w-[18px]", groupActive ? "text-brand" : "text-n500")} /></Link>;
          const isOpen = open[e.id];
          return (
            <div key={e.id}>
              <button onClick={() => setOpen((o) => (o[e.id] ? {} : { [e.id]: true }))} className={cn("flex w-full items-center gap-3 rounded-lg px-3 py-2 text-[13.5px] font-medium transition", groupActive ? "text-n900" : "text-n600 hover:bg-n100 hover:text-n900")}>
                <e.Icon className={cn("h-[18px] w-[18px] shrink-0", groupActive ? "text-brand" : "text-n500")} />
                <span className="flex-1 text-left">{e.label}</span>
                <IconChevron className={cn("h-4 w-4 text-n400 transition", isOpen && "rotate-180")} />
              </button>
              {isOpen && (
                <div className="mt-0.5 space-y-0.5 pl-4">
                  {e.children.filter((c) => auto || !AUTO_ONLY_CHILDREN.has(c.href)).map((c) => {
                    const active = pathname === c.href;
                    return (
                      <Link key={c.href} href={c.href} className={cn("flex items-center gap-2.5 rounded-lg py-1.5 pl-3 pr-2 text-[13px] font-medium transition", active ? "bg-white text-n900 sh-card" : "text-n600 hover:bg-n100 hover:text-n900")}>
                        <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", active ? "bg-brand" : "bg-n300")} />
                        <span className="flex-1">{c.label}</span>
                        {c.badge ? <span className="tnum rounded-full bg-err px-1.5 text-[10.5px] font-semibold text-white">{c.badge}</span> : null}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      <div className={cn("relative border-t border-n200", collapsed ? "p-2" : "p-3")}>
        {menu && (<>
          <div className="fixed inset-0 z-10" onClick={() => setMenu(false)} aria-hidden />
          <div className={cn("absolute bottom-full z-20 mb-2 w-56 rounded-lg border border-n200 bg-white p-1 sh-raised", collapsed ? "left-2" : "inset-x-3 w-auto")}>
            {MENU.map((m) => <Link key={m.label} href={m.href} className="block rounded-md px-3 py-2 text-[13px] font-medium text-n700 transition hover:bg-n100 hover:text-n900" onClick={() => setMenu(false)}>{m.label}</Link>)}
            <div className="my-1 h-px bg-n200" /><Link href="/login" className="block rounded-md px-3 py-2 text-[13px] font-medium text-err transition hover:bg-err-soft">Log out</Link>
          </div>
        </>)}
        <button onClick={() => setMenu((v) => !v)} title={collapsed ? dealerName : undefined} className={cn("flex w-full items-center rounded-lg border transition", collapsed ? "justify-center border-transparent p-1 hover:bg-n100" : "gap-2.5 px-3 py-2.5", !collapsed && (menu ? "border-n300 bg-white sh-card" : "border-n200 bg-white hover:bg-n100"))}>
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-ink text-[13px] font-semibold text-white">{dealerInitials || "K"}</span>
          {!collapsed && (<><span className="min-w-0 flex-1 text-left"><span className="block truncate text-[13.5px] font-semibold text-n900">{dealerName}</span><span className="block text-[11.5px] text-n500">Dealership</span></span><IconChevron className={cn("h-4 w-4 text-n400 transition", menu && "rotate-180")} /></>)}
        </button>
      </div>
    </aside>
    </>
  );
}
