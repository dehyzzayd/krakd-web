import type { ReactNode } from "react";
import { Topbar, AppMain } from "@/components/app/Topbar";

/* ── primitives ─────────────────────────────────────────────────────── */

function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-[10px] border border-n200 bg-white sh-card ${className}`}>{children}</div>;
}
function CardHead({ title, right }: { title: string; right?: ReactNode }) {
  return (
    <div className="flex items-center justify-between border-b border-n200 px-4 py-3">
      <h2 className="text-[13.5px] font-semibold text-n900">{title}</h2>
      {right}
    </div>
  );
}

type Tone = "brand" | "ok" | "warn" | "err" | "neutral";
const TONES: Record<Tone, string> = {
  brand: "bg-brand-soft text-brand",
  ok: "bg-ok-soft text-ok",
  warn: "bg-warn-soft text-warn",
  err: "bg-err-soft text-err",
  neutral: "bg-n100 text-n600",
};
function Badge({ children, tone = "neutral" }: { children: ReactNode; tone?: Tone }) {
  return <span className={`inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[11.5px] font-medium ${TONES[tone]}`}>{children}</span>;
}
function Dot({ tone }: { tone: Tone }) {
  const c = { brand: "bg-brand", ok: "bg-ok", warn: "bg-warn", err: "bg-err", neutral: "bg-n400" }[tone];
  return <span className={`h-1.5 w-1.5 rounded-full ${c}`} />;
}

/* ── data ───────────────────────────────────────────────────────────── */

const KPIS = [
  { label: "Gross · MTD", value: "$148,320", delta: "+14%", tone: "ok" as Tone },
  { label: "Units sold · MTD", value: "28", delta: "+3", tone: "ok" as Tone },
  { label: "Active leads", value: "142", delta: "+12%", tone: "ok" as Tone },
  { label: "Appts today", value: "9", delta: "3 confirmed", tone: "neutral" as Tone },
];

const GROSS = [4.1, 6.8, 5.2, 3.9, 7.4, 8.1, 6.2, 5.6, 9.1, 7.7, 8.8, 6.9, 10.2, 9.4];

const LEADS = [
  { name: "Marcus Reed", source: "Facebook", vehicle: "2023 Silverado", status: "Hot", tone: "err" as Tone, owner: "AI", time: "2m" },
  { name: "Priya Shah", source: "Cars.com", vehicle: "2021 Model 3", status: "Appt set", tone: "ok" as Tone, owner: "Dana", time: "18m" },
  { name: "Luis Ortega", source: "Website", vehicle: "2020 Ram 1500", status: "Working", tone: "warn" as Tone, owner: "AI", time: "41m" },
  { name: "Kayla Brooks", source: "AutoTrader", vehicle: "2022 CR-V", status: "New", tone: "brand" as Tone, owner: "—", time: "1h" },
  { name: "Sam Whitfield", source: "Referral", vehicle: "2019 BMW 4", status: "Working", tone: "warn" as Tone, owner: "Marco", time: "2h" },
  { name: "Nina Alvarez", source: "CarGurus", vehicle: "2023 Tacoma", status: "Hot", tone: "err" as Tone, owner: "AI", time: "3h" },
];

const AI_FEED = [
  ["Texted Marcus R.", "replied 6s", "ok" as Tone],
  ["Booked test drive — Sat 2:00", "Priya S.", "brand" as Tone],
  ["Qualified · 720 score", "financing ready", "ok" as Tone],
  ["Repriced 2021 Model 3", "→ $27,450", "warn" as Tone],
  ["Answered call · routed to Finance", "Luis O.", "brand" as Tone],
];

const AGING = [
  { label: "Fresh · <15d", n: 96, tone: "ok" as Tone, w: "45%" },
  { label: "Active · 15–30d", n: 71, tone: "brand" as Tone, w: "33%" },
  { label: "Aging · 30–45d", n: 31, tone: "warn" as Tone, w: "14%" },
  { label: "Stale · 45d+", n: 16, tone: "err" as Tone, w: "8%" },
];

/* ── chart ──────────────────────────────────────────────────────────── */

function GrossChart() {
  const max = Math.max(...GROSS);
  const W = 640, H = 150;
  const stepX = W / (GROSS.length - 1);
  const pts = GROSS.map((v, i) => `${i * stepX},${H - (v / max) * (H - 12) - 6}`).join(" ");
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-[150px] w-full" preserveAspectRatio="none" aria-hidden>
      <defs>
        <linearGradient id="gr" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#3c7cab" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#3c7cab" stopOpacity="0" />
        </linearGradient>
      </defs>
      {[0.25, 0.5, 0.75].map((g) => (
        <line key={g} x1="0" y1={H * g} x2={W} y2={H * g} stroke="#e4e4e4" strokeWidth="1" strokeDasharray="2 4" />
      ))}
      <polyline fill="url(#gr)" stroke="none" points={`0,${H} ${pts} ${W},${H}`} />
      <polyline fill="none" stroke="#3c7cab" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" points={pts} />
    </svg>
  );
}

/* ── page ───────────────────────────────────────────────────────────── */

export default function DashboardPage() {
  return (
    <>
      <Topbar title="Overview" action={{ label: "Add vehicle" }} />
      <AppMain>
        {/* subheader */}
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <p className="text-[13.5px] text-n600">
            Here&apos;s how <span className="font-semibold text-n900">Downtown Auto</span> is doing today.
          </p>
          <div className="flex items-center gap-2">
            {["Today", "7d", "30d"].map((r, i) => (
              <button key={r} className={`h-8 rounded-lg px-3 text-[12.5px] font-medium transition ${i === 2 ? "bg-white text-n900 border border-n200 sh-card" : "text-n600 hover:bg-n100"}`}>{r}</button>
            ))}
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {KPIS.map((k) => (
            <Card key={k.label} className="p-4">
              <p className="text-[11.5px] font-medium uppercase tracking-[0.04em] text-n500">{k.label}</p>
              <div className="mt-2 flex items-end justify-between">
                <span className="tnum text-[26px] font-semibold leading-none text-n900">{k.value}</span>
                <Badge tone={k.tone}>{k.tone === "ok" && <span className="text-ok">▲</span>}{k.delta}</Badge>
              </div>
            </Card>
          ))}
        </div>

        {/* chart + AI */}
        <div className="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHead
              title="Gross revenue"
              right={<div className="flex items-center gap-3 text-[12px] text-n500"><span className="tnum font-semibold text-n900">$148,320</span><span>·</span><span>avg $10.6k/day</span></div>}
            />
            <div className="p-4">
              <GrossChart />
              <div className="tnum mt-2 flex justify-between text-[11px] text-n400">
                <span>Jul 12</span><span>Jul 19</span><span>Jul 25</span>
              </div>
            </div>
          </Card>

          <Card>
            <CardHead title="Krakd AI · pipeline" right={<Badge tone="ok"><Dot tone="ok" />Working</Badge>} />
            <div className="p-4">
              <p className="text-[13px] text-n700">
                <span className="font-semibold text-n900">37 leads</span> worked today —{" "}
                <span className="font-semibold text-n900">12 booked</span>, 4 need you.
              </p>
              <div className="mt-3 space-y-0">
                {AI_FEED.map(([a, b, tone]) => (
                  <div key={a as string} className="flex items-center gap-2.5 border-t border-n200 py-2.5 first:border-t-0">
                    <Dot tone={tone as Tone} />
                    <span className="flex-1 text-[12.5px] text-n800">{a}</span>
                    <span className="tnum text-[11.5px] text-n400">{b}</span>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </div>

        {/* leads + aging */}
        <div className="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHead title="Recent leads" right={<a href="/dashboard/leads" className="text-[12.5px] font-medium text-brand hover:text-brand-hover">View all</a>} />
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-[11px] uppercase tracking-[0.04em] text-n500">
                    <th className="px-4 py-2 font-medium">Customer</th>
                    <th className="px-3 py-2 font-medium">Source</th>
                    <th className="px-3 py-2 font-medium">Vehicle</th>
                    <th className="px-3 py-2 font-medium">Status</th>
                    <th className="px-3 py-2 font-medium">Owner</th>
                    <th className="px-4 py-2 text-right font-medium">Updated</th>
                  </tr>
                </thead>
                <tbody>
                  {LEADS.map((l) => (
                    <tr key={l.name} className="border-t border-n200 transition hover:bg-n50">
                      <td className="px-4 py-2.5 text-[13px] font-medium text-n900">{l.name}</td>
                      <td className="px-3 py-2.5 text-[13px] text-n600">{l.source}</td>
                      <td className="px-3 py-2.5 text-[13px] text-n700">{l.vehicle}</td>
                      <td className="px-3 py-2.5"><Badge tone={l.tone}><Dot tone={l.tone} />{l.status}</Badge></td>
                      <td className="px-3 py-2.5 text-[13px] text-n600">{l.owner}</td>
                      <td className="tnum px-4 py-2.5 text-right text-[12.5px] text-n400">{l.time}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          <Card>
            <CardHead title="Inventory aging" right={<span className="tnum text-[12px] text-n500">214 units · 18d avg</span>} />
            <div className="p-4">
              <div className="mb-4 flex h-2.5 overflow-hidden rounded-full">
                {AGING.map((a) => (
                  <span key={a.label} className={{ brand: "bg-brand", ok: "bg-ok", warn: "bg-warn", err: "bg-err", neutral: "bg-n400" }[a.tone]} style={{ width: a.w }} />
                ))}
              </div>
              <div className="space-y-2.5">
                {AGING.map((a) => (
                  <div key={a.label} className="flex items-center gap-2.5">
                    <Dot tone={a.tone} />
                    <span className="flex-1 text-[12.5px] text-n700">{a.label}</span>
                    <span className="tnum text-[12.5px] font-semibold text-n900">{a.n}</span>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </div>
      </AppMain>
    </>
  );
}
