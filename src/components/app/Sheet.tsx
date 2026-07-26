"use client";

import { type ReactNode } from "react";
import { X } from "lucide-react";

/** Right-side slide-in sheet (shadcn "Sheet" pattern). */
export function Sheet({ open, onClose, title, subtitle, footer, children, width = "max-w-lg" }: {
  open: boolean; onClose: () => void; title: string; subtitle?: string; footer?: ReactNode; children: ReactNode; width?: string;
}) {
  if (!open) return null;
  return (
    <div className="app-scope fixed inset-0 z-[60]" style={{ background: "transparent" }}>
      <div className="overlay-in absolute inset-0 bg-black/10 backdrop-blur-sm" onClick={onClose} aria-hidden />
      <div className={`drawer-in absolute inset-y-0 right-0 flex w-full flex-col border-l border-n200 bg-white shadow-xl ${width}`} role="dialog">
        <div className="flex items-start justify-between gap-3 border-b border-n200 px-6 py-4">
          <div>
            <h2 className="text-[16px] font-semibold text-n900">{title}</h2>
            {subtitle && <p className="mt-0.5 text-[13px] text-n500">{subtitle}</p>}
          </div>
          <button onClick={onClose} aria-label="Close" className="grid h-9 w-9 place-items-center rounded-md text-n500 transition hover:bg-n100"><X className="h-5 w-5" /></button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">{children}</div>
        {footer && <div className="flex items-center justify-end gap-3 border-t border-n200 bg-n50/60 px-6 py-4">{footer}</div>}
      </div>
    </div>
  );
}
