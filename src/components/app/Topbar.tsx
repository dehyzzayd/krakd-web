"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { useSidebar } from "./SidebarContext";
import { NotificationBell } from "./NotificationBell";
import { IconSearch, IconPlus, IconPanel } from "./AppIcons";

/** App top bar — sidebar toggle, breadcrumbs/title, search, notifications. */
export function Topbar({
  title,
  crumbs,
  action,
}: {
  title?: string;
  crumbs?: { label: string; href?: string }[];
  action?: { label: string; href?: string; onClick?: () => void };
}) {
  const { toggle } = useSidebar();

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-[#e4e7ec] bg-n50/85 px-4 backdrop-blur sm:px-5">
      <button
        onClick={toggle}
        aria-label="Toggle sidebar"
        className="hidden h-9 w-9 place-items-center rounded-lg text-n500 transition hover:bg-n100 hover:text-n800 lg:grid"
      >
        <IconPanel className="h-[18px] w-[18px]" />
      </button>
      {crumbs ? (
        <nav className="flex items-center gap-1.5 text-[14px]">
          {crumbs.map((c, i) => (
            <span key={i} className="flex items-center gap-1.5">
              {i > 0 && <span className="text-n300">/</span>}
              {c.href ? <Link href={c.href} className="font-medium text-n500 transition hover:text-n800">{c.label}</Link> : <span className="font-semibold text-n900">{c.label}</span>}
            </span>
          ))}
        </nav>
      ) : (
        <h1 className="text-[15px] font-semibold text-n900">{title}</h1>
      )}

      <div className="relative ml-auto hidden w-[280px] md:block">
        <IconSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-n400" />
        <input
          placeholder="Search leads, contacts…"
          className="h-9 w-full rounded-lg border border-n200 bg-white pl-9 pr-3 text-[13px] text-n800 outline-none transition placeholder:text-n400 focus:border-brand focus:ring-2 focus:ring-brand/15"
        />
      </div>

      <div className="ml-auto md:ml-0">
        <NotificationBell />
      </div>

      {action && (action.href ? (
        <Link href={action.href} className="btn-brand inline-flex h-9 items-center gap-1.5 rounded-lg px-3.5 text-[13px] font-semibold text-white transition">
          <IconPlus className="h-[16px] w-[16px]" />
          <span className="hidden sm:inline">{action.label}</span>
        </Link>
      ) : (
        <button onClick={action.onClick} className="btn-brand inline-flex h-9 items-center gap-1.5 rounded-lg px-3.5 text-[13px] font-semibold transition">
          <IconPlus className="h-[16px] w-[16px]" />
          <span className="hidden sm:inline">{action.label}</span>
        </button>
      ))}
    </header>
  );
}

export function AppMain({ children }: { children: ReactNode }) {
  return <div className="w-full px-6 py-6">{children}</div>;
}
