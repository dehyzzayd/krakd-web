"use client";

import { useState } from "react";
import { Sheet } from "./Sheet";
import { useToast } from "./Toast";
import { apiFetch, ApiError } from "@/lib/api";
import type { Contact } from "@/lib/crm";
import { Mail, Phone, Plus, Trash2, ChevronDown } from "lucide-react";

type Email = { value: string; type: string };
type PhoneN = { value: string; type: string };

const fieldCls = "h-10 w-full rounded-md border border-n200 bg-white px-3 text-[13px] text-n900 outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20";
const miniSel = "h-8 rounded-md border border-n200 bg-white px-2 text-[12.5px] text-n700 outline-none focus:ring-2 focus:ring-brand/20";

function Labeled({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-1.5"><label className="text-[13px] font-medium text-n900">{label}</label>{children}</div>;
}

export function EditContactSheet({ open, onClose, contact, onCreated }: { open: boolean; onClose: () => void; contact?: Contact | null; onCreated?: () => void }) {
  const editing = !!contact?.id;
  const [first, setFirst] = useState(contact?.name.split(" ")[0] ?? "");
  const [last, setLast] = useState(contact?.name.split(" ").slice(1).join(" ") ?? "");
  const [emails, setEmails] = useState<Email[]>([{ value: contact?.email ?? "", type: "personal" }]);
  const [phones, setPhones] = useState<PhoneN[]>([{ value: contact?.phone ?? "", type: "mobile" }]);
  const [source, setSource] = useState(contact?.source ?? "");

  const setEmail = (i: number, patch: Partial<Email>) => setEmails((p) => p.map((e, j) => (j === i ? { ...e, ...patch } : e)));
  const setPhone = (i: number, patch: Partial<PhoneN>) => setPhones((p) => p.map((e, j) => (j === i ? { ...e, ...patch } : e)));

  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const toast = useToast();
  const save = async () => {
    setErr(null);
    if (!first.trim()) { setErr("Enter a first name."); return; }
    setBusy(true);
    // keep every email/phone the user entered — not just the first
    const cleanEmails = emails.filter((e) => e.value.trim());
    const cleanPhones = phones.filter((p) => p.value.trim());
    try {
      if (editing) {
        // update the existing lead/contact in place — never create a duplicate
        await apiFetch(`/leads/${contact!.id}`, { method: "PATCH", body: JSON.stringify({ firstName: first, lastName: last || undefined, emails: cleanEmails, phones: cleanPhones, source: source || undefined }) });
      } else {
        await apiFetch("/leads", { method: "POST", body: JSON.stringify({ firstName: first, lastName: last || undefined, emails: cleanEmails, phones: cleanPhones, source: source || undefined }) });
      }
      toast.success(editing ? "Contact updated" : "Contact added");
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
    <Sheet open={open} onClose={onClose} width="max-w-[420px]" title={editing ? "Edit contact" : "Add contact"} subtitle={editing ? "Update this contact's details" : "Add a new contact"}
      footer={<>
        <button onClick={onClose} className="h-9 rounded-md border border-n200 bg-white px-4 text-[13px] font-medium text-n700 transition hover:bg-n100">Cancel</button>
        <button onClick={save} disabled={busy} className="btn-brand h-9 rounded-md px-4 text-[13px] font-semibold disabled:opacity-60">{busy ? "Saving…" : editing ? "Save changes" : "Add contact"}</button>
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

        {/* source */}
        <Labeled label="Source"><input value={source} onChange={(e) => setSource(e.target.value)} placeholder="e.g. Referral, Walk-in, Cars.com" className={fieldCls} /></Labeled>
      </div>
    </Sheet>
  );
}
