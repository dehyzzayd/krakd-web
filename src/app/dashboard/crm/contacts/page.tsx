"use client";

import { useMemo, useState } from "react";
import { Topbar, AppMain } from "@/components/app/Topbar";
import { Card, Badge, Dot, type Tone } from "@/components/app/AppKit";
import { EditContactSheet } from "@/components/app/EditContactSheet";
import { cn } from "@/lib/cn";
import { useApi } from "@/lib/useApi";
import type { Contact } from "@/lib/crm";

type Row = { id: string; name: string; phone: string; email: string; source: string; vehicle: string; temperature: string; status: string };
type LeadsData = { items: Row[] };

const initials = (n: string) => n.split(/\s+/).filter(Boolean).map((p) => p[0]).slice(0, 2).join("").toUpperCase();
const avatarBg = (n: string) => ["#2b6ba4", "#1f8a65", "#c08532", "#6b5bab", "#b23b5b"][(n.charCodeAt(0) || 0) % 5];
const TEMP: Record<string, Tone> = { Hot: "err", Warm: "warn", Cold: "brand" };

export default function ContactsPage() {
  const { data, loading, reload } = useApi<LeadsData>("/leads");
  const [q, setQ] = useState("");
  const [edit, setEdit] = useState<{ contact: Contact | null } | null>(null);

  const rows = data?.items ?? [];
  const list = useMemo(() => rows.filter((c) => !q.trim() || `${c.name} ${c.email} ${c.phone} ${c.vehicle}`.toLowerCase().includes(q.toLowerCase())), [rows, q]);

  return (
    <>
      <Topbar title="Contacts" action={{ label: "Add contact", onClick: () => setEdit({ contact: null }) }} />
      <AppMain>
        <div className="mb-3 grid grid-cols-3 gap-3">
          {[{ l: "All contacts", v: rows.length }, { l: "Hot", v: rows.filter((c) => c.temperature === "Hot").length }, { l: "Active", v: rows.filter((c) => !["Sold", "Lost"].includes(c.status)).length }].map((k) => (
            <Card key={k.l} className="p-3.5"><p className="text-[11px] font-medium uppercase tracking-[0.04em] text-n500">{k.l}</p><p className="tnum mt-1.5 text-[20px] font-semibold text-n900">{k.v}</p></Card>
          ))}
        </div>

        <div className="mb-3 flex flex-wrap items-center gap-2">
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name, email, phone…" className="h-9 w-full max-w-[280px] rounded-lg border border-n200 bg-white px-3 text-[13px] outline-none placeholder:text-n400 focus:border-brand focus:ring-2 focus:ring-brand/15" />
          <span className="ml-auto text-[12px] text-n500">{list.length} contacts</span>
        </div>

        <Card>
          {loading ? (
            <div className="p-12 text-center text-[13px] text-n400">Loading…</div>
          ) : list.length === 0 ? (
            <div className="px-4 py-16 text-center">
              <p className="text-[14px] font-semibold text-n800">{rows.length === 0 ? "No contacts yet" : "No matches"}</p>
              <p className="mx-auto mt-1 max-w-[42ch] text-[12.5px] text-n500">{rows.length === 0 ? "Every lead becomes a contact here. Add one or launch a campaign to start building your book." : "Try a different search."}</p>
              {rows.length === 0 && <button onClick={() => setEdit({ contact: null })} className="mt-4 inline-flex h-9 items-center rounded-lg bg-brand px-4 text-[12.5px] font-semibold text-white hover:bg-brand-hover">Add a contact</button>}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead><tr className="text-[11px] uppercase tracking-[0.04em] text-n500">
                  <th className="px-4 py-2.5 font-medium">Contact</th><th className="px-3 py-2.5 font-medium">Interest</th><th className="px-3 py-2.5 font-medium">Phone</th><th className="px-3 py-2.5 font-medium">Source</th><th className="px-4 py-2.5 font-medium">Temp</th>
                </tr></thead>
                <tbody>
                  {list.map((c) => (
                    <tr key={c.id} className="cursor-pointer border-t border-n200 transition hover:bg-n50" onClick={() => setEdit({ contact: { id: c.id, name: c.name, email: c.email, phone: c.phone, source: c.source, vehicle: c.vehicle, type: "lead", ltv: 0, last: "" } })}>
                      <td className="px-4 py-2.5"><div className="flex items-center gap-2.5"><span className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-[11px] font-semibold text-white" style={{ background: avatarBg(c.name) }}>{initials(c.name)}</span><div><p className="text-[13px] font-medium text-n900">{c.name}</p><p className="text-[11.5px] text-n500">{c.email}</p></div></div></td>
                      <td className="px-3 py-2.5 text-[13px] text-n700">{c.vehicle}</td>
                      <td className="tnum px-3 py-2.5 text-[12.5px] text-n600">{c.phone}</td>
                      <td className="px-3 py-2.5 text-[12.5px] text-n600">{c.source}</td>
                      <td className="px-4 py-2.5"><Badge tone={TEMP[c.temperature] ?? "neutral"}><Dot tone={TEMP[c.temperature] ?? "neutral"} />{c.temperature}</Badge></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {edit && <EditContactSheet open contact={edit.contact} onClose={() => setEdit(null)} onCreated={reload} />}
      </AppMain>
    </>
  );
}
