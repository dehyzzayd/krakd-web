"use client";

import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import { Check, X, AlertTriangle, Info } from "lucide-react";
import { cn } from "@/lib/cn";

type Kind = "success" | "error" | "info";
type Toast = { id: number; kind: Kind; msg: string };

const ToastCtx = createContext<{ push: (kind: Kind, msg: string) => void } | null>(null);
let counter = 0;

const STYLE: Record<Kind, { icon: React.ComponentType<{ className?: string }>; ring: string; tone: string }> = {
  success: { icon: Check, ring: "border-ok/30", tone: "text-ok" },
  error: { icon: AlertTriangle, ring: "border-err/30", tone: "text-err" },
  info: { icon: Info, ring: "border-brand/30", tone: "text-brand" },
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const remove = useCallback((id: number) => setToasts((t) => t.filter((x) => x.id !== id)), []);
  const push = useCallback((kind: Kind, msg: string) => {
    const id = ++counter;
    setToasts((t) => [...t, { id, kind, msg }]);
    setTimeout(() => remove(id), 2800);
  }, [remove]);

  return (
    <ToastCtx.Provider value={{ push }}>
      {children}
      <div className="pointer-events-none fixed right-4 top-4 z-[100] flex w-[320px] max-w-[calc(100vw-2rem)] flex-col gap-2">
        {toasts.map((t) => {
          const s = STYLE[t.kind];
          return (
            <div key={t.id} className={cn("toast-in pointer-events-auto flex items-start gap-2.5 rounded-xl border bg-white px-3.5 py-3 shadow-lg", s.ring)}>
              <span className={cn("mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full", s.tone)}><s.icon className="h-4 w-4" /></span>
              <p className="flex-1 text-[13px] font-medium leading-snug text-n900">{t.msg}</p>
              <button onClick={() => remove(t.id)} className="shrink-0 text-n400 transition hover:text-n700"><X className="h-4 w-4" /></button>
            </div>
          );
        })}
      </div>
    </ToastCtx.Provider>
  );
}

/** toast.success("Saved") from any client component under the dashboard. */
export function useToast() {
  const ctx = useContext(ToastCtx);
  return {
    success: (m: string) => ctx?.push("success", m),
    error: (m: string) => ctx?.push("error", m),
    info: (m: string) => ctx?.push("info", m),
  };
}
