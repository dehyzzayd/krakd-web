"use client";

import { useEffect, useState } from "react";
import { setSession } from "@/lib/api";
import { Eye, X } from "lucide-react";

const KEY = "krakd_impersonate_restore";

export function ImpersonationBanner() {
  const [on, setOn] = useState(false);
  useEffect(() => { setOn(typeof window !== "undefined" && !!localStorage.getItem(KEY)); }, []);
  if (!on) return null;

  const exit = () => {
    const raw = localStorage.getItem(KEY);
    localStorage.removeItem(KEY);
    if (raw) { try { setSession(JSON.parse(raw)); } catch { /* ignore */ } }
    window.location.href = "/admin/clients";
  };

  return (
    <div className="flex items-center justify-center gap-3 bg-[#0a0a0a] px-4 py-2 text-[12.5px] font-medium text-white">
      <Eye className="h-3.5 w-3.5 text-brand" />
      <span>Krakd internal — <span className="font-semibold">viewing as client</span>. Changes affect the client&apos;s real account.</span>
      <button onClick={exit} className="inline-flex items-center gap-1 rounded-md bg-white/15 px-2.5 py-1 font-semibold text-white transition hover:bg-white/25"><X className="h-3 w-3" />Exit to Krakd admin</button>
    </div>
  );
}
