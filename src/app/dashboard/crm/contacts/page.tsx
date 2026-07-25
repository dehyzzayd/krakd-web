"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Topbar, AppMain } from "@/components/app/Topbar";
import { Card, Badge, Dot, type Tone } from "@/components/app/AppKit";
import { Drawer } from "@/components/app/budget";
import { cn } from "@/lib/cn";
import { CONTACTS, money, type Contact } from "@/lib/crm";

const initials = (n: string) => n.split(" ").map((p) => p[0]).slice(0, 2).join("");
const avatarBg = (n: string) => ["#3c7cab", "#1f8a65", "#c08532", "#6b5bab", "#b23b5b"][n.charCodeAt(0) % 5];
const TYPE_TONE: Record<Contact["type"], Tone> = { lead: "brand", customer: "ok", past: "neutral" };
const TYPE_LABEL: Record<Contact["type"], string> = { lead: "Active lead", customer: "Customer", past: "Past customer" };
const FILTERS: { k: "all" | Contact["type"]; label: string }[] = [
  { k: "all", label: "All" }, { k: "lead", label: "Leads" }, { k: "customer", label: "Customers" }, { k: "past", label: "Past" },
];

export default function ContactsPage() {
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<"all" | Contact["type"]>("all");
  const [sel, setSel] = useState<Contact | null>(null);

  const list = useMemo(() => CONTACTS.filter((c) => {
    if (filter !== "all" && c.type !== filter) return false;
    if (q.trim() && !`${c.name} ${c.email} ${c.phone} ${c.vehicle}`.toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  }), [q, filter]);

  return (
    <>
      <Topbar title="Contacts" action={{ label: "Add contact" }} />
      <AppMain>
        <div className="mb-3 grid grid-cols-3 gap-3">
          {[{ l: "All contacts", v: CONTACTS.length }, { l: "Active leads", v: CONTACTS.filter((c) => c.type === "lead").length }, { l: "Customers", v: CONTACTS.filter((c) => c.type !== "lead").length }].map((k) => (
            <Card key={k.l} className="p-3.5"><p className="text-[11px] font-medium uppercase tracking-[0.04em] text-n500">{k.l}</p><p className="tnum mt-1.5 text-[20px] font-semibold text-n900">{k.v}</p></Card>
          ))}
        </div>

        <div className="mb-3 flex flex-wrap items-center gap-2">
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name, email, phone…" className="h-9 w-full max-w-[280px] rounded-lg border border-n200 bg-white px-3 text-[13px] outline-none placeholder:text-n400 focus:border-brand focus:ring-2 focus:ring-brand/15" />
          <div className="flex items-center gap-1 rounded-lg border border-n200 bg-white p-0.5">
            {FILTERS.map((f) => <button key={f.k} onClick={() => setFilter(f.k)} className={cn("h-8 rounded-[7px] px-2.5 text-[12.5px] font-medium transition", filter === f.k ? "bg-n100 text-n900" : "text-n600 hover:text-n900")}>{f.label}</button>)}
          </div>
          <span className="ml-auto text-[12px] text-n500">{list.length} contacts</span>
        </div>

        <Card>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-left">
              <thead><tr className="text-[11px] uppercase tracking-[0.04em] text-n500">
                <th className="px-4 py-2.5 font-medium">Contact</th><th className="px-3 py-2.5 font-medium">Type</th>
                <th className="px-3 py-2.5 font-medium">Phone</th><th className="px-3 py-2.5 font-medium">Vehicle</th>
                <th className="px-3 py-2.5 text-right font-medium">Lifetime value</th><th className="px-3 py-2.5 font-medium">Source</th><th className="px-4 py-2.5 text-right font-medium">Last</th>
              </tr></thead>
              <tbody>
                {list.map((c) => (
                  <tr key={c.id} onClick={() => setSel(c)} className="cursor-pointer border-t border-n200 transition hover:bg-n50">
                    <td className="px-4 py-2.5"><div className="flex items-center gap-2.5"><span className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-[11px] font-semibold text-white" style={{ background: avatarBg(c.name) }}>{initials(c.name)}</span><div><p className="text-[13px] font-medium text-n900">{c.name}</p><p className="text-[11.5px] text-n500">{c.email}</p></div></div></td>
                    <td className="px-3 py-2.5"><Badge tone={TYPE_TONE[c.type]}><Dot tone={TYPE_TONE[c.type]} />{TYPE_LABEL[c.type]}</Badge></td>
                    <td className="tnum px-3 py-2.5 text-[12.5px] text-n600">{c.phone}</td>
                    <td className="px-3 py-2.5 text-[12.5px] text-n700">{c.vehicle}</td>
                    <td className="tnum px-3 py-2.5 text-right text-[13px] font-medium text-n900">{money(c.ltv)}</td>
                    <td className="px-3 py-2.5 text-[12.5px] text-n600">{c.source}</td>
                    <td className="tnum px-4 py-2.5 text-right text-[12px] text-n400">{c.last}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Drawer open={!!sel} onClose={() => setSel(null)} title={sel?.name ?? ""} footer={sel?.leadId ? (
          <Link href={`/dashboard/leads/${sel.leadId}`} className="block h-10 rounded-lg bg-brand text-center text-[13px] font-semibold leading-10 text-white transition hover:bg-brand-hover">Open lead workspace</Link>
        ) : <button onClick={() => setSel(null)} className="h-10 w-full rounded-lg border border-n200 bg-white text-[13px] font-semibold text-n700 transition hover:bg-n100">Close</button>}>
          {sel && (
            <div>
              <div className="flex items-center gap-3">
                <span className="grid h-12 w-12 place-items-center rounded-full text-[15px] font-semibold text-white" style={{ background: avatarBg(sel.name) }}>{initials(sel.name)}</span>
                <div><p className="flex items-center gap-2 text-[16px] font-semibold text-n900">{sel.name}</p><Badge tone={TYPE_TONE[sel.type]}>{TYPE_LABEL[sel.type]}</Badge></div>
              </div>
              <div className="mt-4 space-y-2 rounded-lg border border-n200 p-3 text-[13px]">
                <div className="flex justify-between"><span className="text-n500">Phone</span><span className="tnum font-medium text-n900">{sel.phone}</span></div>
                <div className="flex justify-between gap-3"><span className="text-n500">Email</span><span className="truncate font-medium text-n900">{sel.email}</span></div>
                <div className="flex justify-between"><span className="text-n500">Source</span><span className="font-medium text-n900">{sel.source}</span></div>
                <div className="flex justify-between"><span className="text-n500">Lifetime value</span><span className="tnum font-semibold text-n900">{money(sel.ltv)}</span></div>
              </div>
              <div className="mt-3 rounded-lg border border-n200 p-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.04em] text-n500">Vehicle</p>
                <p className="mt-1 text-[13.5px] font-semibold text-n900">{sel.vehicle}</p>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2">{["Call", "Text", "Email", "New deal"].map((a) => <button key={a} className="h-9 rounded-lg border border-n200 bg-white text-[12.5px] font-semibold text-n700 transition hover:bg-n100">{a}</button>)}</div>
            </div>
          )}
        </Drawer>
      </AppMain>
    </>
  );
}
