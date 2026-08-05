"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Check, Clock, Globe, CalendarDays, Loader2, ArrowLeft, CalendarPlus } from "lucide-react";
import type { SiteConfig } from "@/lib/server/site";
import { accentOf } from "@/lib/server/site";
import { siteTheme } from "./theme";
import { vertical as verticalDef } from "./verticals";

type Api = { slots: string[]; businessTz: string; durationMin: number; noHours?: boolean };
const WD = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const TZ_CHOICES = ["America/New_York", "America/Chicago", "America/Denver", "America/Phoenix", "America/Los_Angeles"];

const keyInTz = (iso: string, tz: string) => new Intl.DateTimeFormat("en-CA", { timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(iso));
const timeInTz = (iso: string, tz: string) => new Intl.DateTimeFormat("en-US", { timeZone: tz, hour: "numeric", minute: "2-digit" }).format(new Date(iso));
const longDay = (key: string) => { const [y, m, d] = key.split("-").map(Number); return new Date(y, m - 1, d).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" }); };
const tzShort = (tz: string, iso: string) => new Intl.DateTimeFormat("en-US", { timeZone: tz, timeZoneName: "short" }).formatToParts(new Date(iso)).find((p) => p.type === "timeZoneName")?.value ?? tz.split("/").pop();

function icsHref(title: string, start: string, durationMin: number, location: string) {
  const dt = (d: Date) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const s = new Date(start); const e = new Date(s.getTime() + durationMin * 60_000);
  const body = ["BEGIN:VCALENDAR", "VERSION:2.0", "BEGIN:VEVENT", `DTSTART:${dt(s)}`, `DTEND:${dt(e)}`, `SUMMARY:${title}`, location ? `LOCATION:${location}` : "", "END:VEVENT", "END:VCALENDAR"].filter(Boolean).join("\r\n");
  return "data:text/calendar;charset=utf-8," + encodeURIComponent(body);
}

export function BookingCalendar({ slug, config, listingId, reschedule }: { slug: string; config: SiteConfig; listingId?: string; reschedule?: { id: string; currentStart?: string } }) {
  const accent = accentOf(config.primaryColor);
  const ui = siteTheme(config.template);
  const def = verticalDef(config.vertical);
  const book = def.bookingLabel.toLowerCase();
  const article = /^[aeiou]/i.test(book) ? "an" : "a";

  const [data, setData] = useState<Api | null>(null);
  const [tz, setTz] = useState<string>("America/Chicago");
  const [view, setView] = useState<{ y: number; m: number }>(() => { const n = new Date(); return { y: n.getFullYear(), m: n.getMonth() }; });
  const [selDate, setSelDate] = useState<string | null>(null);
  const [selSlot, setSelSlot] = useState<string | null>(null);
  const [step, setStep] = useState<"pick" | "details">("pick");
  const [f, setF] = useState({ firstName: "", lastName: "", phone: "", email: "", note: "" });
  const [consent, setConsent] = useState(false);
  const [hp, setHp] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [doneId, setDoneId] = useState<string | null>(null);
  const set = (k: keyof typeof f, v: string) => setF((p) => ({ ...p, [k]: v }));

  useEffect(() => { try { setTz(Intl.DateTimeFormat().resolvedOptions().timeZone || "America/Chicago"); } catch { /* keep default */ } }, []);
  useEffect(() => {
    const q = listingId ? `&listing=${listingId}` : "";
    fetch(`/api/v1/public/site/${slug}/booking?days=21${q}`).then((r) => r.json()).then((d: Api) => setData(d)).catch(() => setData({ slots: [], businessTz: "America/Chicago", durationMin: 30, noHours: true }));
  }, [slug, listingId]);

  const byDate = useMemo(() => {
    const m = new Map<string, string[]>();
    for (const iso of data?.slots ?? []) { const k = keyInTz(iso, tz); (m.get(k) ?? m.set(k, []).get(k)!).push(iso); }
    return m;
  }, [data, tz]);

  const todayKey = keyInTz(new Date().toISOString(), tz);
  const monthCells = useMemo(() => {
    const first = new Date(view.y, view.m, 1);
    const pad = first.getDay();
    const dim = new Date(view.y, view.m + 1, 0).getDate();
    const cells: ({ key: string; day: number; has: boolean; past: boolean } | null)[] = [];
    for (let i = 0; i < pad; i++) cells.push(null);
    for (let d = 1; d <= dim; d++) { const key = `${view.y}-${String(view.m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`; cells.push({ key, day: d, has: byDate.has(key), past: key < todayKey }); }
    return cells;
  }, [view, byDate, todayKey]);

  const daySlots = selDate ? (byDate.get(selDate) ?? []) : [];
  const durationMin = data?.durationMin ?? 30;

  const confirm = async () => {
    if (!selSlot) return;
    setErr(null);
    if (!reschedule) {
      if (!f.firstName.trim()) { setErr("Enter your name."); return; }
      if (!f.phone.trim() && !f.email.trim()) { setErr("Add a phone or email so we can confirm."); return; }
      if (!consent) { setErr("Please agree to be contacted so we can confirm and remind you."); return; }
    }
    setBusy(true);
    try {
      if (reschedule) {
        const r = await fetch(`/api/v1/public/site/${slug}/booking/${reschedule.id}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ start: selSlot }) });
        const j = await r.json(); if (!r.ok) throw new Error(j.error || "Could not reschedule.");
        setDoneId(reschedule.id);
      } else {
        const r = await fetch(`/api/v1/public/site/${slug}/booking`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ start: selSlot, ...f, listingId, consent, hp }) });
        const j = await r.json(); if (!r.ok) throw new Error(j.error || "Could not book that time.");
        setDoneId(j.id);
      }
    } catch (e) { setErr(e instanceof Error ? e.message : "Something went wrong."); }
    finally { setBusy(false); }
  };

  const monthLabel = new Date(view.y, view.m, 1).toLocaleDateString("en-US", { month: "long", year: "numeric" });
  const canPrev = !(view.y === new Date().getFullYear() && view.m <= new Date().getMonth());
  const title = `${config.dealershipName} · ${def.bookingLabel}`;

  /* ── confirmation ── */
  if (doneId) {
    return (
      <div className={`mx-auto ${ui.container} px-5 py-14`}>
        <div className="mx-auto max-w-[560px] rounded-2xl border border-black/8 bg-white p-8 text-center shadow-sm">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-full text-white" style={{ background: accent }}><Check className="h-7 w-7" /></span>
          <h1 className="mt-5 text-[24px] font-bold text-[#0f172a]">{reschedule ? "Rescheduled." : "You're booked."}</h1>
          <p className="mt-2 text-[14.5px] text-[#475569]">
            {selSlot && <><b className="text-[#0f172a]">{longDay(keyInTz(selSlot, tz))}</b> at <b className="text-[#0f172a]">{timeInTz(selSlot, tz)} {tzShort(tz, selSlot)}</b></>} — {config.dealershipName} will confirm the details.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            {selSlot && <a href={icsHref(title, selSlot, durationMin, [config.address, config.city].filter(Boolean).join(", "))} download={`${slug}-booking.ics`} className="inline-flex items-center gap-2 rounded-lg border border-black/12 px-5 py-3 text-[13.5px] font-semibold text-[#334155] hover:bg-black/[0.03]"><CalendarPlus className="h-4 w-4" />Add to calendar</a>}
            <Link href={`/site/${slug}/book/manage/${doneId}`} className="inline-flex items-center gap-2 rounded-lg px-5 py-3 text-[13.5px] font-semibold text-white" style={{ background: accent }}>Manage booking</Link>
          </div>
          <Link href={`/site/${slug}`} className="mt-4 inline-block text-[13px] font-semibold text-[#64748b] hover:text-[#334155]">Back to site</Link>
        </div>
      </div>
    );
  }

  return (
    <div className={`mx-auto ${ui.container} px-5 py-10`}>
      <Link href={reschedule ? `/site/${slug}/book/manage/${reschedule.id}` : `/site/${slug}`} className="inline-flex items-center gap-1 text-[13px] font-semibold text-[#64748b] hover:text-[#334155]"><ChevronLeft className="h-4 w-4" />{reschedule ? "Back" : "Back to site"}</Link>

      <div className="mt-4 overflow-hidden rounded-2xl border border-black/8 bg-white shadow-sm lg:grid lg:grid-cols-[300px_minmax(0,1fr)]">
        {/* left: context */}
        <div className="border-b border-black/8 p-7 lg:border-b-0 lg:border-r">
          <p className="text-[12px] font-semibold uppercase tracking-[0.14em]" style={{ color: accent }}>{config.dealershipName}</p>
          <h1 className={`mt-2 ${ui.display} text-[24px] font-bold leading-tight text-[#0f172a]`}>{reschedule ? "Reschedule" : `Book ${article} ${book}`}</h1>
          <div className="mt-5 space-y-2.5 text-[13.5px] text-[#475569]">
            <p className="flex items-center gap-2.5"><Clock className="h-4 w-4 shrink-0 text-[#94a3b8]" />{durationMin} min</p>
            <div className="flex items-center gap-2.5"><Globe className="h-4 w-4 shrink-0 text-[#94a3b8]" />
              <select value={tz} onChange={(e) => { setTz(e.target.value); setSelDate(null); setSelSlot(null); }} className="min-w-0 flex-1 rounded-md border border-black/10 bg-white px-2 py-1 text-[13px] outline-none">
                {[...new Set([tz, data?.businessTz ?? "America/Chicago", ...TZ_CHOICES])].map((z) => <option key={z} value={z}>{z.replace(/_/g, " ").replace("America/", "")}</option>)}
              </select>
            </div>
            {selSlot && step === "details" && <p className="flex items-center gap-2.5 font-semibold text-[#0f172a]"><CalendarDays className="h-4 w-4 shrink-0" style={{ color: accent }} />{longDay(keyInTz(selSlot, tz))}, {timeInTz(selSlot, tz)}</p>}
          </div>
        </div>

        {/* right: calendar / times / details */}
        <div className="p-7">
          {data === null ? (
            <div className="flex h-[320px] items-center justify-center gap-2 text-[14px] text-[#94a3b8]"><Loader2 className="h-4 w-4 animate-spin" />Loading availability…</div>
          ) : data.noHours ? (
            <div className="flex h-[320px] flex-col items-center justify-center text-center"><CalendarDays className="h-8 w-8 text-[#94a3b8]" /><p className="mt-3 max-w-[36ch] text-[14px] text-[#475569]">Online booking isn&apos;t set up yet. Please <Link href={`/site/${slug}/contact`} className="font-semibold" style={{ color: accent }}>get in touch</Link> and we&apos;ll find a time.</p></div>
          ) : (data.slots.length === 0) ? (
            <div className="flex h-[320px] flex-col items-center justify-center text-center text-[14px] text-[#475569]">No open times in the next few weeks.<Link href={`/site/${slug}/contact`} className="mt-1 font-semibold" style={{ color: accent }}>Contact us to arrange a time →</Link></div>
          ) : step === "details" && selSlot ? (
            <div className="max-w-[420px]">
              <button onClick={() => setStep("pick")} className="mb-4 inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#64748b] hover:text-[#334155]"><ArrowLeft className="h-4 w-4" />Change time</button>
              {reschedule ? (
                <p className="text-[14px] text-[#475569]">Move your {book} to <b className="text-[#0f172a]">{longDay(keyInTz(selSlot, tz))} at {timeInTz(selSlot, tz)}</b>?</p>
              ) : (
                <>
                  <p className="mb-3 text-[15px] font-semibold text-[#0f172a]">Your details</p>
                  <div className="space-y-2.5">
                    <div className="grid grid-cols-2 gap-2.5">
                      <input value={f.firstName} onChange={(e) => set("firstName", e.target.value)} placeholder="First name" className={FIELD} />
                      <input value={f.lastName} onChange={(e) => set("lastName", e.target.value)} placeholder="Last name" className={FIELD} />
                    </div>
                    <input value={f.phone} onChange={(e) => set("phone", e.target.value)} placeholder="Phone" className={FIELD} />
                    <input value={f.email} onChange={(e) => set("email", e.target.value)} placeholder="Email" className={FIELD} />
                    <textarea value={f.note} onChange={(e) => set("note", e.target.value)} rows={3} placeholder="Anything we should know? (optional)" className={`${FIELD} h-auto resize-y py-2`} />
                    <input type="text" name="company" value={hp} onChange={(e) => setHp(e.target.value)} tabIndex={-1} autoComplete="off" aria-hidden="true" style={{ position: "absolute", left: "-9999px", width: 1, height: 1, opacity: 0 }} />
                  </div>
                </>
              )}
              {!reschedule && (
                <label className="mt-3 flex items-start gap-2 text-[11.5px] leading-relaxed text-[#64748b]">
                  <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-0.5 h-4 w-4 shrink-0 rounded border-black/20" style={{ accentColor: accent }} />
                  <span>I agree to receive confirmation and reminder messages about this appointment by text and email. Message/data rates may apply; reply STOP to opt out.</span>
                </label>
              )}
              {err && <p className="mt-2 text-[13px] font-medium text-[#dc2626]">{err}</p>}
              <button onClick={confirm} disabled={busy} className="mt-4 inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg text-[14px] font-semibold text-white transition disabled:opacity-50" style={{ background: accent }}>{busy && <Loader2 className="h-4 w-4 animate-spin" />}{reschedule ? "Confirm new time" : `Book ${book}`}</button>
            </div>
          ) : (
            <div className="grid gap-8 sm:grid-cols-[minmax(0,1fr)_190px]">
              {/* month */}
              <div>
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-[15px] font-semibold text-[#0f172a]">{monthLabel}</p>
                  <div className="flex gap-1">
                    <button disabled={!canPrev} onClick={() => setView((v) => ({ y: v.m === 0 ? v.y - 1 : v.y, m: (v.m + 11) % 12 }))} className="grid h-8 w-8 place-items-center rounded-md border border-black/10 text-[#334155] disabled:opacity-30 hover:enabled:bg-black/[0.03]"><ChevronLeft className="h-4 w-4" /></button>
                    <button onClick={() => setView((v) => ({ y: v.m === 11 ? v.y + 1 : v.y, m: (v.m + 1) % 12 }))} className="grid h-8 w-8 place-items-center rounded-md border border-black/10 text-[#334155] hover:bg-black/[0.03]"><ChevronRight className="h-4 w-4" /></button>
                  </div>
                </div>
                <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-semibold uppercase text-[#94a3b8]">{WD.map((w) => <div key={w} className="py-1">{w[0]}</div>)}</div>
                <div className="mt-1 grid grid-cols-7 gap-1">
                  {monthCells.map((c, i) => c === null ? <div key={i} /> : (
                    <button key={c.key} disabled={!c.has || c.past} onClick={() => { setSelDate(c.key); setSelSlot(null); }}
                      className="grid aspect-square place-items-center rounded-lg text-[13.5px] font-semibold transition disabled:cursor-default"
                      style={selDate === c.key ? { background: accent, color: "#fff" }
                        : c.has && !c.past ? { background: `${accent}14`, color: accent }
                        : { color: "#cbd5e1" }}>{c.day}</button>
                  ))}
                </div>
              </div>
              {/* times */}
              <div className="sm:border-l sm:border-black/8 sm:pl-6">
                {!selDate ? (
                  <p className="pt-2 text-[13px] text-[#94a3b8]">Select a day to see times.</p>
                ) : (
                  <>
                    <p className="mb-2 text-[13px] font-semibold text-[#0f172a]">{longDay(selDate)}</p>
                    <div className="max-h-[300px] space-y-1.5 overflow-y-auto pr-1">
                      {daySlots.map((iso) => (
                        <button key={iso} onClick={() => { setSelSlot(iso); setStep("details"); }} className="block w-full rounded-lg border py-2.5 text-center text-[13.5px] font-semibold transition" style={{ borderColor: `${accent}55`, color: accent }}>{timeInTz(iso, tz)}</button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const FIELD = "h-11 w-full rounded-lg border border-black/12 bg-white px-3 text-[14px] outline-none focus:border-black/30";
