import type { ReactNode } from "react";
import { CloudOff, RotateCw } from "lucide-react";

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-2xl border border-n200 bg-white sh-card ${className}`}>{children}</div>;
}

/** Compact inline banner for a failed/stale fetch — sits atop the page with a retry. */
export function ErrorBanner({ onRetry }: { onRetry?: () => void }) {
  return (
    <div className="mb-4 flex items-center gap-3 rounded-xl border border-warn/30 bg-warn-soft/50 px-4 py-2.5">
      <CloudOff className="h-4 w-4 shrink-0 text-warn" />
      <p className="flex-1 text-[12.5px] font-medium text-n800">Couldn&apos;t reach the server just now.</p>
      {onRetry && <button onClick={onRetry} className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-n200 bg-white px-3 text-[12px] font-semibold text-n700 transition hover:bg-n100"><RotateCw className="h-3.5 w-3.5" />Retry</button>}
    </div>
  );
}

/** Recoverable error state — shown when a fetch fails after auto-retries. */
export function ErrorState({ onRetry, message }: { onRetry?: () => void; message?: string }) {
  return (
    <div className="mx-auto max-w-[420px] px-6 py-16 text-center">
      <span className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-n100 text-n400"><CloudOff className="h-6 w-6" /></span>
      <p className="text-[15px] font-semibold text-n900">Couldn&apos;t load this</p>
      <p className="mx-auto mt-1.5 max-w-[40ch] text-[13px] leading-relaxed text-n500">{message || "Something interrupted the connection. It may just be a blip — try again."}</p>
      {onRetry && <button onClick={onRetry} className="mt-4 inline-flex h-9 items-center gap-2 rounded-lg bg-brand px-4 text-[12.5px] font-semibold text-white transition hover:bg-brand-hover"><RotateCw className="h-4 w-4" />Try again</button>}
    </div>
  );
}

export function CardHead({ title, right }: { title: string; right?: ReactNode }) {
  return (
    <div className="flex items-center justify-between border-b border-[#e4e7ec] px-5 py-3.5">
      <h2 className="text-[14px] font-semibold tracking-[-0.01em] text-n900">{title}</h2>
      {right}
    </div>
  );
}

export type Tone = "brand" | "ok" | "warn" | "err" | "neutral";

const TONES: Record<Tone, string> = {
  brand: "bg-brand-soft text-brand",
  ok: "bg-ok-soft text-ok",
  warn: "bg-warn-soft text-warn",
  err: "bg-err-soft text-err",
  neutral: "bg-n100 text-n600",
};
const DOTS: Record<Tone, string> = {
  brand: "bg-brand", ok: "bg-ok", warn: "bg-warn", err: "bg-err", neutral: "bg-n400",
};

export function Badge({ children, tone = "neutral" }: { children: ReactNode; tone?: Tone }) {
  return <span className={`inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[11.5px] font-medium ${TONES[tone]}`}>{children}</span>;
}

export function Dot({ tone }: { tone: Tone }) {
  return <span className={`h-1.5 w-1.5 rounded-full ${DOTS[tone]}`} />;
}
