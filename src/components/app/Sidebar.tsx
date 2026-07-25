"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/cn";
import { Logo } from "@/components/layout/Logo";
import { useSidebar } from "./SidebarContext";
import { NETWORKS } from "@/lib/marketing";
import {
  IconOverview, IconInventory, IconLeads, IconInbox, IconMarketing,
  IconCalendar, IconReports, IconChevron,
} from "./AppIcons";

const TOP = [
  { href: "/dashboard", label: "Overview", Icon: IconOverview },
  { href: "/dashboard/inventory", label: "Inventory", Icon: IconInventory, count: 214 },
  { href: "/dashboard/leads", label: "Leads", Icon: IconLeads, count: 37 },
  { href: "/dashboard/inbox", label: "Inbox", Icon: IconInbox, count: 5 },
];
const BOTTOM = [
  { href: "/dashboard/appointments", label: "Appointments", Icon: IconCalendar },
  { href: "/dashboard/reports", label: "Reports", Icon: IconReports },
];
const MK_CHILDREN = [
  { href: "/dashboard/marketing", label: "Overview", logo: null },
  ...NETWORKS.map((n) => ({ href: `/dashboard/marketing/${n.id}`, label: n.name, logo: n.logo, connected: n.connected })),
];

const MENU = [
  { label: "Documentation", href: "/docs" },
  { label: "Settings", href: "/dashboard/settings" },
];

function Item({ href, label, Icon, count, active, collapsed }: {
  href: string; label: string; Icon: (p: { className?: string }) => React.ReactElement; count?: number; active: boolean; collapsed: boolean;
}) {
  return (
    <Link
      href={href}
      title={collapsed ? label : undefined}
      className={cn(
        "flex items-center rounded-lg text-[13.5px] font-medium transition",
        collapsed ? "justify-center px-0 py-2.5" : "gap-3 px-3 py-2",
        active ? "bg-white text-n900 sh-card" : "text-n600 hover:bg-n100 hover:text-n900",
      )}
    >
      <Icon className={cn("h-[18px] w-[18px] shrink-0", active ? "text-brand" : "text-n500")} />
      {!collapsed && (
        <>
          <span className="flex-1">{label}</span>
          {count != null && (
            <span className={cn("tnum rounded-full px-1.5 py-0.5 text-[11px] font-semibold", active ? "bg-brand-soft text-brand" : "bg-n200 text-n600")}>{count}</span>
          )}
        </>
      )}
    </Link>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const { collapsed } = useSidebar();
  const [open, setOpen] = useState(false);
  const mkActive = pathname.startsWith("/dashboard/marketing");
  const [mkOpen, setMkOpen] = useState(mkActive);

  return (
    <aside
      className={cn(
        "sticky top-0 hidden h-dvh shrink-0 flex-col self-start border-r border-n200 bg-n50 transition-[width] duration-200 lg:flex",
        collapsed ? "w-[68px]" : "w-[248px]",
      )}
    >
      {/* brand */}
      <div className={cn("flex h-14 items-center border-b border-n200", collapsed ? "justify-center px-0" : "px-4")}>
        <Link href="/dashboard" aria-label="Krakd" className={cn(collapsed && "flex h-9 w-9 items-center justify-center rounded-lg hover:bg-n100")}>
          {collapsed
            ? <span className="whitespace-nowrap text-[18px] font-semibold leading-none tracking-[-0.04em] text-ink">K<span className="text-accent">.</span></span>
            : <Logo />}
        </Link>
      </div>

      {/* nav */}
      <nav className={cn("flex-1 space-y-0.5 overflow-y-auto py-3", collapsed ? "px-2" : "px-3")}>
        {TOP.map((n) => <Item key={n.href} {...n} active={pathname === n.href} collapsed={collapsed} />)}

        {/* Digital Marketing group */}
        {collapsed ? (
          <Item href="/dashboard/marketing" label="Digital Marketing" Icon={IconMarketing} active={mkActive} collapsed />
        ) : (
          <div>
            <button
              onClick={() => setMkOpen((v) => !v)}
              className={cn("flex w-full items-center gap-3 rounded-lg px-3 py-2 text-[13.5px] font-medium transition", mkActive ? "text-n900" : "text-n600 hover:bg-n100 hover:text-n900")}
            >
              <IconMarketing className={cn("h-[18px] w-[18px] shrink-0", mkActive ? "text-brand" : "text-n500")} />
              <span className="flex-1 text-left">Digital Marketing</span>
              <IconChevron className={cn("h-4 w-4 text-n400 transition", mkOpen && "rotate-180")} />
            </button>
            {mkOpen && (
              <div className="mt-0.5 space-y-0.5 pl-4">
                {MK_CHILDREN.map((c) => {
                  const active = pathname === c.href;
                  return (
                    <Link
                      key={c.href}
                      href={c.href}
                      className={cn("flex items-center gap-2.5 rounded-lg py-1.5 pl-3 pr-2 text-[13px] font-medium transition", active ? "bg-white text-n900 sh-card" : "text-n600 hover:bg-n100 hover:text-n900")}
                    >
                      {c.logo ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={c.logo} alt="" width={16} height={16} className={cn("h-4 w-4 shrink-0", !c.connected && "opacity-40 grayscale")} />
                      ) : (
                        <span className="grid h-4 w-4 shrink-0 place-items-center"><span className="h-1.5 w-1.5 rounded-[3px] bg-n400" /></span>
                      )}
                      <span className="flex-1">{c.label}</span>
                      {c.logo && !c.connected && <span className="text-[10px] font-semibold uppercase tracking-wide text-n400">Connect</span>}
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {BOTTOM.map((n) => <Item key={n.href} {...n} active={pathname === n.href} collapsed={collapsed} />)}
      </nav>

      {/* account */}
      <div className={cn("relative border-t border-n200", collapsed ? "p-2" : "p-3")}>
        {open && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} aria-hidden />
            <div className={cn("absolute bottom-full z-20 mb-2 w-56 rounded-lg border border-n200 bg-white p-1 sh-raised", collapsed ? "left-2" : "inset-x-3 w-auto")}>
              {MENU.map((m) => (
                <Link key={m.label} href={m.href} className="block rounded-md px-3 py-2 text-[13px] font-medium text-n700 transition hover:bg-n100 hover:text-n900" onClick={() => setOpen(false)}>{m.label}</Link>
              ))}
              <div className="my-1 h-px bg-n200" />
              <Link href="/login" className="block rounded-md px-3 py-2 text-[13px] font-medium text-err transition hover:bg-err-soft">Log out</Link>
            </div>
          </>
        )}
        <button
          onClick={() => setOpen((v) => !v)}
          title={collapsed ? "Downtown Auto" : undefined}
          className={cn("flex w-full items-center rounded-lg border transition", collapsed ? "justify-center border-transparent p-1 hover:bg-n100" : "gap-2.5 px-3 py-2.5", !collapsed && (open ? "border-n300 bg-white sh-card" : "border-n200 bg-white hover:bg-n100"))}
        >
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-ink text-[13px] font-semibold text-white">DA</span>
          {!collapsed && (
            <>
              <span className="min-w-0 flex-1 text-left">
                <span className="block truncate text-[13.5px] font-semibold text-n900">Downtown Auto</span>
                <span className="block text-[11.5px] text-n500">Independent lot</span>
              </span>
              <IconChevron className={cn("h-4 w-4 text-n400 transition", open && "rotate-180")} />
            </>
          )}
        </button>
      </div>
    </aside>
  );
}
