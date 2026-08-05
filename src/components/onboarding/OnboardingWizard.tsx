"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { authApi, setSession, ApiError } from "@/lib/api";
import { Logo } from "@/components/layout/Logo";
import { Field } from "@/components/auth/AuthScaffold";
import { VEHICLE_TYPES } from "./VehicleIcons";
import { formatUSPhone } from "@/lib/phone";
import { Car, Home, UtensilsCrossed, Scissors, ShoppingBag, LayoutGrid, Stethoscope, HardHat, type LucideIcon } from "lucide-react";

/* ─────────────────────────────── data ─────────────────────────────── */

const STEPS = ["Verify email", "Your business", "Location & contact", "Choose plan", "Review & pay"];

/** The industry picked in step 2 sets Dealership.vertical and reskins the whole workspace. */
type Industry = { id: string; label: string; Icon: LucideIcon; nameLabel: string; namePh: string; catalog: string; auto?: boolean };
const INDUSTRIES: Industry[] = [
  { id: "AUTOMOTIVE", label: "Automotive", Icon: Car, nameLabel: "Dealership name", namePh: "Downtown Auto", catalog: "inventory", auto: true },
  { id: "REAL_ESTATE", label: "Real estate", Icon: Home, nameLabel: "Brokerage name", namePh: "Northpeak Realty", catalog: "listings" },
  { id: "RESTAURANT", label: "Restaurant", Icon: UtensilsCrossed, nameLabel: "Restaurant name", namePh: "Blue Fig Kitchen", catalog: "menu" },
  { id: "SERVICES", label: "Services", Icon: Scissors, nameLabel: "Business name", namePh: "Summit Detailing", catalog: "services" },
  { id: "RETAIL", label: "Retail", Icon: ShoppingBag, nameLabel: "Store name", namePh: "Maple & Co.", catalog: "products" },
  { id: "MEDICAL", label: "Medical / dental", Icon: Stethoscope, nameLabel: "Practice name", namePh: "Cedar Dental", catalog: "services" },
  { id: "CONSTRUCTION", label: "Construction", Icon: HardHat, nameLabel: "Company name", namePh: "Summit Builders", catalog: "projects" },
  { id: "GENERIC", label: "Something else", Icon: LayoutGrid, nameLabel: "Business name", namePh: "Your business", catalog: "catalog" },
];
const industryOf = (id: string) => INDUSTRIES.find((x) => x.id === id) ?? INDUSTRIES[0];

const PLANS = [
  { id: "starter", name: "Starter", price: 149, blurb: "Single lot. Inventory, syndication, CRM, one inbox, AI follow-up." },
  { id: "growth", name: "Growth", price: 349, featured: true, blurb: "Everything in Starter + AI voice, marketing automation, full attribution." },
  { id: "scale", name: "Scale", price: null as number | null, blurb: "Multi-store groups, API access, dedicated onboarding." },
];

const US_STATES = "AL AK AZ AR CA CO CT DE FL GA HI ID IL IN IA KS KY LA ME MD MA MI MN MS MO MT NE NV NH NJ NM NY NC ND OH OK OR PA RI SC SD TN TX UT VT VA WA WV WI WY".split(" ");

type Form = {
  vertical: string;
  dealership: string;
  types: string[];
  storeType: string;
  street: string;
  unit: string;
  city: string;
  state: string;
  zip: string;
  phone: string;
};

const EMPTY: Form = {
  vertical: "AUTOMOTIVE", dealership: "", types: [], storeType: "Independent lot",
  street: "", unit: "", city: "", state: "", zip: "", phone: "",
};


function priceFor(id: string, cycle: "monthly" | "annual") {
  const p = PLANS.find((x) => x.id === id)!;
  if (p.price == null) return { label: "Custom", monthly: null as number | null };
  const m = cycle === "annual" ? Math.round(p.price * 0.83) : p.price;
  return { label: `$${m}/mo`, monthly: m };
}

/* ─────────────────────────────── shell ─────────────────────────────── */

function Rail({ step }: { step: number }) {
  return (
    <div
      className="relative flex min-h-dvh flex-col justify-between overflow-hidden p-12 xl:p-16"
      style={{ backgroundImage: "url(/hero-bg.png)", backgroundSize: "cover", backgroundPosition: "center" }}
    >
      <div className="absolute inset-0" style={{ background: "linear-gradient(135deg, rgba(4,10,30,0.3) 0%, rgba(4,10,30,0) 45%, rgba(4,10,30,0.45) 100%)" }} aria-hidden />
      <a href="/" className="relative">
        <Logo onDark className="text-[24px]" />
      </a>
      <div className="relative">
        <h2 className="max-w-[14ch] text-[40px] font-semibold leading-[1] tracking-[-0.03em] text-white xl:text-[46px]">
          Set up your business.
        </h2>
        <ol className="mt-10 space-y-1">
          {STEPS.map((label, i) => {
            const done = i < step;
            const active = i === step;
            return (
              <li key={label} className="flex items-center gap-4 py-2">
                <span className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[13px] font-semibold transition ${done ? "bg-white text-ink" : active ? "border-2 border-white text-white" : "border border-white/30 text-white/45"}`}>
                  {done ? "✓" : i + 1}
                </span>
                <span className={`text-[15px] transition ${active ? "font-semibold text-white" : done ? "text-white/80" : "text-white/45"}`}>{label}</span>
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}

function Panel({ step, children }: { step: number; children: ReactNode }) {
  return (
    <div className="min-h-dvh w-full bg-white lg:grid lg:grid-cols-2">
      <aside className="hidden lg:block">
        <Rail step={step} />
      </aside>
      <main className="relative flex min-h-dvh flex-col bg-white px-5 py-14 sm:px-10">
        <div className="mb-8 lg:hidden"><Logo className="text-[22px]" /></div>
        {/* my-auto centres short steps but never clips tall ones (page scrolls) */}
        <div className="mx-auto my-auto w-full max-w-[500px]">{children}</div>
      </main>
    </div>
  );
}

/* ─────────────────────────────── atoms ─────────────────────────────── */

const BTN_PRIMARY = "inline-flex h-12 items-center justify-center rounded-[12px] bg-ink px-6 text-[15px] font-semibold text-white transition hover:bg-black disabled:opacity-40";
const BTN_BACK = "inline-flex h-12 items-center justify-center rounded-[12px] px-4 text-[15px] font-medium text-muted transition hover:text-ink";

function Nav({ onBack, onNext, nextLabel = "Continue" }: { onBack?: () => void; onNext: () => void; nextLabel?: string }) {
  return (
    <div className="mt-9 flex items-center justify-between">
      {onBack ? <button onClick={onBack} className={BTN_BACK}>← Back</button> : <span />}
      <button onClick={onNext} className={BTN_PRIMARY}>{nextLabel}</button>
    </div>
  );
}

function StepHeader({ n, title, sub }: { n: number; title: string; sub: string }) {
  return (
    <div className="mb-8">
      <p className="mb-2 font-mono text-[11px] uppercase tracking-[0.16em] text-muted">Step {n} of 5</p>
      <h1 className="text-[30px] font-semibold tracking-[-0.02em] text-ink">{title}</h1>
      <p className="mt-2 text-[15px] leading-[1.55] text-muted">{sub}</p>
    </div>
  );
}

function Select({ label, id, value, onChange, children }: { label: string; id: string; value: string; onChange: (v: string) => void; children: ReactNode }) {
  return (
    <div>
      <label htmlFor={id} className="mb-2 block text-[14px] font-medium text-ink">{label}</label>
      <select id={id} value={value} onChange={(e) => onChange(e.target.value)} className="h-12 w-full appearance-none rounded-[12px] bg-[#f4f4f5] px-4 text-[15px] text-ink outline-none ring-1 ring-black/[0.04] transition focus:bg-white focus:ring-2 focus:ring-ink/25">
        {children}
      </select>
    </div>
  );
}

function UsFlag() {
  return (
    <svg viewBox="0 0 20 14" className="h-3.5 w-5 shrink-0 overflow-hidden rounded-[3px] ring-1 ring-black/10" aria-hidden>
      <rect width="20" height="14" fill="#fff" />
      {[0, 2, 4, 6, 8, 10, 12].map((y) => <rect key={y} y={y} width="20" height="1.08" fill="#B22234" />)}
      <rect width="9" height="7.6" fill="#3C3B6E" />
    </svg>
  );
}

function PhoneField({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label htmlFor="phone" className="mb-2 block text-[14px] font-medium text-ink">Business phone</label>
      <div className="flex h-12 items-center rounded-[12px] bg-[#f4f4f5] ring-1 ring-black/[0.04] transition focus-within:bg-white focus-within:ring-2 focus-within:ring-ink/25">
        <span className="flex items-center gap-2 border-r border-black/[0.07] pl-4 pr-3 text-[15px] text-ink">
          <UsFlag /> +1
        </span>
        <input
          id="phone"
          type="tel"
          inputMode="tel"
          value={value}
          onChange={(e) => onChange(formatUSPhone(e.target.value))}
          placeholder="(555) 123-4567"
          className="h-full flex-1 rounded-r-[12px] bg-transparent px-4 text-[15px] text-ink outline-none placeholder:text-muted"
        />
      </div>
    </div>
  );
}

/* ─────────────────────────────── steps ─────────────────────────────── */

function VerifyStep({ digits, setDigits, onVerify, onResend, email, busy, error }: { digits: string[]; setDigits: (d: string[]) => void; onVerify: () => void; onResend: () => void; email: string; busy: boolean; error: string | null }) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  const set = (i: number, v: string) => {
    const c = v.replace(/\D/g, "").slice(-1);
    setDigits(digits.map((x, idx) => (idx === i ? c : x)));
    if (c && i < 5) refs.current[i + 1]?.focus();
  };
  const onKey = (i: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !digits[i] && i > 0) refs.current[i - 1]?.focus();
  };
  return (
    <div>
      <StepHeader n={1} title="Verify your email" sub={email ? `We sent a 6-digit code to ${email}. Enter it below to continue.` : "Enter the 6-digit code we emailed you."} />
      <div className="flex gap-2.5 sm:gap-3">
        {digits.map((d, i) => (
          <input key={i} ref={(el) => { refs.current[i] = el; }} value={d} onChange={(e) => set(i, e.target.value)} onKeyDown={(e) => onKey(i, e)} inputMode="numeric" maxLength={1} aria-label={`Digit ${i + 1}`}
            className="h-14 w-full rounded-[12px] bg-[#f4f4f5] text-center text-[22px] font-semibold text-ink outline-none ring-1 ring-black/[0.04] transition focus:bg-white focus:ring-2 focus:ring-ink/25" />
        ))}
      </div>
      <p className="mt-4 text-[13.5px] text-muted">Didn&apos;t get it? <button type="button" onClick={onResend} className="font-medium text-ink underline underline-offset-4 hover:text-ink/70">Resend code</button></p>
      {error && <p className="mt-2 text-[13px] font-medium text-[#dc2626]">{error}</p>}
      <Nav onNext={onVerify} nextLabel={busy ? "Verifying…" : "Verify"} />
    </div>
  );
}

function StoreStep({ form, update, toggleType, onNext }: { form: Form; update: (k: keyof Form, v: string) => void; toggleType: (id: string) => void; onNext: () => void }) {
  const meta = industryOf(form.vertical);
  const storeTypes = meta.auto
    ? ["Independent lot", "Small group (2–5)", "Dealer group", "Franchise"]
    : ["Single location", "Multi-location", "Franchise"];
  const pickIndustry = (id: string) => {
    update("vertical", id);
    update("storeType", industryOf(id).auto ? "Independent lot" : "Single location");
  };
  return (
    <div>
      <StepHeader n={2} title="Tell us about your business" sub={`This tailors your workspace — ${meta.catalog}, roles, channels and pricing.`} />
      <div className="space-y-6">
        <div>
          <p className="mb-2.5 text-[14px] font-medium text-ink">What kind of business?</p>
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
            {INDUSTRIES.map(({ id, label, Icon }) => {
              const on = form.vertical === id;
              return (
                <button key={id} type="button" onClick={() => pickIndustry(id)}
                  className={`flex items-center gap-2.5 rounded-xl border p-3 text-left transition ${on ? "border-ink bg-ink/[0.03] ring-1 ring-ink" : "border-[#e6e6e6] hover:border-[#c9c9c9]"}`}>
                  <Icon className={`h-5 w-5 shrink-0 ${on ? "text-ink" : "text-[#9a9aa2]"}`} />
                  <span className={`text-[13.5px] font-medium leading-tight ${on ? "text-ink" : "text-body"}`}>{label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <Field id="dealership" label={meta.nameLabel} placeholder={meta.namePh} value={form.dealership} onChange={(v) => update("dealership", v)} />

        {meta.auto && (
          <div>
            <p className="mb-2.5 text-[14px] font-medium text-ink">What do you sell?</p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {VEHICLE_TYPES.map(({ id, label, Icon }) => {
                const on = form.types.includes(id);
                return (
                  <button key={id} type="button" onClick={() => toggleType(id)}
                    className={`flex flex-col items-start gap-3 rounded-xl border p-3.5 text-left transition ${on ? "border-ink bg-ink/[0.03] ring-1 ring-ink" : "border-[#e6e6e6] hover:border-[#c9c9c9]"}`}>
                    <Icon className={`h-6 w-6 ${on ? "text-ink" : "text-[#9a9aa2]"}`} />
                    <span className={`text-[13.5px] font-medium leading-tight ${on ? "text-ink" : "text-body"}`}>{label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <Select label={meta.auto ? "Store type" : "Business type"} id="storeType" value={form.storeType} onChange={(v) => update("storeType", v)}>
          {storeTypes.map((t) => <option key={t}>{t}</option>)}
        </Select>
      </div>
      {/* no Back — email is verified and locked once you continue */}
      <Nav onNext={onNext} />
    </div>
  );
}

function ContactStep({ form, update, onBack, onNext }: { form: Form; update: (k: keyof Form, v: string) => void; onBack: () => void; onNext: () => void }) {
  return (
    <div>
      <StepHeader n={3} title="Location & contact" sub="Where your business is and how customers reach you." />
      <div className="space-y-4">
        <Field id="street" label="Street address" placeholder="1200 S Lamar Blvd" value={form.street} onChange={(v) => update("street", v)} autoComplete="address-line1" />
        <Field id="unit" label="Suite / unit (optional)" placeholder="Suite 4" value={form.unit} onChange={(v) => update("unit", v)} autoComplete="address-line2" />
        <div className="grid grid-cols-2 gap-4">
          <Field id="city" label="City" placeholder="Austin" value={form.city} onChange={(v) => update("city", v)} autoComplete="address-level2" />
          <div className="grid grid-cols-2 gap-3">
            <Select label="State" id="state" value={form.state} onChange={(v) => update("state", v)}>
              <option value="">—</option>
              {US_STATES.map((s) => <option key={s}>{s}</option>)}
            </Select>
            <Field id="zip" label="ZIP" placeholder="78704" value={form.zip} onChange={(v) => update("zip", v.replace(/\D/g, "").slice(0, 5))} inputMode="numeric" maxLength={5} />
          </div>
        </div>
        <PhoneField value={form.phone} onChange={(v) => update("phone", v)} />
      </div>
      <Nav onBack={onBack} onNext={onNext} />
    </div>
  );
}

function PlanStep({ plan, setPlan, cycle, setCycle, promo, setPromo, promoOk, beta, applyPromo, onBack, onNext }: {
  plan: string; setPlan: (v: string) => void; cycle: "monthly" | "annual"; setCycle: (v: "monthly" | "annual") => void;
  promo: string; setPromo: (v: string) => void; promoOk: boolean; beta: boolean; applyPromo: () => void; onBack: () => void; onNext: () => void;
}) {
  return (
    <div>
      <StepHeader n={4} title="Choose your plan" sub="14 days free on any plan. No card charged today. Change or cancel anytime." />
      <div className="mb-5 inline-flex rounded-full bg-[#f0f0f0] p-1">
        {(["monthly", "annual"] as const).map((c) => (
          <button key={c} onClick={() => setCycle(c)} className={`h-9 rounded-full px-4 text-[13.5px] font-medium capitalize transition ${cycle === c ? "bg-white text-ink shadow-[0_1px_2px_rgba(15,15,15,0.06)]" : "text-muted"}`}>
            {c}{c === "annual" && <span className="ml-1.5 text-accent">−17%</span>}
          </button>
        ))}
      </div>
      <div className="space-y-3">
        {PLANS.map((p) => {
          const selected = plan === p.id;
          const shown = p.price == null ? "Custom" : cycle === "annual" ? `$${Math.round(p.price * 0.83)}` : `$${p.price}`;
          return (
            <button key={p.id} onClick={() => setPlan(p.id)} className={`flex w-full items-center gap-4 rounded-[16px] border p-4 text-left transition ${selected ? "border-ink ring-1 ring-ink" : "border-[#e6e6e6] hover:border-[#cfcfcf]"}`}>
              <span className={`grid h-5 w-5 shrink-0 place-items-center rounded-full border-2 ${selected ? "border-ink" : "border-[#cfcfcf]"}`}>{selected && <span className="h-2.5 w-2.5 rounded-full bg-ink" />}</span>
              <span className="flex-1">
                <span className="flex items-center gap-2">
                  <span className="text-[16px] font-semibold text-ink">{p.name}</span>
                  {p.featured && <span className="rounded-full bg-accent px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-accent-ink">Popular</span>}
                </span>
                <span className="mt-0.5 block text-[13px] leading-snug text-muted">{p.blurb}</span>
              </span>
              <span className="shrink-0 text-right">
                <span className="text-[20px] font-semibold tracking-[-0.02em] text-ink">{shown}</span>
                {p.price != null && <span className="block text-[11px] text-muted">/mo</span>}
              </span>
            </button>
          );
        })}
      </div>

      {/* access code — Krakd is invite-only */}
      <div className="mt-4">
        <label htmlFor="promo" className="mb-2 block text-[13px] font-medium text-muted">Access code</label>
        <div className="flex gap-2">
          <input id="promo" value={promo} onChange={(e) => setPromo(e.target.value.toUpperCase())} placeholder="Enter your access code"
            className="h-12 flex-1 rounded-[12px] bg-[#f4f4f5] px-4 text-[15px] uppercase text-ink outline-none ring-1 ring-black/[0.04] transition placeholder:normal-case placeholder:text-muted focus:bg-white focus:ring-2 focus:ring-ink/25" />
          <button onClick={applyPromo} className="inline-flex h-12 items-center justify-center rounded-[12px] bg-[#f0f0f0] px-5 text-[14px] font-semibold text-ink transition hover:bg-[#e7e7e7]">Apply</button>
        </div>
        {promoOk && <p className="mt-2 text-[13px] font-medium text-[#1e9e5a]">✓ Code entered — $0 due today. We&apos;ll confirm it in the next step.</p>}
        <p className="mt-1.5 text-[12px] text-muted">Krakd is currently invite-only. You need an access code to continue.</p>
      </div>

      <Nav onBack={onBack} onNext={onNext} />
    </div>
  );
}

function ReviewStep({ form, plan, cycle, promo, promoOk, beta, submitting, error, onEdit, onBack, onFinish }: {
  form: Form; plan: string; cycle: "monthly" | "annual"; promo: string; promoOk: boolean; beta: boolean;
  submitting: boolean; error: string | null; onEdit: () => void; onBack: () => void; onFinish: () => void;
}) {
  const p = PLANS.find((x) => x.id === plan)!;
  const pr = priceFor(plan, cycle);
  const meta = industryOf(form.vertical);
  const typeLabels = form.types.map((t) => VEHICLE_TYPES.find((v) => v.id === t)?.label).filter(Boolean).join(", ") || "—";
  const addr = [form.street, form.unit, [form.city, form.state].filter(Boolean).join(", "), form.zip].filter(Boolean).join(" · ") || "—";

  const Row = ({ k, v }: { k: string; v: string }) => (
    <div className="flex justify-between gap-4 py-2 text-[13.5px]">
      <span className="text-muted">{k}</span>
      <span className="max-w-[62%] text-right font-medium text-ink">{v}</span>
    </div>
  );

  return (
    <div>
      <StepHeader n={5} title="Review & confirm" sub="Check everything below, then continue to secure payment." />

      {/* pricing recap */}
      <div className="rounded-[16px] border border-[#ececec] p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[15px] font-semibold text-ink">Krakd {p.name}</p>
            <p className="text-[12.5px] text-muted capitalize">{cycle} billing · 14-day free trial</p>
          </div>
          <p className="text-[18px] font-semibold text-ink">{pr.label}</p>
        </div>
        <div className="mt-4 border-t border-[#ececec] pt-3">
          {promoOk && (
            <div className="flex justify-between py-1 text-[13.5px]">
              <span className="text-muted">Promo {promo || "code"}</span>
              <span className="font-medium text-[#1e9e5a]">applied</span>
            </div>
          )}
          <div className="flex items-center justify-between pt-1">
            <span className="text-[14px] font-semibold text-ink">Due today</span>
            <span className="text-[16px] font-semibold text-accent">$0.00</span>
          </div>
          <p className="mt-1 text-[12px] text-muted">
            {pr.monthly != null ? `Then ${pr.label} after your trial ends. Cancel anytime.` : "Our team will tailor Scale pricing with you."}
          </p>
        </div>
      </div>

      {/* info recap */}
      <div className="mt-4 rounded-[16px] bg-[#f7f7f8] p-5">
        <div className="flex items-center justify-between">
          <p className="text-[13px] font-semibold uppercase tracking-[0.1em] text-muted">Your business</p>
          <button onClick={onEdit} className="text-[13px] font-medium text-ink underline underline-offset-4 hover:text-ink/70">Edit</button>
        </div>
        <div className="mt-2 divide-y divide-[#ececec]">
          <Row k="Name" v={form.dealership || "—"} />
          <Row k="Industry" v={meta.label} />
          {meta.auto && <Row k="Sells" v={typeLabels} />}
          <Row k={meta.auto ? "Store type" : "Business type"} v={form.storeType} />
          <Row k="Address" v={addr} />
          <Row k="Phone" v={form.phone ? `+1 ${form.phone}` : "—"} />
        </div>
      </div>

      <p className="mt-4 text-[12.5px] leading-snug text-muted">
        {beta
          ? "Access code entered — $0 due today and full dashboard access. Card billing kicks in later. Your code is verified when you activate."
          : "Krakd is invite-only. Enter your access code on the plan step to continue."}
      </p>
      {error && <p className="mt-3 text-[13px] font-medium text-[#dc2626]">{error}</p>}
      <Nav onBack={onBack} onNext={onFinish} nextLabel={submitting ? "Creating account…" : "Activate account →"} />
    </div>
  );
}

function DoneStep({ onGo }: { onGo: () => void }) {
  return (
    <div className="text-center">
      <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-ink text-[26px] text-white">✓</span>
      <h1 className="mt-7 text-[32px] font-semibold tracking-[-0.02em] text-ink">You&apos;re all set.</h1>
      <p className="mx-auto mt-3 max-w-[38ch] text-[15px] leading-[1.55] text-muted">
        Your workspace is ready. Add your catalog, connect your channels, and let the AI start working your leads.
      </p>
      <button onClick={onGo} className="mt-8 inline-flex h-12 items-center justify-center rounded-[12px] bg-ink px-7 text-[15px] font-semibold text-white transition hover:bg-black">Go to dashboard</button>
    </div>
  );
}

/* ─────────────────────────────── wizard ─────────────────────────────── */

export function OnboardingWizard() {
  const [step, setStep] = useState(() => {
    if (typeof window === "undefined") return 0;
    const s = Number(new URLSearchParams(window.location.search).get("step"));
    return Number.isFinite(s) ? Math.min(Math.max(s, 0), 5) : 0;
  });
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [form, setForm] = useState<Form>(EMPTY);
  const [plan, setPlan] = useState("growth");
  const [cycle, setCycle] = useState<"monthly" | "annual">("monthly");
  const [promo, setPromo] = useState("");
  const [promoOk, setPromoOk] = useState(false);
  const [beta, setBeta] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [otpBusy, setOtpBusy] = useState(false);
  const [otpError, setOtpError] = useState<string | null>(null);
  const otpSent = useRef(false);
  const router = useRouter();

  // Email the verification code once, using the address captured at sign-up.
  useEffect(() => {
    const raw = sessionStorage.getItem("krakd_signup");
    if (!raw) return;
    const e = (JSON.parse(raw) as { email?: string }).email ?? "";
    setEmail(e);
    if (e && !otpSent.current) {
      otpSent.current = true;
      authApi.sendOtp(e).catch(() => {});
    }
  }, []);

  const verifyEmail = async () => {
    setOtpError(null);
    const code = otp.join("");
    if (code.length !== 6) { setOtpError("Enter all 6 digits."); return; }
    setOtpBusy(true);
    try {
      await authApi.verifyOtp(code);
      next();
    } catch (e) {
      setOtpError(e instanceof ApiError ? e.message : "Verification failed.");
    } finally {
      setOtpBusy(false);
    }
  };

  const resendOtp = () => {
    setOtpError(null);
    if (email) authApi.sendOtp(email).catch(() => {});
  };

  const update = (k: keyof Form, v: string) => setForm((f) => ({ ...f, [k]: v }));
  const toggleType = (id: string) =>
    setForm((f) => ({ ...f, types: f.types.includes(id) ? f.types.filter((t) => t !== id) : [...f.types, id] }));
  const next = () => setStep((s) => Math.min(s + 1, 5));
  const back = () => setStep((s) => Math.max(s - 1, 0));

  const applyPromo = () => {
    // The real code is validated server-side — the client never knows its value.
    const code = promo.trim();
    setBeta(code.length > 0);
    setPromoOk(code.length > 0);
  };

  /** Final step: create the real dealership account, store the session, land on the dashboard. */
  const finish = async () => {
    setError(null);
    if (!promo.trim()) {
      setError("Enter your access code on the plan step to continue.");
      return;
    }
    const raw = typeof window !== "undefined" ? sessionStorage.getItem("krakd_signup") : null;
    if (!raw) {
      setError("We lost your sign-up details — please start again from Sign up.");
      return;
    }
    const s = JSON.parse(raw) as { firstName: string; lastName: string; email: string; password: string };
    setSubmitting(true);
    try {
      const tokens = await authApi.register({
        dealershipName: form.dealership || `${s.firstName}'s Business`,
        firstName: s.firstName,
        lastName: s.lastName,
        email: s.email,
        password: s.password,
        phone: form.phone || undefined,
        accessCode: promo.trim(),
        vertical: form.vertical,
      });
      setSession(tokens);
      sessionStorage.removeItem("krakd_signup");
      setStep(5);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Could not create your account. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Panel step={Math.min(step, 4)}>
      {step === 0 && <VerifyStep digits={otp} setDigits={setOtp} onVerify={verifyEmail} onResend={resendOtp} email={email} busy={otpBusy} error={otpError} />}
      {step === 1 && <StoreStep form={form} update={update} toggleType={toggleType} onNext={next} />}
      {step === 2 && <ContactStep form={form} update={update} onBack={back} onNext={next} />}
      {step === 3 && <PlanStep plan={plan} setPlan={setPlan} cycle={cycle} setCycle={setCycle} promo={promo} setPromo={setPromo} promoOk={promoOk} beta={beta} applyPromo={applyPromo} onBack={back} onNext={next} />}
      {step === 4 && <ReviewStep form={form} plan={plan} cycle={cycle} promo={promo} promoOk={promoOk} beta={beta} submitting={submitting} error={error} onEdit={() => setStep(1)} onBack={back} onFinish={finish} />}
      {step === 5 && <DoneStep onGo={() => router.push("/dashboard")} />}
    </Panel>
  );
}
