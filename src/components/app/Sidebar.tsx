"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/cn";
import { Logo } from "@/components/layout/Logo";
import { useSidebar } from "./SidebarContext";
import { NETWORKS } from "@/lib/marketing";
import { inboxUnread } from "@/lib/crm";
import {
  IconOverview, IconInventory, IconLeads, IconInbox, IconMarketing,
  IconReports, IconChevron,
} from "./AppIcons";

const unread = inboxUnread();

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
      { href: "/dashboard/crm/contacts", label: "Contacts" },
      { href: "/dashboard/crm/credit", label: "Credit apps" },
      { href: "/dashboard/inbox", label: "Inbox", badge: unread },
      { href: "/dashboard/appointments", label: "Calendar" },
    ],
  },
  { type: "item", href: "/dashboard/inventory", label: "Inventory", Icon: IconInventory, count: 214 },
  {
    type: "group", id: "mk", label: "Digital Marketing", Icon: IconMarketing, bases: ["/dashboard/marketing"],
    children: [
      { href: "/dashboard/marketing", label: "Overview" },
      ...NETWORKS.map((n) => ({ href: `/dashboard/marketing/${n.id}`, label: n.name, logo: n.logo, connected: n.connected })),
    ],
  },
  { type: "item", href: "/dashboard/reports", label: "Reports", Icon: IconReports },
];

const MENU = [{ label: "Documentation", href: "/docs" }, { label: "Settings", href: "/dashboard/settings" }];

export function Sidebar() {
  const pathname = usePathname();
  const { collapsed } = useSidebar();
  const [menu, setMenu] = useState(false);
  const [open, setOpen] = useState<Record<string, boolean>>({
    crm: pathname.startsWith("/dashboard/leads") || pathname.startsWith("/dashboard/crm") || pathname.startsWith("/dashboard/inbox") || pathname.startsWith("/dashboard/appointments"),
    mk: pathname.startsWith("/dashboard/marketing"),
  });

  return (
    <aside className={cn("sticky top-0 hidden h-dvh shrink-0 flex-col self-start border-r border-n200 bg-n50 transition-[width] duration-200 lg:flex", collapsed ? "w-[68px]" : "w-[248px]")}>
      <div className={cn("flex h-14 items-center border-b border-n200", collapsed ? "justify-center px-0" : "px-4")}>
        <Link href="/dashboard" aria-label="Krakd" className={cn(collapsed && "flex h-9 w-9 items-center justify-center rounded-lg hover:bg-n100")}>
          {collapsed ? <span className="whitespace-nowrap text-[18px] font-semibold leading-none tracking-[-0.04em] text-ink">K<span className="text-accent">.</span></span> : <Logo />}
        </Link>
      </div>

      <nav className={cn("flex-1 space-y-0.5 overflow-y-auto py-3", collapsed ? "px-2" : "px-3")}>
        {NAV.map((e) => {
          if (e.type === "item") {
            const active = pathname === e.href;
            return (
              <Link key={e.href} href={e.href} title={collapsed ? e.label : undefined} className={cn("flex items-center rounded-lg text-[13.5px] font-medium transition", collapsed ? "justify-center px-0 py-2.5" : "gap-3 px-3 py-2", active ? "bg-white text-n900 sh-card" : "text-n600 hover:bg-n100 hover:text-n900")}>
                <e.Icon className={cn("h-[18px] w-[18px] shrink-0", active ? "text-brand" : "text-n500")} />
                {!collapsed && (<><span className="flex-1">{e.label}</span>{e.count != null && <span className={cn("tnum rounded-full px-1.5 py-0.5 text-[11px] font-semibold", active ? "bg-brand-soft text-brand" : "bg-n200 text-n600")}>{e.count}</span>}</>)}
              </Link>
            );
          }
          const groupActive = e.bases.some((b) => pathname.startsWith(b));
          if (collapsed) return <Link key={e.id} href={e.children[0].href} title={e.label} className={cn("flex items-center justify-center rounded-lg px-0 py-2.5 transition", groupActive ? "bg-white sh-card" : "hover:bg-n100")}><e.Icon className={cn("h-[18px] w-[18px]", groupActive ? "text-brand" : "text-n500")} /></Link>;
          const isOpen = open[e.id];
          return (
            <div key={e.id}>
              <button onClick={() => setOpen((o) => ({ ...o, [e.id]: !o[e.id] }))} className={cn("flex w-full items-center gap-3 rounded-lg px-3 py-2 text-[13.5px] font-medium transition", groupActive ? "text-n900" : "text-n600 hover:bg-n100 hover:text-n900")}>
                <e.Icon className={cn("h-[18px] w-[18px] shrink-0", groupActive ? "text-brand" : "text-n500")} />
                <span className="flex-1 text-left">{e.label}</span>
                <IconChevron className={cn("h-4 w-4 text-n400 transition", isOpen && "rotate-180")} />
              </button>
              {isOpen && (
                <div className="mt-0.5 space-y-0.5 pl-4">
                  {e.children.map((c) => {
                    const active = pathname === c.href;
                    return (
                      <Link key={c.href} href={c.href} className={cn("flex items-center gap-2.5 rounded-lg py-1.5 pl-3 pr-2 text-[13px] font-medium transition", active ? "bg-white text-n900 sh-card" : "text-n600 hover:bg-n100 hover:text-n900")}>
                        {c.logo
                          // eslint-disable-next-line @next/next/no-img-element
                          ? <img src={c.logo} alt="" className={cn("h-4 w-4 shrink-0", !c.connected && "opacity-40 grayscale")} />
                          : <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", active ? "bg-brand" : "bg-n300")} />}
                        <span className="flex-1">{c.label}</span>
                        {c.badge ? <span className="tnum rounded-full bg-err px-1.5 text-[10.5px] font-semibold text-white">{c.badge}</span> : null}
                        {c.logo && !c.connected && <span className="text-[10px] font-semibold uppercase tracking-wide text-n400">Connect</span>}
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
        <button onClick={() => setMenu((v) => !v)} title={collapsed ? "Downtown Auto" : undefined} className={cn("flex w-full items-center rounded-lg border transition", collapsed ? "justify-center border-transparent p-1 hover:bg-n100" : "gap-2.5 px-3 py-2.5", !collapsed && (menu ? "border-n300 bg-white sh-card" : "border-n200 bg-white hover:bg-n100"))}>
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-ink text-[13px] font-semibold text-white">DA</span>
          {!collapsed && (<><span className="min-w-0 flex-1 text-left"><span className="block truncate text-[13.5px] font-semibold text-n900">Downtown Auto</span><span className="block text-[11.5px] text-n500">Independent lot</span></span><IconChevron className={cn("h-4 w-4 text-n400 transition", menu && "rotate-180")} /></>)}
        </button>
      </div>
    </aside>
  );
}
