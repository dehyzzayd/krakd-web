"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/cn";
import { apiFetch, ApiError } from "@/lib/api";
import { Loader2, Check, Mail, Server, RefreshCw } from "lucide-react";

const input = "h-10 w-full rounded-lg border border-n200 bg-white px-3 text-[13px] text-n900 outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20";
function Toggle({ on, onChange }: { on: boolean; onChange: () => void }) {
  return <button type="button" onClick={onChange} className={cn("relative h-5 w-9 shrink-0 rounded-full transition", on ? "bg-brand" : "bg-n300")}><span className={cn("absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all", on ? "left-4" : "left-0.5")} /></button>;
}
function L({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block"><span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-n500">{label}</span>{children}</label>;
}
function SaveBtn({ saving, saved, onClick, label = "Save" }: { saving: boolean; saved: boolean; onClick: () => void; label?: string }) {
  return <button onClick={onClick} disabled={saving} className="btn-brand inline-flex h-9 items-center gap-2 rounded-lg px-4 text-[13px] font-semibold disabled:opacity-60">{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : saved ? <Check className="h-4 w-4" /> : null}{saved ? "Saved" : label}</button>;
}

function AdfCard() {
  const [enabled, setEnabled] = useState(false);
  const [emails, setEmails] = useState("");
  const [saving, setSaving] = useState(false); const [saved, setSaved] = useState(false); const [err, setErr] = useState<string | null>(null);
  useEffect(() => { apiFetch<{ enabled: boolean; emails: string[] }>("/leads/adf-delivery").then((d) => { setEnabled(d.enabled); setEmails((d.emails ?? []).join(", ")); }).catch(() => {}); }, []);
  const save = async () => {
    setErr(null); setSaved(false); setSaving(true);
    const list = emails.split(/[\s,;]+/).map((e) => e.trim()).filter(Boolean);
    try { await apiFetch("/leads/adf-delivery", { method: "PUT", body: JSON.stringify({ enabled, emails: list }) }); setEmails(list.join(", ")); setSaved(true); setTimeout(() => setSaved(false), 2000); }
    catch (e) { setErr(e instanceof ApiError ? e.message : "Could not save."); }
    finally { setSaving(false); }
  };
  return (
    <div className="rounded-2xl border border-n200 bg-white p-5 sh-card">
      <div className="mb-3 flex items-start gap-3">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-brand-soft text-brand"><Mail className="h-4.5 w-4.5" /></span>
        <div className="flex-1"><h4 className="text-[14px] font-semibold text-n900">Lead delivery (ADF)</h4><p className="text-[12px] text-n500">Email every new lead as ADF XML to your CRM or lead provider, in real time.</p></div>
        <Toggle on={enabled} onChange={() => setEnabled((v) => !v)} />
      </div>
      {enabled && (
        <div className="mt-3 space-y-3">
          <L label="Delivery emails (comma-separated)"><textarea value={emails} onChange={(e) => setEmails(e.target.value)} rows={2} placeholder="leads@yourcrm.com, adf@provider.com" className={cn(input, "h-auto py-2")} /></L>
          <p className="text-[11.5px] text-n400">Your CRM/DMS gives you an ADF intake address — paste it here. We send the XML in the body and as an attachment.</p>
          {err && <p className="text-[12px] font-medium text-err">{err}</p>}
          <SaveBtn saving={saving} saved={saved} onClick={save} label="Save delivery" />
        </div>
      )}
    </div>
  );
}

type Feed = { enabled: boolean; protocol: "ftp" | "ftps"; host: string; port: number; username: string; path: string; passwordSet: boolean; lastRunAt: string | null; lastResult: string | null };
function FeedCard() {
  const [f, setF] = useState<Feed | null>(null);
  const [password, setPassword] = useState("");
  const [saving, setSaving] = useState(false); const [saved, setSaved] = useState(false);
  const [syncing, setSyncing] = useState(false); const [msg, setMsg] = useState<string | null>(null); const [err, setErr] = useState<string | null>(null);
  const set = <K extends keyof Feed>(k: K, v: Feed[K]) => setF((p) => p && ({ ...p, [k]: v }));
  useEffect(() => { apiFetch<Feed>("/inventory/feed").then(setF).catch(() => {}); }, []);
  const save = async () => {
    if (!f) return; setErr(null); setSaved(false); setSaving(true);
    try { const r = await apiFetch<Feed>("/inventory/feed", { method: "PUT", body: JSON.stringify({ ...f, password: password || undefined }) }); setF(r); setPassword(""); setSaved(true); setTimeout(() => setSaved(false), 2000); }
    catch (e) { setErr(e instanceof ApiError ? e.message : "Could not save."); }
    finally { setSaving(false); }
  };
  const syncNow = async () => {
    setErr(null); setMsg(null); setSyncing(true);
    try { const r = await apiFetch<{ created: number; updated: number; skipped: number }>("/inventory/feed/sync", { method: "POST", body: "{}" }); setMsg(`${r.created} added · ${r.updated} updated · ${r.skipped} skipped`); apiFetch<Feed>("/inventory/feed").then(setF).catch(() => {}); }
    catch (e) { setErr(e instanceof ApiError ? e.message : "Sync failed."); }
    finally { setSyncing(false); }
  };
  if (!f) return <div className="rounded-2xl border border-n200 bg-white p-5 sh-card"><Loader2 className="h-4 w-4 animate-spin text-n300" /></div>;
  return (
    <div className="rounded-2xl border border-n200 bg-white p-5 sh-card">
      <div className="mb-3 flex items-start gap-3">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-brand-soft text-brand"><Server className="h-4.5 w-4.5" /></span>
        <div className="flex-1"><h4 className="text-[14px] font-semibold text-n900">Inventory feed (FTP)</h4><p className="text-[12px] text-n500">Pull a CSV feed from your DMS/feed provider and sync inventory automatically every day.</p></div>
        <Toggle on={f.enabled} onChange={() => set("enabled", !f.enabled)} />
      </div>
      {f.enabled && (
        <div className="mt-3 space-y-3">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <L label="Protocol"><select value={f.protocol} onChange={(e) => set("protocol", e.target.value as "ftp" | "ftps")} className={input}><option value="ftp">FTP</option><option value="ftps">FTPS</option></select></L>
            <L label="Host"><input value={f.host} onChange={(e) => set("host", e.target.value)} placeholder="ftp.provider.com" className={input} /></L>
            <L label="Port"><input value={String(f.port)} onChange={(e) => set("port", parseInt(e.target.value.replace(/\D/g, "")) || 21)} className={cn(input, "tnum")} /></L>
            <L label="Username"><input value={f.username} onChange={(e) => set("username", e.target.value)} className={input} /></L>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <L label="Password"><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder={f.passwordSet ? "•••••••• (unchanged)" : "FTP password"} className={input} /></L>
            <L label="Feed file path"><input value={f.path} onChange={(e) => set("path", e.target.value)} placeholder="/exports/inventory.csv" className={cn(input, "tnum")} /></L>
          </div>
          {f.lastRunAt && <p className="text-[11.5px] text-n500">Last sync {new Date(f.lastRunAt).toLocaleString()} — {f.lastResult}</p>}
          {msg && <p className="text-[12px] font-medium text-ok">{msg}</p>}
          {err && <p className="text-[12px] font-medium text-err">{err}</p>}
          <div className="flex items-center gap-2">
            <SaveBtn saving={saving} saved={saved} onClick={save} label="Save feed" />
            <button onClick={syncNow} disabled={syncing} className="inline-flex h-9 items-center gap-2 rounded-lg border border-n200 bg-white px-4 text-[13px] font-semibold text-n700 transition hover:bg-n100 disabled:opacity-60">{syncing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}Sync now</button>
          </div>
          <p className="text-[11.5px] text-n400">Matches by VIN or stock # — updates existing units, adds new ones. Runs automatically every day.</p>
        </div>
      )}
    </div>
  );
}

export function IntegrationsPanel() {
  return (
    <div className="space-y-4">
      <div><h3 className="text-[14px] font-semibold text-n900">Integrations</h3><p className="text-[12.5px] text-n500">Connect Krakd to your CRM and inventory feed.</p></div>
      <AdfCard />
      <FeedCard />
    </div>
  );
}
