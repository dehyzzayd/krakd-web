"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useSearchParams, useRouter } from "next/navigation";
import { cn } from "@/lib/cn";
import { apiFetch, getToken, clearSession } from "@/lib/api";
import { LayoutDashboard, Users, Rocket, Megaphone, Globe, CreditCard, LifeBuoy, ShieldCheck, LogOut, ClipboardCheck } from "lucide-react";

const NAV = [
  { href: "/admin", label: "Overview", Icon: LayoutDashboard, match: (p: string, q: string) => p === "/admin" },
  { href: "/admin/clients", label: "Clients", Icon: Users, match: (p: string, q: string) => p.startsWith("/admin/clients") && !q },
  { href: "/admin/campaigns", label: "Ad review", Icon: ClipboardCheck, match: (p: string, q: string) => p.startsWith("/admin/campaigns") },
  { href: "/admin/clients?queue=onboarding", label: "Onboarding", Icon: Rocket, match: (p: string, q: string) => p.startsWith("/admin/clients") && q === "onboarding" },
  { href: "/admin/clients?queue=advertising", label: "Advertising", Icon: Megaphone, match: (p: string, q: string) => p.startsWith("/admin/clients") && q === "advertising" },
  { href: "/admin/clients?queue=domains", label: "Websites & domains", Icon: Globe, match: (p: string, q: string) => p.startsWith("/admin/clients") && q === "domains" },
  { href: "/admin/clients?queue=billing", label: "Billing", Icon: CreditCard, match: (p: string, q: string) => p.startsWith("/admin/clients") && q === "billing" },
  { href: "/admin/clients?queue=support", label: "Support", Icon: LifeBuoy, match: (p: string, q: string) => p.startsWith("/admin/clients") && q === "support" },
  { href: "/admin/team", label: "Team & access", Icon: ShieldCheck, match: (p: string, q: string) => p.startsWith("/admin/team") },
];

function AdminNav() {
  const pathname = usePathname();
  const q = useSearchParams().get("queue") ?? "";
  return (
    <nav className="flex-1 space-y-0.5">
      {NAV.map((n) => {
        const active = n.match(pathname, q);
        return <Link key={n.label} href={n.href} className={cn("flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-medium transition", active ? "bg-white/10 text-white" : "text-white/60 hover:bg-white/5 hover:text-white")}><n.Icon className="h-[17px] w-[17px]" />{n.label}</Link>;
      })}
    </nav>
  );
}

export function AdminShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [me, setMe] = useState<{ email: string; role: string } | null>(null);
  const [state, setState] = useState<"loading" | "ok" | "denied">("loading");

  useEffect(() => {
    if (!getToken()) { router.replace("/login?next=/admin"); return; }
    apiFetch<{ email: string; role: string }>("/auth/me")
      .then((u) => { if (u.role === "PLATFORM_ADMIN") { setMe(u); setState("ok"); } else setState("denied"); })
      .catch(() => router.replace("/login?next=/admin"));
  }, [router]);

  if (state === "loading") return <div className="grid min-h-dvh place-items-center bg-n50 text-[13px] text-n400">Loading Krakd internal…</div>;
  if (state === "denied") return (
    <div className="grid min-h-dvh place-items-center bg-n50 p-6 text-center">
      <div>
        <ShieldCheck className="mx-auto h-8 w-8 text-n300" />
        <p className="mt-3 text-[15px] font-semibold text-n900">Krakd internal access only</p>
        <p className="mt-1 text-[13px] text-n500">You&apos;re signed in as a dealer account, not a Krakd team member.</p>
        <div className="mt-4 flex items-center justify-center gap-3">
          <button onClick={() => { clearSession(); router.replace("/login?next=/admin"); }} className="rounded-lg bg-n900 px-4 py-2 text-[13px] font-semibold text-white">Sign in as Krakd</button>
          <Link href="/dashboard" className="text-[13px] font-semibold text-brand">Your dashboard →</Link>
        </div>
      </div>
    </div>
  );

  const logout = () => { clearSession(); router.replace("/login"); };

  return (
    <div className="flex min-h-dvh bg-n50">
      <aside style={{ backgroundColor: "#0d1117" }} className="sticky top-0 hidden h-dvh w-[228px] shrink-0 flex-col border-r border-white/10 px-3 py-4 lg:flex">
        <div className="px-2 pb-4">
          <p className="text-[16px] font-bold tracking-tight text-white">Krakd<span className="text-brand">.</span></p>
          <p className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-white/40">Internal ops</p>
        </div>
        <Suspense fallback={<div className="flex-1" />}><AdminNav /></Suspense>
        <div className="border-t border-white/10 pt-3">
          <p className="truncate px-2 text-[12px] font-medium text-white/80">{me?.email}</p>
          <p className="px-2 text-[10.5px] text-white/40">Super Admin</p>
          <button onClick={logout} className="mt-2 flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-[12.5px] font-medium text-white/60 hover:bg-white/5 hover:text-white"><LogOut className="h-4 w-4" />Sign out</button>
        </div>
      </aside>
      <main className="min-w-0 flex-1">{children}</main>
    </div>
  );
}
