"use client";

import { useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/cn";
import { IconBell } from "./AppIcons";

type Tone = "brand" | "ok" | "warn" | "err";
type Notif = {
  id: number;
  tone: Tone;
  title: string;
  desc: string;
  time: string;
  href: string;
  read: boolean;
};

const SEED: Notif[] = [
  { id: 1, tone: "brand", title: "New lead — Marcus Reed", desc: "Facebook Ads · asking about the 2023 Silverado", time: "2m", href: "/dashboard/leads", read: false },
  { id: 2, tone: "ok", title: "AI booked a test drive", desc: "Priya Shah · Saturday at 2:00 PM", time: "18m", href: "/dashboard/appointments", read: false },
  { id: 3, tone: "warn", title: "Vehicle missing photos", desc: "2020 Ram 1500 · listed with no images", time: "1h", href: "/dashboard/inventory", read: false },
  { id: 4, tone: "warn", title: "Price drop suggested", desc: "2021 Model 3 → $27,450 to stay competitive", time: "3h", href: "/dashboard/inventory", read: true },
  { id: 5, tone: "ok", title: "Deal funded", desc: "2019 BMW 4 Series · $25,300", time: "5h", href: "/dashboard/leads", read: true },
  { id: 6, tone: "err", title: "Aging alert", desc: "16 units over 45 days on the lot", time: "1d", href: "/dashboard/inventory", read: true },
];

const DOT: Record<Tone, string> = { brand: "bg-brand", ok: "bg-ok", warn: "bg-warn", err: "bg-err" };

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Notif[]>(SEED);
  const unread = items.filter((n) => !n.read).length;

  const markRead = (id: number) => setItems((xs) => xs.map((n) => (n.id === id ? { ...n, read: true } : n)));
  const markAll = () => setItems((xs) => xs.map((n) => ({ ...n, read: true })));

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Notifications"
        aria-expanded={open}
        className={cn(
          "grid h-9 w-9 place-items-center rounded-lg border transition",
          open ? "border-n300 bg-n100 text-n900" : "border-n200 bg-white text-n600 hover:bg-n100",
        )}
      >
        <span className="relative">
          <IconBell className="h-[18px] w-[18px]" />
          {unread > 0 && (
            <span className="absolute -right-1 -top-1 grid h-[15px] min-w-[15px] place-items-center rounded-full bg-err px-1 text-[9px] font-semibold text-white ring-2 ring-white">
              {unread}
            </span>
          )}
        </span>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} aria-hidden />
          <div className="absolute right-0 z-50 mt-2 w-[360px] max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl border border-n200 bg-white sh-raised">
            <div className="flex items-center justify-between border-b border-n200 px-4 py-3">
              <div className="flex items-center gap-2">
                <h3 className="text-[13.5px] font-semibold text-n900">Notifications</h3>
                {unread > 0 && (
                  <span className="tnum rounded-full bg-brand-soft px-1.5 py-0.5 text-[11px] font-semibold text-brand">{unread} new</span>
                )}
              </div>
              <button
                onClick={markAll}
                disabled={unread === 0}
                className="text-[12.5px] font-medium text-brand transition hover:text-brand-hover disabled:text-n400"
              >
                Mark all read
              </button>
            </div>

            <div className="max-h-[380px] overflow-y-auto">
              {items.length === 0 ? (
                <p className="px-4 py-10 text-center text-[13px] text-n500">You&apos;re all caught up.</p>
              ) : (
                items.map((n) => (
                  <Link
                    key={n.id}
                    href={n.href}
                    onClick={() => { markRead(n.id); setOpen(false); }}
                    className={cn(
                      "flex gap-3 border-b border-n200 px-4 py-3 transition last:border-b-0 hover:bg-n50",
                      !n.read && "bg-brand-soft/40",
                    )}
                  >
                    <span className={cn("mt-1.5 h-2 w-2 shrink-0 rounded-full", n.read ? "bg-n300" : DOT[n.tone])} />
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center justify-between gap-2">
                        <span className={cn("truncate text-[13px]", n.read ? "font-medium text-n700" : "font-semibold text-n900")}>{n.title}</span>
                        <span className="tnum shrink-0 text-[11px] text-n400">{n.time}</span>
                      </span>
                      <span className="mt-0.5 block text-[12px] leading-snug text-n500">{n.desc}</span>
                    </span>
                  </Link>
                ))
              )}
            </div>

            <Link
              href="/dashboard/notifications"
              onClick={() => setOpen(false)}
              className="block border-t border-n200 py-2.5 text-center text-[12.5px] font-medium text-brand transition hover:bg-n50"
            >
              View all notifications
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
