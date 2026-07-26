"use client";

import Link from "next/link";
import { cn } from "@/lib/cn";
import { Topbar } from "@/components/app/Topbar";
import { useApi } from "@/lib/useApi";
import { Phone, MessageSquare, Mail, Calendar } from "lucide-react";

type Activity = { id: string; type: string; content: string; actor: string; when: string };
type Lead = {
  id: string; name: string; phone: string; email: string; source: string; status: string; statusLabel: string;
  temperature: string; score: number; vehicle: string; assigned: string; hasTradeIn: boolean; financing: boolean; createdAgo: string;
  activities: Activity[]; appointments: { id: string; type: string; status: string; start: string }[];
};

const initials = (n: string) => n.split(/\s+/).filter(Boolean).map((p) => p[0]).slice(0, 2).join("").toUpperCase();
const avatarBg = (n: string) => ["#2b6ba4", "#1f8a65", "#c08532", "#6b5bab", "#b23b5b"][(n.charCodeAt(0) || 0) % 5];
const TEMP: Record<string, string> = { HOT: "bg-err-soft text-err", WARM: "bg-warn-soft text-warn", COLD: "bg-brand-soft text-brand" };

export function LeadDetailClient({ id }: { id: string }) {
  const { data: l, loading, error } = useApi<Lead>(`/leads/${id}`);

  if (loading) return <><Topbar crumbs={[{ label: "Leads", href: "/dashboard/leads" }, { label: "Lead" }]} /><div className="p-12 text-center text-[13px] text-n400">Loading…</div></>;
  if (error || !l) return <><Topbar crumbs={[{ label: "Leads", href: "/dashboard/leads" }, { label: "Not found" }]} /><div className="p-16 text-center"><p className="text-[14px] font-semibold text-n800">Lead not found</p><Link href="/dashboard/leads" className="mt-3 inline-block text-[13px] font-semibold text-brand">← Back to leads</Link></div></>;

  return (
    <div className="app-scope flex min-h-dvh flex-col bg-white">
      <Topbar crumbs={[{ label: "Leads", href: "/dashboard/leads" }, { label: l.name }]} />
      <div className="grid w-full grid-cols-1 gap-4 px-6 py-5 xl:grid-cols-[minmax(0,1.6fr)_360px]">
        <div className="space-y-4">
          <div className="rounded-2xl border border-n200 bg-white p-5 sh-card">
            <div className="flex items-center gap-3.5">
              <span className="grid h-14 w-14 shrink-0 place-items-center rounded-full text-[18px] font-semibold text-white" style={{ background: avatarBg(l.name) }}>{initials(l.name)}</span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2"><h1 className="text-[20px] font-bold tracking-[-0.02em] text-n900">{l.name}</h1><span className={cn("rounded-full px-2 py-0.5 text-[11px] font-semibold", TEMP[l.temperature] ?? "bg-n100 text-n600")}>{l.temperature[0] + l.temperature.slice(1).toLowerCase()}</span></div>
                <p className="text-[12.5px] text-n500">Interested in {l.vehicle} · via {l.source}</p>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {[[Phone, "Call", l.phone ? `tel:${l.phone}` : undefined], [MessageSquare, "Text", undefined], [Mail, "Email", l.email ? `mailto:${l.email}` : undefined], [Calendar, "Schedule", undefined]].map(([Icon, label, href], i) => {
                const I = Icon as React.ComponentType<{ className?: string }>;
                const cls = "flex h-9 items-center justify-center gap-1.5 rounded-lg border border-n200 bg-white text-[12.5px] font-semibold text-n700 transition hover:bg-n50";
                return href ? <a key={i} href={href as string} className={cls}><I className="h-3.5 w-3.5" />{label as string}</a> : <button key={i} className={cls}><I className="h-3.5 w-3.5" />{label as string}</button>;
              })}
            </div>
          </div>

          <div className="rounded-2xl border border-n200 bg-white p-5 sh-card">
            <h3 className="text-[14px] font-semibold text-n900">Activity timeline</h3>
            {l.activities.length === 0
              ? <p className="mt-3 text-[12.5px] text-n500">No activity yet. Krakd AI logs every text, call and status change here.</p>
              : (
                <div className="mt-3 space-y-3">
                  {l.activities.map((a) => (
                    <div key={a.id} className="flex gap-2.5 border-t border-n100 pt-3 first:border-t-0 first:pt-0">
                      <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-brand" />
                      <div className="min-w-0 flex-1"><p className="text-[12.5px] font-medium text-n900">{a.type}{a.actor === "AI" ? " · Krakd AI" : ""}</p>{a.content && <p className="text-[12px] text-n600">{a.content}</p>}</div>
                      <span className="shrink-0 text-[11px] text-n400">{a.when}</span>
                    </div>
                  ))}
                </div>
              )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl border border-n200 bg-white p-5 sh-card">
            <h3 className="text-[13px] font-semibold text-n900">Lead details</h3>
            <div className="mt-3 space-y-2.5 text-[12.5px]">
              {[["Status", l.statusLabel], ["Assigned", l.assigned], ["Score", String(l.score)], ["Phone", l.phone || "—"], ["Email", l.email || "—"], ["Source", l.source], ["Trade-in", l.hasTradeIn ? "Yes" : "No"], ["Financing", l.financing ? "Yes" : "No"], ["Added", l.createdAgo]].map(([k, v]) => (
                <div key={k} className="flex justify-between gap-3"><span className="text-n500">{k}</span><span className="truncate font-medium text-n900">{v}</span></div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-n200 bg-white p-5 sh-card">
            <h3 className="text-[13px] font-semibold text-n900">Appointments</h3>
            {l.appointments.length === 0
              ? <p className="mt-2 text-[12.5px] text-n500">None scheduled yet.</p>
              : <div className="mt-3 space-y-2">{l.appointments.map((a) => <div key={a.id} className="rounded-lg border border-n200 p-2.5 text-[12.5px]"><p className="font-medium text-n900">{a.type.replace("_", " ").toLowerCase()}</p><p className="tnum text-n500">{new Date(a.start).toLocaleString()}</p></div>)}</div>}
          </div>
        </div>
      </div>
    </div>
  );
}
