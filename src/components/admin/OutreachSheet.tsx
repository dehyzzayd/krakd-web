"use client";

import { useState } from "react";
import { Sheet } from "@/components/app/Sheet";
import { useToast } from "@/components/app/Toast";
import { apiFetch, ApiError } from "@/lib/api";
import { formatUSPhone } from "@/lib/phone";

export const OUTREACH_STATUSES: { v: string; label: string }[] = [
  { v: "NEW", label: "New" }, { v: "CONTACTED", label: "Contacted" }, { v: "INTERESTED", label: "Interested" },
  { v: "DEMO", label: "Demo" }, { v: "NEGOTIATING", label: "Negotiating" }, { v: "WON", label: "Won" }, { v: "LOST", label: "Lost" },
];
const CATEGORY_SUGGESTIONS = ["Independent lot", "Franchise dealer", "Dealer group", "Buy-here-pay-here", "Powersports", "RV / marine", "Real estate", "Other"];

export type OutreachRecord = {
  id: string; company: string; contactName: string | null; title: string | null; email: string | null; phone: string | null;
  website: string | null; city: string | null; state: string | null; category: string | null; status: string;
  source: string | null; value: number; ownerId: string | null; nextFollowUpAt: string | null;
};

const fieldCls = "h-10 w-full rounded-md border border-n200 bg-white px-3 text-[13px] text-n900 outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20";
function L({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-1.5"><label className="text-[12.5px] font-medium text-n800">{label}</label>{children}</div>;
}

export function OutreachSheet({ open, onClose, onSaved, team, categories = [], contact }: {
  open: boolean; onClose: () => void; onSaved: () => void; team: { id: string; name: string }[]; categories?: string[]; contact?: OutreachRecord;
}) {
  const edit = !!contact;
  const [f, setF] = useState({
    company: contact?.company ?? "", contactName: contact?.contactName ?? "", title: contact?.title ?? "",
    email: contact?.email ?? "", phone: contact?.phone ?? "", website: contact?.website ?? "",
    city: contact?.city ?? "", state: contact?.state ?? "", category: contact?.category ?? "",
    status: contact?.status ?? "NEW", source: contact?.source ?? "", value: contact?.value ? String(contact.value) : "",
    ownerId: contact?.ownerId ?? "", nextFollowUpAt: contact?.nextFollowUpAt ? contact.nextFollowUpAt.slice(0, 10) : "",
  });
  const set = (k: keyof typeof f, v: string) => setF((p) => ({ ...p, [k]: v }));
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const toast = useToast();

  const save = async () => {
    setErr(null);
    if (!f.company.trim()) { setErr("Enter the company name."); return; }
    setBusy(true);
    try {
      const body = {
        company: f.company, contactName: f.contactName || null, title: f.title || null, email: f.email || null,
        phone: f.phone || null, website: f.website || null, city: f.city || null, state: f.state || null,
        category: f.category || null, status: f.status, source: f.source || null,
        valueCents: Math.round((+f.value || 0) * 100), ownerId: f.ownerId || null,
        nextFollowUpAt: f.nextFollowUpAt || null,
      };
      if (edit && contact) await apiFetch(`/outreach/${contact.id}`, { method: "PATCH", body: JSON.stringify(body) });
      else await apiFetch("/outreach", { method: "POST", body: JSON.stringify(body) });
      toast.success(edit ? "Prospect updated" : "Prospect added");
      onSaved(); onClose();
    } catch (e) { setErr(e instanceof ApiError ? e.message : "Could not save."); }
    finally { setBusy(false); }
  };

  const cats = [...new Set([...CATEGORY_SUGGESTIONS, ...categories])];

  return (
    <Sheet open={open} onClose={onClose} width="max-w-[460px]" title={edit ? "Edit prospect" : "Add a prospect"} subtitle="Your outreach pipeline — visible to the Krakd team."
      footer={<>
        <button onClick={onClose} className="h-9 rounded-md border border-n200 bg-white px-4 text-[13px] font-medium text-n700 transition hover:bg-n100">Cancel</button>
        <button onClick={save} disabled={busy} className="btn-brand h-9 rounded-md px-4 text-[13px] font-semibold disabled:opacity-60">{busy ? "Saving…" : edit ? "Save changes" : "Add prospect"}</button>
      </>}>
      <div className="space-y-4">
        <L label="Company *"><input value={f.company} onChange={(e) => set("company", e.target.value)} className={fieldCls} placeholder="Northpeak Auto" /></L>
        <div className="grid grid-cols-2 gap-3">
          <L label="Contact name"><input value={f.contactName} onChange={(e) => set("contactName", e.target.value)} className={fieldCls} placeholder="Jordan Whittaker" /></L>
          <L label="Title"><input value={f.title} onChange={(e) => set("title", e.target.value)} className={fieldCls} placeholder="Owner / GM" /></L>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <L label="Phone"><input value={f.phone} inputMode="tel" onChange={(e) => set("phone", formatUSPhone(e.target.value))} className={fieldCls} placeholder="(512) 555-0100" /></L>
          <L label="Email"><input value={f.email} onChange={(e) => set("email", e.target.value)} className={fieldCls} placeholder="jordan@dealer.com" /></L>
        </div>
        <L label="Website"><input value={f.website} onChange={(e) => set("website", e.target.value)} className={fieldCls} placeholder="northpeakauto.com" /></L>
        <div className="grid grid-cols-2 gap-3">
          <L label="City"><input value={f.city} onChange={(e) => set("city", e.target.value)} className={fieldCls} placeholder="Austin" /></L>
          <L label="State"><input value={f.state} onChange={(e) => set("state", e.target.value.toUpperCase().slice(0, 2))} className={fieldCls} placeholder="TX" /></L>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <L label="Category"><input list="outreach-cats" value={f.category} onChange={(e) => set("category", e.target.value)} className={fieldCls} placeholder="Independent lot" />
            <datalist id="outreach-cats">{cats.map((c) => <option key={c} value={c} />)}</datalist>
          </L>
          <L label="Status"><select value={f.status} onChange={(e) => set("status", e.target.value)} className={fieldCls}>{OUTREACH_STATUSES.map((s) => <option key={s.v} value={s.v}>{s.label}</option>)}</select></L>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <L label="Potential value ($/mo)"><input value={f.value} inputMode="numeric" onChange={(e) => set("value", e.target.value.replace(/[^0-9.]/g, ""))} className={fieldCls} placeholder="149" /></L>
          <L label="Source"><input value={f.source} onChange={(e) => set("source", e.target.value)} className={fieldCls} placeholder="Cold call, referral…" /></L>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <L label="Owner"><select value={f.ownerId} onChange={(e) => set("ownerId", e.target.value)} className={fieldCls}><option value="">Unassigned</option>{team.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}</select></L>
          <L label="Next follow-up"><input type="date" value={f.nextFollowUpAt} onChange={(e) => set("nextFollowUpAt", e.target.value)} className={fieldCls} /></L>
        </div>
        {err && <p className="text-[12.5px] font-medium text-err">{err}</p>}
      </div>
    </Sheet>
  );
}
