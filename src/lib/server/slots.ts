/* Timezone-aware availability engine for public booking.
 * Business hours are wall-clock in the business's timezone; we turn them into
 * real UTC instants, subtract booked appointments (+ buffer), and return ISO
 * instants the client renders in the visitor's own timezone. */

export type Hour = { day: string; open: string; close: string };
export type Busy = { start: Date; end: Date };
const DOW = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export const parseTime = (s: string): number | null => {
  const m = /^(\d{1,2}):(\d{2})\s*(AM|PM)$/i.exec((s ?? "").trim());
  if (!m) return null;
  let h = +m[1] % 12; if (/pm/i.test(m[3])) h += 12;
  return h * 60 + +m[2];
};
export const parseDuration = (s: unknown): number | null => {
  const m = /(\d+)/.exec(String(s ?? ""));
  return m ? +m[1] : null;
};

/** ms offset of `tz` from UTC at a given instant (handles DST). */
function tzOffsetMs(tz: string, at: Date): number {
  const dtf = new Intl.DateTimeFormat("en-US", { timeZone: tz, hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit" });
  const p: Record<string, number> = {};
  for (const part of dtf.formatToParts(at)) if (part.type !== "literal") p[part.type] = +part.value;
  const asUTC = Date.UTC(p.year, p.month - 1, p.day, p.hour === 24 ? 0 : p.hour, p.minute, p.second);
  return asUTC - at.getTime();
}

/** Wall-clock date+minutes in `tz` → the correct UTC instant. */
function zonedToUtc(y: number, m0: number, d: number, minutes: number, tz: string): Date {
  const guess = Date.UTC(y, m0, d, Math.floor(minutes / 60), minutes % 60);
  const off = tzOffsetMs(tz, new Date(guess));
  return new Date(guess - off);
}

/** Today's Y/M/D as seen in `tz`. */
function todayInTz(tz: string, at: Date): { y: number; m0: number; d: number } {
  const dtf = new Intl.DateTimeFormat("en-US", { timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit" });
  const p: Record<string, number> = {};
  for (const part of dtf.formatToParts(at)) if (part.type !== "literal") p[part.type] = +part.value;
  return { y: p.year, m0: p.month - 1, d: p.day };
}

export function computeSlots(opts: {
  hours: Hour[]; tz: string; durationMin: number; bufferMin: number; minNoticeMin: number; days: number; busy: Busy[];
}): string[] {
  const { hours, tz, durationMin, bufferMin, minNoticeMin, days, busy } = opts;
  if (!hours.length) return [];
  const now = new Date();
  const cutoff = now.getTime() + minNoticeMin * 60_000;
  const base = todayInTz(tz, now);
  const step = Math.max(15, durationMin);
  const out: string[] = [];

  for (let i = 0; i < days; i++) {
    const day = new Date(Date.UTC(base.y, base.m0, base.d + i));
    const h = hours.find((x) => x.day === DOW[day.getUTCDay()]);
    const open = h ? parseTime(h.open) : null;
    const close = h ? parseTime(h.close) : null;
    if (open == null || close == null || close <= open) continue;

    for (let mins = open; mins + durationMin <= close; mins += step) {
      const start = zonedToUtc(day.getUTCFullYear(), day.getUTCMonth(), day.getUTCDate(), mins, tz);
      const end = new Date(start.getTime() + durationMin * 60_000);
      if (start.getTime() < cutoff) continue;
      const clash = busy.some((b) => start.getTime() < b.end.getTime() + bufferMin * 60_000 && end.getTime() > b.start.getTime() - bufferMin * 60_000);
      if (clash) continue;
      out.push(start.toISOString());
    }
  }
  return out;
}
