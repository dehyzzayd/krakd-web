import type { ReactNode } from "react";

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-[14px] border border-[#eceef2] bg-white sh-card ${className}`}>{children}</div>;
}

export function CardHead({ title, right }: { title: string; right?: ReactNode }) {
  return (
    <div className="flex items-center justify-between border-b border-[#eceef2] px-5 py-3.5">
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
