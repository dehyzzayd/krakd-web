"use client";

import { useEffect, useState } from "react";
import { Topbar, AppMain } from "@/components/app/Topbar";
import { Card, ErrorBanner } from "@/components/app/AppKit";
import { cn } from "@/lib/cn";
import { apiFetch, ApiError } from "@/lib/api";
import { useApi } from "@/lib/useApi";
import { InviteTeammateSheet } from "@/components/app/InviteTeammateSheet";
import { UserPlus, MoreVertical, Shuffle } from "lucide-react";
import { SkeletonRows } from "@/components/app/Skeleton";
import { useToast } from "@/components/app/Toast";

type Member = { id: string; name: string; email: string; role: string; status: string; lastActive: string | null; assignedLeads: number };

const ROLE_LABEL: Record<string, string> = { OWNER: "Owner", MANAGER: "Manager", STAFF: "Salesperson" };
const STATUS_PILL: Record<string, string> = { ACTIVE: "bg-ok-soft text-ok", INVITED: "bg-warn-soft text-warn", DISABLED: "bg-n100 text-n500" };
const STATUS_LABEL: Record<string, string> = { ACTIVE: "Active", INVITED: "Invited", DISABLED: "Disabled" };
const initials = (n: string) => n.split(/\s+/).filter(Boolean).map((p) => p[0]).slice(0, 2).join("").toUpperCase();
const avatarBg = (n: string) => ["#2b6ba4", "#1f8a65", "#c08532", "#6b5bab", "#b23b5b"][(n.charCodeAt(0) || 0) % 5];

function RoutingCard() {
  const [cfg, setCfg] = useState<{ autoAssign: boolean; mode: "round_robin" | "owner" } | null>(null);
  const [busy, setBusy] = useState(false);
  const toast = useToast();
  useEffect(() => { apiFetch<{ autoAssign: boolean; mode: "round_robin" | "owner" }>("/leads/routing").then(setCfg).catch(() => {}); }, []);
  const save = async (next: { autoAssign: boolean; mode: "round_robin" | "owner" }) => {
    setCfg(next); setBusy(true);
    try { await apiFetch("/leads/routing", { method: "PUT", body: JSON.stringify(next) }); toast.success("Lead routing saved"); }
    catch { toast.error("Could not save."); }
    finally { setBusy(false); }
  };
  if (!cfg) return null;
  return (
    <Card className="mb-4 p-5">
      <div className="flex items-start gap-3">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-brand-soft text-brand"><Shuffle className="h-4.5 w-4.5" /></span>
        <div className="flex-1">
          <div className="flex items-center justify-between gap-3">
            <div><p className="text-[14px] font-semibold text-n900">Auto-assign new leads</p><p className="text-[12px] text-n500">Route every inbound lead to a salesperson automatically.</p></div>
            <button type="button" onClick={() => save({ ...cfg, autoAssign: !cfg.autoAssign })} disabled={busy} className={cn("relative h-5 w-9 shrink-0 rounded-full transition", cfg.autoAssign ? "bg-brand" : "bg-n300")}><span className={cn("absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all", cfg.autoAssign ? "left-4" : "left-0.5")} /></button>
          </div>
          {cfg.autoAssign && (
            <div className="mt-3 inline-flex rounded-lg border border-n200 bg-white p-0.5">
              {([["round_robin", "Round-robin"], ["owner", "Owner"]] as const).map(([v, l]) => (
                <button key={v} onClick={() => save({ ...cfg, mode: v })} disabled={busy} className={cn("h-8 rounded-[7px] px-3 text-[12.5px] font-medium transition", cfg.mode === v ? "bg-n100 text-n900" : "text-n600")}>{l}</button>
              ))}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}

export default function TeamPage() {
  const { data, loading, error, reload } = useApi<{ members: Member[] }>("/team");
  const { data: me } = useApi<{ role?: string; userId?: string }>("/auth/me");
  const [inviting, setInviting] = useState(false);
  const [menuFor, setMenuFor] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const canManage = me?.role === "OWNER" || me?.role === "MANAGER";
  const members = data?.members ?? [];

  const toast = useToast();
  const patch = async (id: string, body: Record<string, unknown>) => {
    setBusy(true); setMenuFor(null);
    try { await apiFetch(`/team/${id}`, { method: "PATCH", body: JSON.stringify(body) }); toast.success("Team updated"); reload(); }
    catch (e) { toast.error(e instanceof ApiError ? e.message : "Could not update."); }
    finally { setBusy(false); }
  };

  return (
    <>
      <Topbar title="Team" />
      <AppMain>
        {error && <ErrorBanner onRetry={reload} />}
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div><h1 className="text-[20px] font-bold text-n900">Team</h1><p className="mt-0.5 text-[12px] text-n500">The people who work your leads, inventory and calendar.</p></div>
          {canManage && <button onClick={() => setInviting(true)} className="btn-brand inline-flex h-9 items-center gap-2 rounded-lg px-4 text-[13px] font-semibold"><UserPlus className="h-4 w-4" />Invite teammate</button>}
        </div>

        {canManage && <RoutingCard />}

        <Card>
          {loading ? (
            <SkeletonRows rows={5} cols={5} />
          ) : members.length === 0 ? (
            <div className="px-4 py-16 text-center"><p className="text-[14px] font-semibold text-n800">No teammates yet</p><p className="mx-auto mt-1 max-w-[42ch] text-[12.5px] text-n500">Invite your salespeople and managers so you can assign and route leads.</p></div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-[13px]">
                <thead className="border-b border-n200 text-[11px] font-bold uppercase tracking-wide text-n500"><tr>
                  <th className="px-4 py-2.5">Person</th><th className="px-2">Role</th><th className="px-2">Status</th><th className="px-2 text-right">Assigned leads</th><th className="px-2">Last active</th><th className="w-10 px-2" />
                </tr></thead>
                <tbody>
                  {members.map((m) => (
                    <tr key={m.id} className="border-b border-n100 transition last:border-0 hover:bg-n50">
                      <td className="px-4 py-2.5"><div className="flex items-center gap-2.5"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-[12px] font-semibold text-white" style={{ background: avatarBg(m.name) }}>{initials(m.name)}</span><div className="min-w-0 leading-tight"><p className="truncate font-semibold text-n900">{m.name}</p><p className="truncate text-[11.5px] text-n500">{m.email}</p></div></div></td>
                      <td className="px-2 text-[12.5px] text-n700">{ROLE_LABEL[m.role] ?? m.role}</td>
                      <td className="px-2"><span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-[11.5px] font-semibold", STATUS_PILL[m.status] ?? "bg-n100 text-n600")}>{STATUS_LABEL[m.status] ?? m.status}</span></td>
                      <td className="tnum px-2 text-right text-[12.5px] text-n700">{m.assignedLeads}</td>
                      <td className="px-2 text-[12.5px] text-n500">{m.lastActive ?? "—"}</td>
                      <td className="px-2 text-right">
                        {canManage && m.role !== "OWNER" && m.id !== me?.userId && (
                          <div className="relative inline-block">
                            <button onClick={() => setMenuFor(menuFor === m.id ? null : m.id)} disabled={busy} className="grid h-7 w-7 place-items-center rounded-md text-n400 transition hover:bg-n100 hover:text-n700"><MoreVertical className="h-4 w-4" /></button>
                            {menuFor === m.id && (<>
                              <div className="fixed inset-0 z-10" onClick={() => setMenuFor(null)} />
                              <div className="absolute right-0 top-full z-20 mt-1 w-44 rounded-lg border border-n200 bg-white py-1 sh-raised">
                                {m.role === "STAFF"
                                  ? <button onClick={() => patch(m.id, { role: "MANAGER" })} className="block w-full px-3 py-1.5 text-left text-[12.5px] text-n700 hover:bg-n50">Make manager</button>
                                  : <button onClick={() => patch(m.id, { role: "STAFF" })} className="block w-full px-3 py-1.5 text-left text-[12.5px] text-n700 hover:bg-n50">Make salesperson</button>}
                                {m.status === "DISABLED"
                                  ? <button onClick={() => patch(m.id, { status: "ACTIVE" })} className="block w-full px-3 py-1.5 text-left text-[12.5px] text-ok hover:bg-n50">Re-enable</button>
                                  : <button onClick={() => patch(m.id, { status: "DISABLED" })} className="block w-full px-3 py-1.5 text-left text-[12.5px] text-err hover:bg-err-soft">Disable access</button>}
                              </div>
                            </>)}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </AppMain>
      {inviting && <InviteTeammateSheet open onClose={() => setInviting(false)} onInvited={reload} />}
    </>
  );
}
