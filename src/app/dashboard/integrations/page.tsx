"use client";

import { useMemo, useState, type ReactNode } from "react";
import { Topbar, AppMain } from "@/components/app/Topbar";
import { Card } from "@/components/app/AppKit";
import { Sheet } from "@/components/app/Sheet";
import { cn } from "@/lib/cn";
import { apiFetch, ApiError } from "@/lib/api";
import { useApi } from "@/lib/useApi";
import { useToast } from "@/components/app/Toast";
import { INTEGRATIONS, CATEGORY_LABEL, byId, type IntegrationDef, type IntegrationsRecord, type ProviderConfig } from "@/lib/integrations";
import { Check, Users, CreditCard, Clock } from "lucide-react";

type Sub = { status: "active" | "scheduled_cancel" | "expired"; priceCents: number; periodEnd: string; beta: boolean } | undefined;
const CAT_ICON = { crm: Users, credit: CreditCard } as const;
const money = (cents: number) => `$${Math.round(cents / 100)}`;
const fmtDate = (iso: string) => new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
const initials = (n: string) => n.split(/\s+/).filter(Boolean).map((w) => w[0]).slice(0, 2).join("").toUpperCase();
const tile = (n: string) => ["#2b6ba4", "#1f8a65", "#c08532", "#6b5bab", "#b23b5b", "#0f766e"][(n.charCodeAt(0) + n.length) % 6];

const fieldCls = "h-10 w-full rounded-md border border-n200 bg-white px-3 text-[13px] text-n900 outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20 placeholder:text-n400";

function ConnectSheet({ def, config, onClose, onSaved }: { def: IntegrationDef; config: ProviderConfig; onClose: () => void; onSaved: () => void }) {
  const connected = !!config.enabled;
  const paid = def.priceCents != null;
  const sub = config.subscription as Sub;
  const subActive = !!sub && (sub.status === "active" || sub.status === "scheduled_cancel");
  const [vals, setVals] = useState<Record<string, string>>(() => Object.fromEntries(def.fields.map((f) => [f.key, String(config[f.key] ?? "")])));
  const [mode, setMode] = useState<"automatic" | "manual">((config.mode as "automatic" | "manual") ?? "automatic");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const toast = useToast();

  const saveConfig = async (enable: boolean) => {
    const cfg: Record<string, string | boolean> = { enabled: enable, ...vals };
    if (def.hasMode) cfg.mode = mode;
    return apiFetch<{ live: boolean }>("/integrations", { method: "PUT", body: JSON.stringify({ id: def.id, config: cfg }) });
  };
  const subscribe = (action: "start" | "cancel" | "reactivate") => apiFetch("/integrations/subscribe", { method: "PUT", body: JSON.stringify({ id: def.id, action }) });
  const run = async (fn: () => Promise<unknown>, msg: string) => {
    setBusy(true); setErr(null);
    try { await fn(); toast.success(msg); onSaved(); onClose(); }
    catch (e) { setErr(e instanceof ApiError ? e.message : "Could not save."); }
    finally { setBusy(false); }
  };

  const startPaid = () => run(async () => { if (def.fields.length) await saveConfig(true); await subscribe("start"); }, sub?.beta || !def.live ? `${def.name} activated — free during beta` : `Subscribed to ${def.name}`);
  const cancelPaid = () => run(() => subscribe("cancel"), `${def.name} will cancel at period end`);
  const reactivatePaid = () => run(() => subscribe("reactivate"), `${def.name} reactivated`);
  const saveFree = (enable: boolean) => run(() => saveConfig(enable), enable ? (def.live ? `${def.name} connected` : `${def.name} setup saved — activates at launch`) : `${def.name} disconnected`);
  const savePaidFields = () => run(() => saveConfig(true), "Saved");

  let footer: ReactNode;
  if (paid && sub?.status === "scheduled_cancel") {
    footer = <><span className="mr-auto text-[12px] text-warn">Cancels {fmtDate(sub.periodEnd)}</span><button onClick={onClose} className="h-9 rounded-md border border-n200 bg-white px-4 text-[13px] font-medium text-n700 hover:bg-n100">Close</button><button onClick={reactivatePaid} disabled={busy} className="btn-brand h-9 rounded-md px-4 text-[13px] font-semibold disabled:opacity-60">Reactivate</button></>;
  } else if (paid && subActive) {
    footer = <><button onClick={cancelPaid} disabled={busy} className="mr-auto text-[13px] font-semibold text-err hover:underline">Cancel subscription</button><button onClick={onClose} className="h-9 rounded-md border border-n200 bg-white px-4 text-[13px] font-medium text-n700 hover:bg-n100">Close</button>{def.fields.length > 0 && <button onClick={savePaidFields} disabled={busy} className="btn-brand h-9 rounded-md px-4 text-[13px] font-semibold disabled:opacity-60">Save</button>}</>;
  } else if (paid) {
    footer = <><button onClick={onClose} className="h-9 rounded-md border border-n200 bg-white px-4 text-[13px] font-medium text-n700 hover:bg-n100">Cancel</button><button onClick={startPaid} disabled={busy} className="btn-brand h-9 rounded-md px-4 text-[13px] font-semibold disabled:opacity-60">{busy ? "…" : `Subscribe · ${money(def.priceCents!)}/mo`}</button></>;
  } else {
    footer = <>{connected && <button onClick={() => saveFree(false)} disabled={busy} className="mr-auto text-[13px] font-semibold text-err hover:underline">Disconnect</button>}<button onClick={onClose} className="h-9 rounded-md border border-n200 bg-white px-4 text-[13px] font-medium text-n700 hover:bg-n100">Cancel</button><button onClick={() => saveFree(true)} disabled={busy} className="btn-brand h-9 rounded-md px-4 text-[13px] font-semibold disabled:opacity-60">{busy ? "Saving…" : connected ? "Save" : "Connect"}</button></>;
  }

  return (
    <Sheet open onClose={onClose} width="max-w-[440px]" title={def.name} subtitle={def.blurb} footer={footer}>
      <div className="space-y-4">
        {paid && subActive && sub ? (
          <div className={cn("rounded-lg border px-3 py-2.5", sub.status === "scheduled_cancel" ? "border-warn/30 bg-warn-soft/40" : "border-ok/30 bg-ok-soft/40")}>
            <div className="flex items-center justify-between">
              <span className={cn("inline-flex items-center gap-1.5 text-[12.5px] font-semibold", sub.status === "scheduled_cancel" ? "text-warn" : "text-ok")}>{sub.status === "scheduled_cancel" ? <Clock className="h-3.5 w-3.5" /> : <Check className="h-3.5 w-3.5" />}{sub.status === "scheduled_cancel" ? "Cancels soon" : "Active"}</span>
              <span className="text-[11.5px] text-n500">{sub.status === "scheduled_cancel" ? `Access until ${fmtDate(sub.periodEnd)}` : `Renews ${fmtDate(sub.periodEnd)}`}</span>
            </div>
            {sub.beta && <p className="mt-1 text-[11px] text-n500">Free during beta — billing ({money(sub.priceCents)}/mo) begins at launch.</p>}
          </div>
        ) : def.priceCents != null && (
          <div className="flex items-center justify-between rounded-lg bg-brand-soft/50 px-3 py-2.5">
            <span className="text-[12.5px] font-medium text-n700">{def.trialDays ? `${def.trialDays}-day free trial, then ` : ""}{money(def.priceCents)}/month</span>
            <span className="text-[11px] font-semibold text-brand">Free during beta</span>
          </div>
        )}
        {def.fields.map((f) => (
          <label key={f.key} className="block">
            <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-n500">{f.label}</span>
            <input
              type={f.type === "password" ? "password" : "text"}
              value={vals[f.key] ?? ""}
              onChange={(e) => setVals((p) => ({ ...p, [f.key]: e.target.value }))}
              placeholder={f.type === "password" && config[`${f.key}Set`] ? "•••••••• (saved)" : f.placeholder}
              className={fieldCls}
            />
            {f.hint && <span className="mt-1 block text-[11.5px] text-n400">{f.hint}</span>}
          </label>
        ))}
        {def.fields.length === 0 && <p className="rounded-lg bg-n50 px-3 py-2.5 text-[12.5px] text-n500">No credentials needed — just connect.</p>}
        {def.hasMode && (
          <div>
            <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-n500">Submission</span>
            <div className="flex gap-2">
              {(["automatic", "manual"] as const).map((m) => (
                <button key={m} type="button" onClick={() => setMode(m)} className={cn("h-9 flex-1 rounded-lg border text-[12.5px] font-semibold capitalize transition", mode === m ? "border-brand bg-brand-soft text-brand" : "border-n200 text-n600 hover:bg-n100")}>{m}</button>
              ))}
            </div>
            <p className="mt-1.5 text-[11.5px] text-n400">{mode === "automatic" ? "Every credit app is sent automatically on submit." : "You review, then send each application manually."}</p>
          </div>
        )}
        {def.live
          ? <p className="text-[11.5px] leading-relaxed text-n400">Works now — new {def.deliver === "creditapp" ? "credit applications" : "leads"} are delivered to your {def.name} in real time.</p>
          : <p className="rounded-lg bg-warn-soft/50 px-3 py-2.5 text-[11.5px] leading-relaxed text-n600">Save your details now — Krakd finishes the {def.name} connection during launch and it activates automatically.</p>}
        {err && <p className="text-[12px] font-medium text-err">{err}</p>}
      </div>
    </Sheet>
  );
}

function LogoMark({ def }: { def: IntegrationDef }) {
  const [err, setErr] = useState(false);
  if (def.logo && !err) {
    return (
      <span className="grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-xl border border-n200 bg-white p-1.5">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={def.logo} alt={def.name} className="max-h-full max-w-full object-contain" onError={() => setErr(true)} />
      </span>
    );
  }
  return <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl text-[14px] font-bold text-white" style={{ background: tile(def.name) }}>{initials(def.name)}</span>;
}

function IntegrationCard({ def, config, onOpen }: { def: IntegrationDef; config: ProviderConfig; onOpen: () => void }) {
  const paid = def.priceCents != null;
  const sub = config.subscription as Sub;
  const subActive = !!sub && (sub.status === "active" || sub.status === "scheduled_cancel");
  const connected = paid ? subActive : !!config.enabled;
  const label = paid
    ? (sub?.status === "scheduled_cancel" ? "Cancels soon" : subActive ? "Active" : "Subscribe")
    : (connected ? (def.live ? "Connected" : "Saved") : "Connect");
  const cls = sub?.status === "scheduled_cancel" ? "border border-warn/30 bg-warn-soft text-warn" : connected ? "border border-ok/30 bg-ok-soft text-ok" : "border border-n200 bg-white text-n700 hover:bg-n100";
  return (
    <Card className="flex flex-col p-5">
      <div className="mb-3 flex items-center gap-3">
        <LogoMark def={def} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[14px] font-semibold text-n900">{def.name}</p>
          {paid && <span className="text-[11.5px] font-semibold text-brand">{def.trialDays ? `${def.trialDays}-day trial · ` : ""}{money(def.priceCents!)}/mo</span>}
        </div>
      </div>
      <p className="flex-1 text-[12.5px] leading-relaxed text-n500">{def.blurb}</p>
      <button onClick={onOpen} className={cn("mt-4 inline-flex h-9 items-center justify-center gap-1.5 self-start rounded-md px-4 text-[12.5px] font-semibold transition", cls)}>
        {connected && <Check className="h-3.5 w-3.5" />}{label}
      </button>
    </Card>
  );
}

export default function IntegrationsMarketplace() {
  const { data, reload } = useApi<{ integrations: IntegrationsRecord }>("/integrations");
  const [open, setOpen] = useState<string | null>(null);
  const rec = data?.integrations ?? {};
  const cats = useMemo(() => (["crm", "credit"] as const).map((c) => ({ c, items: INTEGRATIONS.filter((i) => i.category === c) })).filter((x) => x.items.length), []);
  const openDef = open ? byId(open) : null;

  return (
    <>
      <Topbar title="Integrations" />
      <AppMain>
        <div className="mb-6"><h1 className="text-[20px] font-bold text-n900">Integrations</h1><p className="mt-0.5 text-[12px] text-n500">Connect Krakd to the CRM, lenders and data providers you already use.</p></div>

        <div className="space-y-8">
          {cats.map(({ c, items }) => {
            const Icon = CAT_ICON[c];
            return (
              <div key={c}>
                <div className="mb-3 flex items-center gap-2.5">
                  <span className="grid h-7 w-7 place-items-center rounded-lg bg-brand-soft text-brand"><Icon className="h-4 w-4" /></span>
                  <h2 className="text-[14px] font-semibold text-n900">{CATEGORY_LABEL[c]}</h2>
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {items.map((def) => <IntegrationCard key={def.id} def={def} config={rec[def.id] ?? {}} onOpen={() => setOpen(def.id)} />)}
                </div>
              </div>
            );
          })}
        </div>
      </AppMain>
      {openDef && <ConnectSheet def={openDef} config={rec[openDef.id] ?? {}} onClose={() => setOpen(null)} onSaved={reload} />}
    </>
  );
}
