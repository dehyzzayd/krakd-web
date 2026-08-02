"use client";

import Link from "next/link";
import { useState } from "react";
import { Topbar, AppMain } from "@/components/app/Topbar";
import { cn } from "@/lib/cn";
import { apiFetch, API_URL, getToken } from "@/lib/api";
import { useApi } from "@/lib/useApi";
import { CATALOG, catalogField } from "@/lib/creditApp";
import { Download, Loader2 } from "lucide-react";

type Data = { id: string; status: string; createdAt: string; applicant: Record<string, string>; coApplicant: Record<string, string> | null };
const STATUSES = ["NEW", "REVIEWING", "APPROVED", "DECLINED"] as const;
const STATUS_CLS: Record<string, string> = { NEW: "bg-brand-soft text-brand", REVIEWING: "bg-warn-soft text-warn", APPROVED: "bg-ok-soft text-ok", DECLINED: "bg-err-soft text-err" };
const fmt = (key: string, val: string) => (catalogField(key)?.type === "money" && val ? `$${Number(val).toLocaleString()}` : catalogField(key)?.type === "ssn" && val ? `•••-••-${val.slice(-4)}` : val);

function Cell({ label, value }: { label: string; value: string }) {
  return <div className="rounded-lg border border-n100 bg-n50/40 px-3 py-2"><p className="text-[10.5px] font-medium uppercase tracking-wide text-n400">{label}</p><p className="mt-0.5 truncate text-[13px] font-medium text-n900" title={value}>{value || "—"}</p></div>;
}

function Party({ title, data }: { title: string; data: Record<string, string> }) {
  const coKeys = new Set(CATALOG.find((s) => s.coapp)!.fields.map((f) => f.key));
  return (
    <div className="rounded-2xl border border-n200 bg-white p-5 sh-card">
      <p className="mb-4 text-[15px] font-semibold text-n900">{title}</p>
      <div className="space-y-5">
        {CATALOG.map((s) => {
          const fields = s.fields.filter((f) => (title.startsWith("Co-") ? coKeys.has(f.key) : !coKeys.has(f.key)) && String(data[f.key] ?? "").trim());
          if (fields.length === 0) return null;
          return (
            <div key={s.id}>
              {!s.coapp && <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-brand">{s.title}</p>}
              <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4">
                {fields.map((f) => <Cell key={f.key} label={f.label} value={fmt(f.key, data[f.key])} />)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function CreditAppDetail({ id }: { id: string }) {
  const { data, reload } = useApi<Data>(`/credit-app/applications/${id}`);
  const [busy, setBusy] = useState(false);
  const [dl, setDl] = useState(false);
  const setStatus = async (status: string) => { setBusy(true); try { await apiFetch(`/credit-app/applications/${id}`, { method: "PATCH", body: JSON.stringify({ status }) }); reload(); } finally { setBusy(false); } };
  const downloadPdf = async () => {
    setDl(true);
    try {
      const res = await fetch(`${API_URL}/credit-app/applications/${id}/pdf`, { headers: getToken() ? { authorization: `Bearer ${getToken()}` } : {} });
      if (!res.ok) throw new Error("Could not generate the PDF");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = `${name || "credit-application"}.pdf`; a.click();
      URL.revokeObjectURL(url);
    } catch (e) { alert(e instanceof Error ? e.message : "PDF failed"); }
    finally { setDl(false); }
  };

  const name = data ? `${data.applicant.firstName ?? ""} ${data.applicant.lastName ?? ""}`.trim() || "Applicant" : "";

  return (
    <>
      <Topbar crumbs={[{ label: "Credit applications", href: "/dashboard/crm/credit" }, { label: name || "Application" }]} />
      <AppMain>
        {!data ? <div className="py-16 text-center text-[13px] text-n400"><Loader2 className="mx-auto h-5 w-5 animate-spin" /></div> : (
          <div className="w-full">
            <div className="mb-5 flex flex-wrap items-center gap-3">
              <div className="mr-auto">
                <h1 className="text-[20px] font-bold text-n900">{name}</h1>
                <p className="text-[12.5px] text-n500">Submitted {new Date(data.createdAt).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })}</p>
              </div>
              <span className={cn("inline-flex rounded-full px-2.5 py-1 text-[12px] font-semibold", STATUS_CLS[data.status])}>{data.status}</span>
              <div className="no-print flex items-center gap-1 rounded-lg border border-n200 bg-white p-0.5">
                {STATUSES.map((s) => <button key={s} disabled={busy} onClick={() => setStatus(s)} className={cn("h-8 rounded-md px-2.5 text-[11.5px] font-semibold transition disabled:opacity-50", data.status === s ? "bg-n100 text-n900" : "text-n500 hover:text-n900")}>{s[0] + s.slice(1).toLowerCase()}</button>)}
              </div>
              <button onClick={downloadPdf} disabled={dl} className="no-print inline-flex h-9 items-center gap-2 rounded-lg bg-brand px-4 text-[12.5px] font-semibold text-white hover:bg-brand-hover disabled:opacity-60">{dl ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}Download PDF</button>
            </div>

            <div className="space-y-4">
              <Party title="Applicant" data={data.applicant} />
              {data.coApplicant && <Party title="Co-applicant" data={data.coApplicant} />}
            </div>

            <Link href="/dashboard/crm/credit" className="no-print mt-4 inline-block text-[13px] font-semibold text-brand">← All applications</Link>
          </div>
        )}
      </AppMain>
    </>
  );
}
