import type { ReactNode } from "react";
import { Logo } from "@/components/layout/Logo";

/* ── split-screen shell: blue image aside + light form panel ─────────── */
export function AuthShell({
  aside,
  children,
}: {
  aside: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="min-h-dvh w-full bg-white lg:grid lg:grid-cols-2">
      {/* blue aside — hero gradient reused */}
      <aside
        className="relative hidden flex-col justify-between overflow-hidden p-12 lg:flex xl:p-16"
        style={{
          backgroundImage: "url(/hero-bg.webp)",
          backgroundColor: "#173a5e",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(135deg, rgba(4,10,30,0.28) 0%, rgba(4,10,30,0) 42%, rgba(4,10,30,0.45) 100%)",
          }}
          aria-hidden
        />
        <a href="/" className="relative">
          <Logo onDark className="text-[24px]" />
        </a>
        <div className="relative">{aside}</div>
      </aside>

      {/* light form panel */}
      <main className="relative flex min-h-dvh flex-col bg-white px-5 py-14 sm:px-10">
        <div className="mb-10 lg:hidden">
          <a href="/">
            <Logo className="text-[22px]" />
          </a>
        </div>
        {/* my-auto centres short content but never clips tall content */}
        <div className="mx-auto my-auto w-full max-w-[452px]">{children}</div>
      </main>
    </div>
  );
}

/* ── numbered step cards on the blue aside ───────────────────────────── */
export function StepCards({
  steps,
}: {
  steps: { label: string; active?: boolean }[];
}) {
  return (
    <div className="grid grid-cols-3 gap-3">
      {steps.map((s, i) => (
        <div
          key={s.label}
          className={
            s.active
              ? "rounded-[18px] bg-white p-4 shadow-[0_12px_40px_-12px_rgba(0,0,0,0.5)]"
              : "rounded-[18px] border border-white/15 bg-white/[0.06] p-4 backdrop-blur-sm"
          }
        >
          <span
            className={`inline-flex h-8 w-8 items-center justify-center rounded-full text-[13px] font-semibold ${
              s.active ? "bg-ink text-white" : "border border-white/40 text-white"
            }`}
          >
            {i + 1}
          </span>
          <p
            className={`mt-8 text-[14px] font-medium leading-snug ${
              s.active ? "text-ink" : "text-white/80"
            }`}
          >
            {s.label}
          </p>
        </div>
      ))}
    </div>
  );
}

/* ── light input field ───────────────────────────────────────────────── */
export function Field({
  label,
  hint,
  id,
  type = "text",
  placeholder,
  autoComplete,
  trailing,
  value,
  onChange,
  inputMode,
  maxLength,
}: {
  label: string;
  hint?: string;
  id: string;
  type?: string;
  placeholder?: string;
  autoComplete?: string;
  trailing?: ReactNode;
  value?: string;
  onChange?: (v: string) => void;
  inputMode?: "text" | "numeric" | "tel" | "email";
  maxLength?: number;
}) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <label htmlFor={id} className="text-[14px] font-medium text-ink">
          {label}
        </label>
        {trailing}
      </div>
      <input
        id={id}
        name={id}
        type={type}
        placeholder={placeholder}
        autoComplete={autoComplete}
        inputMode={inputMode}
        maxLength={maxLength}
        {...(onChange ? { value: value ?? "", onChange: (e) => onChange(e.target.value) } : {})}
        className="h-12 w-full rounded-[12px] bg-[#f4f4f5] px-4 text-[15px] text-ink outline-none ring-1 ring-black/[0.04] transition placeholder:text-muted focus:bg-white focus:ring-2 focus:ring-ink/25"
      />
      {hint && <p className="mt-2 text-[12px] text-muted">{hint}</p>}
    </div>
  );
}

/* ── "or" divider ────────────────────────────────────────────────────── */
export function OrDivider() {
  return (
    <div className="flex items-center gap-4">
      <span className="h-px flex-1 bg-[#e6e6e6]" />
      <span className="text-[13px] text-muted">or</span>
      <span className="h-px flex-1 bg-[#e6e6e6]" />
    </div>
  );
}

/* ── social sign-in row (brand marks are functional, not decorative) ─── */
export function SocialRow() {
  return (
    <div className="grid grid-cols-3 gap-3">
      {[
        { label: "Google", icon: <GoogleIcon /> },
        { label: "Apple", icon: <AppleIcon /> },
        { label: "Facebook", icon: <FacebookIcon /> },
      ].map((s) => (
        <button
          key={s.label}
          type="button"
          className="inline-flex h-12 items-center justify-center gap-2 rounded-[12px] bg-white text-[13.5px] font-medium text-ink ring-1 ring-[#e6e6e6] transition hover:bg-[#f7f7f7] hover:shadow-[0_2px_10px_rgba(15,15,15,0.06)]"
        >
          {s.icon}
          <span className="hidden sm:inline">{s.label}</span>
        </button>
      ))}
    </div>
  );
}

const BTN_PRIMARY =
  "inline-flex h-12 w-full items-center justify-center rounded-[12px] bg-ink text-[15px] font-semibold text-white transition hover:bg-black focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink";
export { BTN_PRIMARY };

/* ── brand marks ─────────────────────────────────────────────────────── */
function GoogleIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" aria-hidden>
      <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5a5.6 5.6 0 0 1-2.4 3.6v3h3.9c2.3-2.1 3.5-5.2 3.5-8.8Z" />
      <path fill="#34A853" d="M12 24c3.2 0 6-1.1 8-2.9l-3.9-3c-1.1.7-2.5 1.2-4.1 1.2-3.1 0-5.8-2.1-6.7-5H1.3v3.1A12 12 0 0 0 12 24Z" />
      <path fill="#FBBC05" d="M5.3 14.3a7.2 7.2 0 0 1 0-4.6V6.6H1.3a12 12 0 0 0 0 10.8l4-3.1Z" />
      <path fill="#EA4335" d="M12 4.8c1.8 0 3.3.6 4.6 1.8l3.4-3.4A12 12 0 0 0 1.3 6.6l4 3.1C6.2 6.9 8.9 4.8 12 4.8Z" />
    </svg>
  );
}
function AppleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="#0a0a0a" aria-hidden>
      <path d="M16.4 12.7c0-2.3 1.9-3.4 2-3.5-1.1-1.6-2.8-1.8-3.4-1.8-1.4-.1-2.8.8-3.5.8-.7 0-1.9-.8-3.1-.8-1.6 0-3.1.9-3.9 2.4-1.7 2.9-.4 7.2 1.2 9.6.8 1.1 1.7 2.4 3 2.4 1.2-.1 1.6-.8 3.1-.8 1.4 0 1.8.8 3.1.8 1.3 0 2.1-1.2 2.9-2.3.9-1.3 1.3-2.6 1.3-2.7-.1 0-2.5-1-2.5-3.7Zm-2.3-6.8c.7-.8 1.1-2 1-3.1-1 0-2.1.6-2.8 1.4-.6.7-1.2 1.9-1 3 1.1.1 2.2-.5 2.8-1.3Z" />
    </svg>
  );
}
function FacebookIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden>
      <path fill="#1877F2" d="M24 12a12 12 0 1 0-13.9 11.9v-8.4H7.1V12h3V9.4c0-3 1.8-4.6 4.5-4.6 1.3 0 2.7.2 2.7.2v2.9h-1.5c-1.5 0-2 .9-2 1.9V12h3.3l-.5 3.5h-2.8v8.4A12 12 0 0 0 24 12Z" />
    </svg>
  );
}
