"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";
import { Sheet } from "./Sheet";
import { apiFetch, ApiError } from "@/lib/api";
import type { Contact } from "@/lib/crm";
import { Mail, Phone, Plus, Trash2, ChevronDown } from "lucide-react";

type Email = { value: string; type: string };
type PhoneN = { value: string; type: string };
type Addr = { street: string; city: string; state: string; zip: string; country: string };

const fieldCls = "h-10 w-full rounded-md border border-n200 bg-white px-3 text-[13px] text-n900 outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20";
const miniSel = "h-8 rounded-md border border-n200 bg-white px-2 text-[12.5px] text-n700 outline-none focus:ring-2 focus:ring-brand/20";

function Labeled({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-1.5"><label className="text-[13px] font-medium text-n900">{label}</label>{children}</div>;
}

export function EditContactSheet({ open, onClose, contact, onCreated }: { open: boolean; onClose: () => void; contact?: Contact | null; onCreated?: () => void }) {
  const [first, setFirst] = useState(contact?.name.split(" ")[0] ?? "");
  const [last, setLast] = useState(contact?.name.split(" ").slice(1).join(" ") ?? "");
  const [emails, setEmails] = useState<Email[]>([{ value: contact?.email ?? "", type: "personal" }]);
  const [phones, setPhones] = useState<PhoneN[]>([{ value: contact?.phone ?? "", type: "mobile" }]);
  const [addrs, setAddrs] = useState<Addr[]>([{ street: "", city: "", state: "", zip: "", country: "" }]);
  const [source, setSource] = useState(contact?.source ?? "");
  const [assignee, setAssignee] = useState("Dana M.");

  const setEmail = (i: number, patch: Partial<Email>) => setEmails((p) => p.map((e, j) => (j === i ? { ...e, ...patch } : e)));
  const setPhone = (i: number, patch: Partial<PhoneN>) => setPhones((p) => p.map((e, j) => (j === i ? { ...e, ...patch } : e)));
  const setAddr = (i: number, patch: Partial<Addr>) => setAddrs((p) => p.map((e, j) => (j === i ? { ...e, ...patch } : e)));

  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const save = async () => {
    setErr(null);
    if (!first.trim()) { setErr("Enter a first name."); return; }
    setBusy(true);
    try {
      await apiFetch("/leads", { method: "POST", body: JSON.stringify({ firstName: first, lastName: last || undefined, email: emails[0]?.value || undefined, phone: phones[0]?.value || undefined, source: source || undefined }) });
      onCreated?.();
      onClose();
    } catch (e) {
      setErr(e instanceof ApiError ? e.message : "Could not save the contact.");
    } finally {
      setBusy(false);
    }
  };

  const AddBtn = ({ onClick, label }: { onClick: () => void; label: string }) => (
    <button type="button" onClick={onClick} className="flex items-center gap-2 rounded-md px-3 py-2 text-[13px] font-medium text-brand transition hover:bg-brand-soft/60"><Plus className="h-4 w-4" />{label}</button>
  );

  return (
    <Sheet open={open} onClose={onClose} width="max-w-[420px]" title={contact ? "Edit contact" : "Add contact"} subtitle="Update contact information"
      footer={<>
        <button onClick={onClose} className="h-9 rounded-md border border-n200 bg-white px-4 text-[13px] font-medium text-n700 transition hover:bg-n100">Cancel</button>
        <button onClick={save} disabled={busy} className="btn-brand h-9 rounded-md px-4 text-[13px] font-semibold disabled:opacity-60">{busy ? "Saving…" : contact ? "Save changes" : "Add contact"}</button>
      </>}>
      <div className="space-y-6">
        {err && <p className="text-[12.5px] font-medium text-err">{err}</p>}
        {/* name */}
        <div className="grid grid-cols-2 gap-4">
          <Labeled label="First name"><input value={first} onChange={(e) => setFirst(e.target.value)} className={fieldCls} /></Labeled>
          <Labeled label="Last name"><input value={last} onChange={(e) => setLast(e.target.value)} className={fieldCls} /></Labeled>
        </div>

        {/* emails */}
        <div className="space-y-3">
          <div className="flex items-center justify-between"><label className="text-[13px] font-medium text-n900">Email addresses</label><span className="text-[12px] text-n500">{emails.length} email{emails.length > 1 ? "s" : ""}</span></div>
          <div className="space-y-2">
            {emails.map((em, i) => (
              <div key={i} className="flex items-center gap-2 rounded-lg border border-n200 bg-white p-3 transition hover:border-brand/30">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-brand-soft text-brand"><Mail className="h-4 w-4" /></span>
                <input value={em.value} onChange={(e) => setEmail(i, { value: e.target.value })} placeholder="Email address" className="h-8 flex-1 bg-transparent px-1 text-[13px] outline-none" />
                <select value={em.type} onChange={(e) => setEmail(i, { type: e.target.value })} className={miniSel}><option value="personal">Personal</option><option value="work">Work</option></select>
                {emails.length > 1 && <button onClick={() => setEmails((p) => p.filter((_, j) => j !== i))} className="grid h-8 w-8 place-items-center rounded-md text-n400 transition hover:text-err"><Trash2 className="h-4 w-4" /></button>}
              </div>
            ))}
          </div>
          <AddBtn label="Add email" onClick={() => setEmails((p) => [...p, { value: "", type: "personal" }])} />
        </div>

        <div className="border-t border-n200" />

        {/* phones */}
        <div className="space-y-3">
          <div className="flex items-center justify-between"><label className="text-[13px] font-medium text-n900">Phone numbers</label><span className="text-[12px] text-n500">{phones.length} phone{phones.length > 1 ? "s" : ""}</span></div>
          <div className="space-y-2">
            {phones.map((ph, i) => (
              <div key={i} className="flex items-center gap-2 rounded-lg border border-n200 bg-white p-3 transition hover:border-brand/30">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-ok-soft text-ok"><Phone className="h-4 w-4" /></span>
                <span className="flex h-8 items-center gap-1 rounded-md border border-n200 px-2 text-[13px]">🇺🇸<ChevronDown className="h-3 w-3 text-n400" /></span>
                <input value={ph.value} onChange={(e) => setPhone(i, { value: e.target.value })} placeholder="Phone number" className="h-8 flex-1 bg-transparent px-1 text-[13px] outline-none" />
                <select value={ph.type} onChange={(e) => setPhone(i, { type: e.target.value })} className={miniSel}><option value="mobile">Mobile</option><option value="work">Work</option><option value="home">Home</option></select>
                {phones.length > 1 && <button onClick={() => setPhones((p) => p.filter((_, j) => j !== i))} className="grid h-8 w-8 place-items-center rounded-md text-n400 transition hover:text-err"><Trash2 className="h-4 w-4" /></button>}
              </div>
            ))}
          </div>
          <AddBtn label="Add phone" onClick={() => setPhones((p) => [...p, { value: "", type: "mobile" }])} />
        </div>

        <div className="border-t border-n200" />

        {/* addresses */}
        <div className="space-y-3">
          <div className="flex items-center justify-between"><label className="text-[13px] font-medium text-n900">Addresses</label><span className="text-[12px] text-n500">{addrs.length} address{addrs.length > 1 ? "es" : ""}</span></div>
          <div className="space-y-2">
            {addrs.map((ad, i) => (
              <div key={i} className="relative space-y-3 rounded-lg border border-n200 bg-n50/40 p-4">
                {addrs.length > 1 && <button onClick={() => setAddrs((p) => p.filter((_, j) => j !== i))} className="absolute right-2 top-2 grid h-8 w-8 place-items-center rounded-md text-n400 transition hover:text-err"><Trash2 className="h-4 w-4" /></button>}
                <Labeled label="Street address"><input value={ad.street} onChange={(e) => setAddr(i, { street: e.target.value })} className={fieldCls} /></Labeled>
                <div className="grid grid-cols-2 gap-3">
                  <Labeled label="City"><input value={ad.city} onChange={(e) => setAddr(i, { city: e.target.value })} className={fieldCls} /></Labeled>
                  <Labeled label="State"><input value={ad.state} onChange={(e) => setAddr(i, { state: e.target.value })} className={fieldCls} /></Labeled>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Labeled label="ZIP code"><input value={ad.zip} onChange={(e) => setAddr(i, { zip: e.target.value })} className={fieldCls} /></Labeled>
                  <Labeled label="Country"><select value={ad.country} onChange={(e) => setAddr(i, { country: e.target.value })} className={cn(fieldCls, "px-2.5")}><option value="">Select country</option><option value="us">United States</option><option value="ca">Canada</option></select></Labeled>
                </div>
              </div>
            ))}
          </div>
          <AddBtn label="Add address" onClick={() => setAddrs((p) => [...p, { street: "", city: "", state: "", zip: "", country: "" }])} />
        </div>

        <div className="border-t border-n200" />

        {/* source & assignee */}
        <div className="grid grid-cols-2 gap-4">
          <Labeled label="Source"><input value={source} onChange={(e) => setSource(e.target.value)} className={fieldCls} /></Labeled>
          <Labeled label="Assignee"><select value={assignee} onChange={(e) => setAssignee(e.target.value)} className={cn(fieldCls, "px-2.5")}><option>Dana M.</option><option>Marco T.</option><option>Krakd AI</option></select></Labeled>
        </div>
      </div>
    </Sheet>
  );
}
