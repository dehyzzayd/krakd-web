"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Check, CalendarDays, Loader2, X } from "lucide-react";
import type { SiteConfig } from "@/lib/server/site";
import { accentOf } from "@/lib/server/site";
import { siteTheme } from "./theme";
import { vertical as verticalDef } from "./verticals";
import { BookingCalendar } from "./BookingCalendar";

type Booking = { id: string; start: string; durationMin: number; status: string; businessTz: string; businessName: string };
const longDay = (iso: string, tz: string) => new Intl.DateTimeFormat("en-US", { timeZone: tz, weekday: "long", month: "long", day: "numeric" }).format(new Date(iso));
const time = (iso: string, tz: string) => new Intl.DateTimeFormat("en-US", { timeZone: tz, hour: "numeric", minute: "2-digit", timeZoneName: "short" }).format(new Date(iso));

export function ManageBooking({ slug, config, id }: { slug: string; config: SiteConfig; id: string }) {
  const accent = accentOf(config.primaryColor);
  const ui = siteTheme(config.template);
  const def = verticalDef(config.vertical);
  const book = def.bookingLabel.toLowerCase();
  const [b, setB] = useState<Booking | null | "missing">(null);
  const [mode, setMode] = useState<"view" | "reschedule">("view");
  const [busy, setBusy] = useState(false);

  const load = () => fetch(`/api/v1/public/site/${slug}/booking/${id}`).then((r) => r.ok ? r.json() : Promise.reject()).then(setB).catch(() => setB("missing"));
  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [slug, id]);

  const cancel = async () => {
    if (!confirm("Cancel this booking?")) return;
    setBusy(true);
    try { await fetch(`/api/v1/public/site/${slug}/booking/${id}`, { method: "DELETE" }); await load(); } finally { setBusy(false); }
  };

  if (mode === "reschedule") return <BookingCalendar slug={slug} config={config} reschedule={{ id }} />;

  if (b === null) return <div className={`mx-auto ${ui.container} flex px-5 py-16 text-[14px] text-[#94a3b8]`}><Loader2 className="mr-2 h-4 w-4 animate-spin" />Loading…</div>;

  return (
    <div className={`mx-auto ${ui.container} px-5 py-14`}>
      <Link href={`/site/${slug}`} className="inline-flex items-center gap-1 text-[13px] font-semibold text-[#64748b] hover:text-[#334155]">← Back to site</Link>
      <div className="mx-auto mt-4 max-w-[560px] rounded-2xl border border-black/8 bg-white p-8 shadow-sm">
        {b === "missing" ? (
          <p className="text-center text-[14px] text-[#475569]">We couldn&apos;t find that booking.</p>
        ) : b.status === "CANCELED" ? (
          <div className="text-center">
            <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-black/5 text-[#64748b]"><X className="h-6 w-6" /></span>
            <h1 className="mt-4 text-[22px] font-bold text-[#0f172a]">Booking cancelled</h1>
            <p className="mt-2 text-[14px] text-[#475569]">This {book} has been cancelled.</p>
            <Link href={`/site/${slug}/book`} className="mt-5 inline-block rounded-lg px-6 py-3 text-[14px] font-semibold text-white" style={{ background: accent }}>Book a new time</Link>
          </div>
        ) : (
          <div className="text-center">
            <span className="mx-auto grid h-12 w-12 place-items-center rounded-full text-white" style={{ background: accent }}><CalendarDays className="h-6 w-6" /></span>
            <h1 className="mt-4 text-[22px] font-bold text-[#0f172a]">Your {book}</h1>
            <p className="mt-2 text-[15px] text-[#0f172a]"><b>{longDay(b.start, b.businessTz)}</b></p>
            <p className="text-[14px] text-[#475569]">{time(b.start, b.businessTz)} · {b.durationMin} min · {b.businessName}</p>
            {b.status === "CONFIRMED" && <p className="mt-2 inline-flex items-center gap-1 text-[12.5px] font-semibold text-emerald-600"><Check className="h-3.5 w-3.5" />Confirmed</p>}
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <button onClick={() => setMode("reschedule")} className="rounded-lg px-5 py-3 text-[13.5px] font-semibold text-white" style={{ background: accent }}>Reschedule</button>
              <button onClick={cancel} disabled={busy} className="rounded-lg border border-black/12 px-5 py-3 text-[13.5px] font-semibold text-[#dc2626] hover:bg-black/[0.03] disabled:opacity-50">Cancel booking</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
