"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useApi } from "@/lib/useApi";
import { apiFetch, ApiError } from "@/lib/api";
import { cn } from "@/lib/cn";
import { ChevronLeft, MessageSquare, Boxes, Megaphone, Globe, Users } from "lucide-react";

type Profile = {
  id: string; name: string; city: string | null; state: string | null; status: string; health: number; attention: string[]; owner: string; createdAt: string;
  subscription: { status: string; priceCents: number; renewsAt: string | null };
  admin: { name: string; email: string; lastLogin: string } | null;
  services: {
    crm: { leads: number; appointments: number; aiEnabled: boolean };
    inventory: { count: number; lastSync: string; missingPhotos: number };
    ads: { budgetCents: number; feeCents: number; netCents: number; campaigns: number; channels: string[] };
    website: { template: string | null; live: boolean; domain: string | null; domainStatus: string; renewsAt: string | null };
    users: { total: number; seats: number };
  };
  billing: { priceCents: number; status: string; payments: { id: string; type: string; status: string; amountCents: number; description: string | null; when: string }[] };
  activity: { id: string; type: string; content: string; actor: string; when: string }[];
};
const money = (c: number) => `$${Math.round(c / 100).toLocaleString()}`;
const healthTone = (h: number) => (h >= 80 ? "text-ok" : h >= 50 ? "text-warn" : "text-err");
const TABS = ["Overview", "Services", "Billing", "Activity"] as const;

export default function ClientProfile() {
  const { id } = useParams<{ id: string }>();
  const { data: c, loading, reload } = useApi<Profile>(`/admin/clients/${id}`);
  const [tab, setTab] = useState<string>("Overview");
  const [busy, setBusy] = useState(false);

  const setStatus = async (status: string) => {
    if (!confirm(`${status === "SUSPENDED" ? "Suspend" : "Reactivate"} this client?`)) return;
    setBusy(true);
    try { await apiFetch(`/admin/clients/${id}`, { method: "PATCH", body: JSON.stringify({ status }) }); reload(); }
    catch (e) { alert(e instanceof ApiError ? e.message : "Failed"); } finally { setBusy(false); }
  };

  if (loading && !c) return <div className="p-12 text-center text-[13px] text-n400">Loading…</div>;
  if (!c) return <div className="p-12 text-center"><p className="text-[14px] font-semibold text-n800">Client not found</p><Link href="/admin/clients" className="mt-2 inline-block text-[13px] font-semibold text-brand">← All clients</Link></div>;

  const Card = ({ icon: Icon, title, sub, children }: { icon: React.ComponentType<{ className?: string }>; title: string; sub: string; children?: React.ReactNode }) => (
    <div className="rounded-2xl border border-n200 bg-white p-4 sh-card">
      <div className="flex items-center gap-2.5"><span className="grid h-9 w-9 place-items-center rounded-lg bg-brand-soft text-brand"><Icon className="h-4.5 w-4.5" /></span><div><p className="text-[13.5px] font-semibold text-n900">{title}</p><p className="text-[12px] text-n500">{sub}</p></div></div>
      {children && <div className="mt-3">{children}</div>}
    </div>
  );

  return (
    <div className="mx-auto max-w-[1160px] px-6 py-6">
      <Link href="/admin/clients" className="inline-flex items-center gap-1 text-[13px] font-semibold text-n500 hover:text-n800"><ChevronLeft className="h-4 w-4" />Clients</Link>

      <div className="mt-3 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-[24px] font-bold tracking-tight text-n900">{c.name}</h1>
          <p className="text-[12.5px] text-n500">{[c.city, c.state].filter(Boolean).join(", ") || "—"} · Owner: {c.owner} · Joined {new Date(c.createdAt).toLocaleDateString()}</p>
        </div>
        <div className="flex items-center gap-2">
          {c.status === "SUSPENDED"
            ? <button disabled={busy} onClick={() => setStatus("ACTIVE")} className="h-9 rounded-lg bg-ok px-4 text-[12.5px] font-semibold text-white disabled:opacity-60">Reactivate</button>
            : <button disabled={busy} onClick={() => setStatus("SUSPENDED")} className="h-9 rounded-lg border border-n200 bg-white px-4 text-[12.5px] font-semibold text-err hover:bg-err-soft disabled:opacity-60">Suspend</button>}
        </div>
      </div>

      {/* KPI row */}
      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[["Platform", `${money(c.subscription.priceCents)}/mo`, c.subscription.status.replace("_", " ").toLowerCase()], ["Users", `${c.services.users.total}`, `${c.services.users.seats} seats`], ["Website", c.services.website.live ? "Live" : "Draft", c.services.website.domain ?? "no domain"], ["Health", `${c.health}/100`, c.attention.length ? `${c.attention.length} issue${c.attention.length > 1 ? "s" : ""}` : "No critical issues"]].map(([l, v, s], i) => (
          <div key={l} className="rounded-2xl border border-n200 bg-white p-4 sh-card"><p className="text-[11px] font-medium uppercase tracking-[0.04em] text-n500">{l}</p><p className={cn("mt-1 text-[18px] font-bold", i === 3 ? healthTone(c.health) : "text-n900")}>{v}</p><p className="mt-0.5 text-[11.5px] capitalize text-n400">{s}</p></div>
        ))}
      </div>

      {/* tabs */}
      <div className="mt-5 flex gap-1 border-b border-n200">
        {TABS.map((t) => <button key={t} onClick={() => setTab(t)} className={cn("-mb-px border-b-2 px-3 py-2.5 text-[13px] font-medium transition", tab === t ? "border-brand text-n900" : "border-transparent text-n500 hover:text-n800")}>{t}</button>)}
      </div>

      <div className="mt-5">
        {tab === "Overview" && (
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,340px)]">
            <div className="grid gap-3 sm:grid-cols-2">
              <Card icon={MessageSquare} title="CRM & Krakd AI" sub={`${c.services.crm.leads} leads · ${c.services.crm.appointments} appts`} />
              <Card icon={Boxes} title="Inventory" sub={c.services.inventory.count ? `${c.services.inventory.count} live · synced ${c.services.inventory.lastSync}` : "No inventory"} />
              <Card icon={Megaphone} title="Digital advertising" sub={c.services.ads.campaigns ? `${money(c.services.ads.budgetCents)} budget · ${money(c.services.ads.netCents)} media` : "No active campaigns"} />
              <Card icon={Globe} title="Dealer website" sub={c.services.website.live ? `${c.services.website.template} · ${c.services.website.domain ?? "krakd URL"}` : "Not published"} />
            </div>
            <div className="rounded-2xl border border-n200 bg-white p-5 sh-card">
              <h3 className="text-[13px] font-semibold text-n900">Account alerts</h3>
              {c.attention.length === 0 ? <p className="mt-2 text-[12.5px] text-ok">No critical issues — all services operational.</p>
                : <ul className="mt-2 space-y-1.5">{c.attention.map((a) => <li key={a} className="flex items-center gap-2 text-[12.5px] text-n700"><span className="h-1.5 w-1.5 rounded-full bg-err" />{a}</li>)}</ul>}
            </div>
          </div>
        )}

        {tab === "Services" && (
          <div className="grid gap-4 sm:grid-cols-2">
            <Card icon={MessageSquare} title="CRM & Krakd AI" sub="Lead capture and automation"><div className="space-y-1.5 text-[12.5px] text-n600"><Row k="Leads" v={`${c.services.crm.leads}`} /><Row k="Appointments" v={`${c.services.crm.appointments}`} /><Row k="AI follow-up" v={c.services.crm.aiEnabled ? "Enabled" : "Off"} /></div></Card>
            <Card icon={Boxes} title="Inventory" sub="Live vehicles and sync"><div className="space-y-1.5 text-[12.5px] text-n600"><Row k="Live vehicles" v={`${c.services.inventory.count}`} /><Row k="Last sync" v={c.services.inventory.lastSync} /><Row k="Missing photos" v={`${c.services.inventory.missingPhotos}`} tone={c.services.inventory.missingPhotos > 0 ? "warn" : undefined} /></div></Card>
            <Card icon={Megaphone} title="Digital advertising" sub="Budget, fee and net media"><div className="space-y-1.5 text-[12.5px] text-n600"><Row k="Selected budget" v={money(c.services.ads.budgetCents)} /><Row k="Krakd fee (10%)" v={money(c.services.ads.feeCents)} /><Row k="Net media spend" v={money(c.services.ads.netCents)} /><Row k="Channels" v={c.services.ads.channels.join(", ") || "—"} /></div></Card>
            <Card icon={Globe} title="Website & domain" sub="Template, publication, domain"><div className="space-y-1.5 text-[12.5px] text-n600"><Row k="Template" v={c.services.website.template ?? "—"} /><Row k="Published" v={c.services.website.live ? "Yes" : "No"} /><Row k="Domain" v={c.services.website.domain ?? "krakd URL"} /><Row k="Domain status" v={c.services.website.domainStatus.replace("_", " ").toLowerCase()} /></div></Card>
            <Card icon={Users} title="Account users" sub="Seats in the current package"><div className="space-y-1.5 text-[12.5px] text-n600"><Row k="Users" v={`${c.services.users.total}`} /><Row k="Seats" v={`${c.services.users.seats}`} /></div></Card>
          </div>
        )}

        {tab === "Billing" && (
          <div className="space-y-4">
            <div className="rounded-2xl border border-n200 bg-white p-5 sh-card">
              <h3 className="mb-3 text-[13px] font-semibold text-n900">Commercial breakdown</h3>
              <div className="grid gap-3 sm:grid-cols-4">
                {[["Subscription", money(c.billing.priceCents), "per month"], ["Selected ad budget", money(c.services.ads.budgetCents), "client-selected"], ["Krakd fee (10%)", money(c.services.ads.feeCents), "management"], ["Net media spend", money(c.services.ads.netCents), "to channels"]].map(([l, v, s]) => (
                  <div key={l} className="rounded-xl border border-n200 p-3"><p className="text-[11px] uppercase tracking-wide text-n500">{l}</p><p className="tnum mt-1 text-[16px] font-bold text-n900">{v}</p><p className="text-[11px] text-n400">{s}</p></div>
                ))}
              </div>
              <p className="mt-3 text-[11.5px] text-n400">Client charge = selected ad budget + $149 subscription. Media spend is always shown net of the Krakd fee.</p>
            </div>
            <div className="rounded-2xl border border-n200 bg-white p-5 sh-card">
              <h3 className="mb-3 text-[13px] font-semibold text-n900">Payments</h3>
              {c.billing.payments.length === 0 ? <p className="text-[12.5px] text-n500">No payments recorded.</p>
                : <div className="space-y-2">{c.billing.payments.map((p) => <div key={p.id} className="flex items-center justify-between border-b border-n100 pb-2 text-[12.5px] last:border-0"><span className="text-n700">{p.description || p.type.replace("_", " ")}</span><span className="flex items-center gap-3"><span className={cn("rounded-full px-2 py-0.5 text-[10.5px] font-semibold", p.status === "SUCCEEDED" ? "bg-ok-soft text-ok" : p.status === "FAILED" ? "bg-err-soft text-err" : "bg-n100 text-n600")}>{p.status.toLowerCase()}</span><span className="tnum font-semibold text-n900">{money(p.amountCents)}</span><span className="text-n400">{p.when}</span></span></div>)}</div>}
            </div>
          </div>
        )}

        {tab === "Activity" && (
          <div className="rounded-2xl border border-n200 bg-white p-5 sh-card">
            <h3 className="mb-3 text-[13px] font-semibold text-n900">Recent activity</h3>
            {c.activity.length === 0 ? <p className="text-[12.5px] text-n500">No recent activity.</p>
              : <div className="space-y-3">{c.activity.map((a) => <div key={a.id} className="flex gap-2.5 border-b border-n100 pb-3 last:border-0"><span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-brand" /><div className="min-w-0 flex-1"><p className="text-[12.5px] font-medium text-n900">{a.type}{a.actor === "AI" ? " · Krakd AI" : ""}</p>{a.content && <p className="truncate text-[12px] text-n600">{a.content}</p>}</div><span className="shrink-0 text-[11px] text-n400">{a.when}</span></div>)}</div>}
          </div>
        )}
      </div>
    </div>
  );
}

function Row({ k, v, tone }: { k: string; v: string; tone?: "warn" }) {
  return <div className="flex justify-between"><span className="text-n500">{k}</span><span className={cn("font-medium", tone === "warn" ? "text-warn" : "text-n900")}>{v}</span></div>;
}
