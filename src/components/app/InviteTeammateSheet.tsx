"use client";

import { useState } from "react";
import { Sheet } from "./Sheet";
import { apiFetch, ApiError } from "@/lib/api";

const fieldCls = "h-10 w-full rounded-md border border-n200 bg-white px-3 text-[13px] text-n900 outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20";

function L({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block"><span className="mb-1.5 block text-[13px] font-medium text-n900">{label}</span>{children}</label>;
}

export function InviteTeammateSheet({ open, onClose, onInvited }: { open: boolean; onClose: () => void; onInvited: () => void }) {
  const [first, setFirst] = useState("");
  const [last, setLast] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"STAFF" | "MANAGER">("STAFF");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const save = async () => {
    setErr(null);
    if (!first.trim() || !last.trim() || !email.trim()) { setErr("Name and email are required."); return; }
    setBusy(true);
    try {
      await apiFetch("/team", { method: "POST", body: JSON.stringify({ firstName: first, lastName: last, email, role }) });
      onInvited(); onClose();
    } catch (e) { setErr(e instanceof ApiError ? e.message : "Could not send the invite."); }
    finally { setBusy(false); }
  };

  return (
    <Sheet open={open} onClose={onClose} width="max-w-[420px]" title="Invite a teammate" subtitle="They'll get an email to set their password and join."
      footer={<>
        <button onClick={onClose} className="h-9 rounded-md border border-n200 bg-white px-4 text-[13px] font-medium text-n700 transition hover:bg-n100">Cancel</button>
        <button onClick={save} disabled={busy} className="btn-brand h-9 rounded-md px-4 text-[13px] font-semibold disabled:opacity-60">{busy ? "Sending…" : "Send invite"}</button>
      </>}>
      <div className="space-y-4">
        {err && <p className="text-[12.5px] font-medium text-err">{err}</p>}
        <div className="grid grid-cols-2 gap-4">
          <L label="First name"><input value={first} onChange={(e) => setFirst(e.target.value)} className={fieldCls} /></L>
          <L label="Last name"><input value={last} onChange={(e) => setLast(e.target.value)} className={fieldCls} /></L>
        </div>
        <L label="Work email"><input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="name@dealership.com" className={fieldCls} /></L>
        <L label="Role">
          <div className="grid grid-cols-2 gap-2">
            {([["STAFF", "Salesperson", "Works their own leads & inventory"], ["MANAGER", "Manager", "Full access, can manage the team"]] as const).map(([v, title, desc]) => (
              <button key={v} type="button" onClick={() => setRole(v)} className={`rounded-lg border p-3 text-left transition ${role === v ? "border-brand bg-brand-soft/40 ring-1 ring-brand/20" : "border-n200 hover:bg-n50"}`}>
                <span className={`block text-[13px] font-semibold ${role === v ? "text-brand" : "text-n900"}`}>{title}</span>
                <span className="mt-0.5 block text-[11.5px] text-n500">{desc}</span>
              </button>
            ))}
          </div>
        </L>
      </div>
    </Sheet>
  );
}
