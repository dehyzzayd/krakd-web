"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/cn";
import { apiFetch, getToken } from "@/lib/api";
import { IconBell } from "./AppIcons";

type Tone = "brand" | "ok" | "warn" | "err";
type Notif = { id: string; tone: Tone; title: string; desc: string; time: string; href: string; at: string };

const DOT: Record<Tone, string> = { brand: "bg-brand", ok: "bg-ok", warn: "bg-warn", err: "bg-err" };
const SEEN_KEY = "krakd_notif_seen";

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Notif[]>([]);
  const [seen, setSeen] = useState<string>("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSeen(typeof window !== "undefined" ? localStorage.getItem(SEEN_KEY) ?? "" : "");
    if (!getToken()) return;
    apiFetch<{ items: Notif[] }>("/notifications").then((r) => setItems(r.items ?? [])).catch(() => setItems([]));
  }, []);

  // close on any click/tap outside the bell + panel, and on Escape
  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("pointerdown", onDown, true);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("pointerdown", onDown, true); document.removeEventListener("keydown", onKey); };
  }, [open]);

  const isRead = (n: Notif) => !!seen && n.at <= seen;
  const unread = items.filter((n) => !isRead(n)).length;
  const markAll = () => { const now = new Date().toISOString(); localStorage.setItem(SEEN_KEY, now); setSeen(now); };
  const onOpen = () => { setOpen((v) => { if (!v) markAll(); return !v; }); };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={onOpen}
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
                    onClick={() => setOpen(false)}
                    className={cn(
                      "flex gap-3 border-b border-n200 px-4 py-3 transition last:border-b-0 hover:bg-n50",
                      !isRead(n) && "bg-brand-soft/40",
                    )}
                  >
                    <span className={cn("mt-1.5 h-2 w-2 shrink-0 rounded-full", isRead(n) ? "bg-n300" : DOT[n.tone])} />
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center justify-between gap-2">
                        <span className={cn("truncate text-[13px]", isRead(n) ? "font-medium text-n700" : "font-semibold text-n900")}>{n.title}</span>
                        <span className="tnum shrink-0 text-[11px] text-n400">{n.time}</span>
                      </span>
                      <span className="mt-0.5 block text-[12px] leading-snug text-n500">{n.desc}</span>
                    </span>
                  </Link>
                ))
              )}
            </div>

            <Link
              href="/dashboard/inbox"
              onClick={() => setOpen(false)}
              className="block border-t border-n200 py-2.5 text-center text-[12.5px] font-medium text-brand transition hover:bg-n50"
            >
              Open inbox
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
