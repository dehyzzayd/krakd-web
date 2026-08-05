"use client";

import { useMemo, useState } from "react";
import { Topbar, AppMain } from "@/components/app/Topbar";
import { Card } from "@/components/app/AppKit";
import { Sheet } from "@/components/app/Sheet";
import { cn } from "@/lib/cn";
import { apiFetch, ApiError } from "@/lib/api";
import { useApi } from "@/lib/useApi";
import { useToast } from "@/components/app/Toast";
import { INTEGRATIONS, CATEGORY_LABEL, byId, type IntegrationDef, type IntegrationsRecord, type ProviderConfig } from "@/lib/integrations";
import { Check, Users, CreditCard, Car } from "lucide-react";

const CAT_ICON = { crm: Users, credit: CreditCard, inventory: Car } as const;
const money = (cents: number) => `$${Math.round(cents / 100)}`;
const initials = (n: string) => n.split(/\s+/).filter(Boolean).map((w) => w[0]).slice(0, 2).join("").toUpperCase();
const tile = (n: string) => ["#2b6ba4", "#1f8a65", "#c08532", "#6b5bab", "#b23b5b", "#0f766e"][(n.charCodeAt(0) + n.length) % 6];

const fieldCls = "h-10 w-full rounded-md border border-n200 bg-white px-3 text-[13px] text-n900 outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20 placeholder:text-n400";

function ConnectSheet({ def, config, onClose, onSaved }: { def: IntegrationDef; config: ProviderConfig; onClose: () => void; onSaved: () => void }) {
  const connected = !!config.enabled;
  const [vals, setVals] = useState<Record<string, string>>(() => Object.fromEntries(def.fields.map((f) => [f.key, String(config[f.key] ?? "")])));
  const [mode, setMode] = useState<"automatic" | "manual">((config.mode as "automatic" | "manual") ?? "automatic");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const toast = useToast();

  const save = async (enable: boolean) => {
    setBusy(true); setErr(null);
    try {
      const cfg: Record<string, string | boolean> = { enabled: enable, ...vals };
      if (def.hasMode) cfg.mode = mode;
      const r = await apiFetch<{ live: boolean }>("/integrations", { method: "PUT", body: JSON.stringify({ id: def.id, config: cfg }) });
      if (!enable) toast.success(`${def.name} disconnected`);
      else if (r.live) toast.success(`${def.name} connected`);
      else toast.success(`${def.name} setup saved — activates at launch`);
      onSaved(); onClose();
    } catch (e) { setErr(e instanceof ApiError ? e.message : "Could not save."); }
    finally { setBusy(false); }
  };

  return (
    <Sheet open onClose={onClose} width="max-w-[440px]" title={def.name} subtitle={def.blurb}
      footer={<>
        {connected && <button onClick={() => save(false)} disabled={busy} className="mr-auto text-[13px] font-semibold text-err hover:underline">Disconnect</button>}
        <button onClick={onClose} className="h-9 rounded-md border border-n200 bg-white px-4 text-[13px] font-medium text-n700 transition hover:bg-n100">Cancel</button>
        <button onClick={() => save(true)} disabled={busy} className="btn-brand h-9 rounded-md px-4 text-[13px] font-semibold disabled:opacity-60">{busy ? "Saving…" : connected ? "Save" : def.priceCents && !def.live ? `Subscribe · ${money(def.priceCents)}/mo` : "Connect"}</button>
      </>}>
      <div className="space-y-4">
        {def.priceCents != null && (
          <div className="flex items-center justify-between rounded-lg bg-brand-soft/50 px-3 py-2.5">
            <span className="text-[12.5px] font-medium text-n700">{def.trialDays ? `${def.trialDays}-day free trial, then ` : ""}{money(def.priceCents)}/month</span>
            {!def.live && <span className="text-[11px] font-semibold text-brand">Billing starts at launch</span>}
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

function IntegrationCard({ def, config, onOpen }: { def: IntegrationDef; config: ProviderConfig; onOpen: () => void }) {
  const connected = !!config.enabled;
  return (
    <Card className="flex flex-col p-5">
      <div className="mb-3 flex items-center gap-3">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl text-[14px] font-bold text-white" style={{ background: tile(def.name) }}>{initials(def.name)}</span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[14px] font-semibold text-n900">{def.name}</p>
          {def.priceCents != null && <span className="text-[11.5px] font-semibold text-brand">{def.trialDays ? `${def.trialDays}-day trial · ` : ""}{money(def.priceCents)}/mo</span>}
        </div>
      </div>
      <p className="flex-1 text-[12.5px] leading-relaxed text-n500">{def.blurb}</p>
      <button onClick={onOpen} className={cn("mt-4 inline-flex h-9 items-center justify-center gap-1.5 self-start rounded-md px-4 text-[12.5px] font-semibold transition", connected ? "border border-ok/30 bg-ok-soft text-ok" : "border border-n200 bg-white text-n700 hover:bg-n100")}>
        {connected ? <><Check className="h-3.5 w-3.5" />{def.live ? "Connected" : "Saved"}</> : "Connect"}
      </button>
    </Card>
  );
}

export default function IntegrationsMarketplace() {
  const { data, reload } = useApi<{ integrations: IntegrationsRecord }>("/integrations");
  const [open, setOpen] = useState<string | null>(null);
  const rec = data?.integrations ?? {};
  const cats = useMemo(() => (["crm", "credit", "inventory"] as const).map((c) => ({ c, items: INTEGRATIONS.filter((i) => i.category === c) })), []);
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
