"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Topbar, AppMain } from "@/components/app/Topbar";
import { Card, ErrorBanner } from "@/components/app/AppKit";
import { cn } from "@/lib/cn";
import { apiFetch, ApiError } from "@/lib/api";
import { useApi } from "@/lib/useApi";
import { Check, Phone, User as UserIcon } from "lucide-react";
import { SkeletonRows } from "@/components/app/Skeleton";

type Item = { id: string; name: string; phone: string; action: string; dueAt: string; bucket: string; assigned: string | null; status: string };
type Data = { items: Item[]; counts: { overdue: number; today: number; upcoming: number } };

const initials = (n: string) => n.split(/\s+/).filter(Boolean).map((p) => p[0]).slice(0, 2).join("").toUpperCase();
const avatarBg = (n: string) => ["#2b6ba4", "#1f8a65", "#c08532", "#6b5bab", "#b23b5b"][(n.charCodeAt(0) || 0) % 5];
const due = (iso: string) => new Date(iso).toLocaleString("en-US", { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });

const BUCKETS: { key: string; label: string; tone: string }[] = [
  { key: "overdue", label: "Overdue", tone: "text-err" },
  { key: "today", label: "Due today", tone: "text-warn" },
  { key: "upcoming", label: "Upcoming", tone: "text-n600" },
];

export default function FollowupsPage() {
  const router = useRouter();
  const { data, loading, error, reload } = useApi<Data>("/followups");
  const [busy, setBusy] = useState<string | null>(null);

  const complete = async (id: string) => {
    setBusy(id);
    try { await apiFetch(`/leads/${id}`, { method: "PATCH", body: JSON.stringify({ nextAction: null, nextActionAt: null }) }); reload(); }
    catch (e) { alert(e instanceof ApiError ? e.message : "Could not update."); }
    finally { setBusy(null); }
  };

  const items = data?.items ?? [];
  const c = data?.counts;

  return (
    <>
      <Topbar title="Follow-ups" />
      <AppMain>
        {error && <ErrorBanner onRetry={reload} />}
        <div className="mb-5"><h1 className="text-[20px] font-bold text-n900">Follow-ups</h1><p className="mt-0.5 text-[12px] text-n500">Every scheduled next step across your pipeline — so nothing slips.</p></div>

        <div className="mb-4 grid grid-cols-3 gap-3">
          {[["Overdue", c?.overdue ?? 0, "text-err"], ["Due today", c?.today ?? 0, "text-warn"], ["Upcoming", c?.upcoming ?? 0, "text-n700"]].map(([l, v, tone]) => (
            <Card key={l as string} className="p-3.5"><p className="text-[11px] font-medium uppercase tracking-[0.04em] text-n500">{l}</p><p className={cn("tnum mt-1.5 text-[20px] font-semibold", tone as string)}>{v}</p></Card>
          ))}
        </div>

        {loading ? (
          <Card><SkeletonRows rows={7} cols={4} /></Card>
        ) : items.length === 0 ? (
          <Card className="px-4 py-16 text-center"><p className="text-[14px] font-semibold text-n800">You&apos;re all caught up</p><p className="mx-auto mt-1 max-w-[42ch] text-[12.5px] text-n500">Set a next action on any lead and it shows up here until it&apos;s done.</p></Card>
        ) : (
          <div className="space-y-5">
            {BUCKETS.map((b) => {
              const rows = items.filter((i) => i.bucket === b.key);
              if (rows.length === 0) return null;
              return (
                <div key={b.key}>
                  <p className={cn("mb-2 text-[12px] font-bold uppercase tracking-wide", b.tone)}>{b.label} · {rows.length}</p>
                  <Card>
                    {rows.map((i, idx) => (
                      <div key={i.id} className={cn("flex items-center gap-3 px-4 py-3", idx > 0 && "border-t border-n100")}>
                        <button onClick={() => complete(i.id)} disabled={busy === i.id} title="Mark done" className="grid h-7 w-7 shrink-0 place-items-center rounded-full border border-n300 text-n400 transition hover:border-ok hover:bg-ok-soft hover:text-ok disabled:opacity-50"><Check className="h-4 w-4" /></button>
                        <button onClick={() => router.push(`/dashboard/leads/${i.id}`)} className="flex min-w-0 flex-1 items-center gap-3 text-left">
                          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-[12px] font-semibold text-white" style={{ background: avatarBg(i.name) }}>{initials(i.name)}</span>
                          <span className="min-w-0 leading-tight">
                            <span className="block truncate text-[13px] font-semibold text-n900">{i.name}</span>
                            <span className="block truncate text-[12px] text-n500">{i.action}</span>
                          </span>
                        </button>
                        <div className="hidden shrink-0 items-center gap-1.5 text-[11.5px] text-n500 sm:flex">{i.assigned ? <><UserIcon className="h-3 w-3" />{i.assigned}</> : <span className="text-n400">Unassigned</span>}</div>
                        <span className="tnum hidden w-40 shrink-0 text-right text-[12px] text-n500 md:block">{due(i.dueAt)}</span>
                        {i.phone && <a href={`tel:${i.phone}`} onClick={(e) => e.stopPropagation()} className="grid h-8 w-8 shrink-0 place-items-center rounded-md border border-n200 text-n500 transition hover:bg-n100 hover:text-brand"><Phone className="h-3.5 w-3.5" /></a>}
                        <Link href={`/dashboard/leads/${i.id}`} className="shrink-0 rounded-md px-2 py-1 text-[12px] font-semibold text-brand hover:underline">Open</Link>
                      </div>
                    ))}
                  </Card>
                </div>
              );
            })}
          </div>
        )}
      </AppMain>
    </>
  );
}
