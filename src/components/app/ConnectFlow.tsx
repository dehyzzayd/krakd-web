"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";
import { Drawer, Segmented, BudgetSlider, Estimates, perLabel, MIN_BUDGET, type Freq } from "./budget";
import { Dot } from "./AppKit";

type Objective = "leads" | "calls" | "traffic" | "messages";
type Gender = "all" | "men" | "women";

function Toggle({ on, onToggle, label }: { on: boolean; onToggle: () => void; label: string }) {
  return (
    <button type="button" onClick={onToggle} className="flex w-full items-center justify-between rounded-lg border border-n200 bg-white px-3 py-2.5 text-left transition hover:bg-n50">
      <span className="text-[13px] font-medium text-n800">{label}</span>
      <span className={cn("relative h-5 w-9 rounded-full transition", on ? "bg-brand" : "bg-n300")}>
        <span className={cn("absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all", on ? "left-[18px]" : "left-0.5")} />
      </span>
    </button>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-1.5 text-[13px] font-medium text-n800">{label}</p>
      {children}
    </div>
  );
}

const selectCls = "h-10 w-full appearance-none rounded-lg border border-n200 bg-white px-3 text-[13px] text-n800 outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/15";

export function ConnectFlow({ network }: { network: { id: string; name: string; logo: string } }) {
  const [step, setStep] = useState(0); // 0 = closed
  const [objective, setObjective] = useState<Objective>("leads");
  const [inventory, setInventory] = useState("all");
  const [radius, setRadius] = useState(25);
  const [ageMin, setAgeMin] = useState(25);
  const [ageMax, setAgeMax] = useState(65);
  const [gender, setGender] = useState<Gender>("all");
  const [lookalike, setLookalike] = useState(true);
  const [budget, setBudget] = useState(500);
  const [freq, setFreq] = useState<Freq>("monthly");

  const titles = ["", `Authorize ${network.name}`, "Targeting preferences", "Budget & estimate", "You're live"];
  const ages = Array.from({ length: 48 }, (_, i) => 18 + i);

  const footer = (
    <div className="flex items-center justify-between">
      {step > 1 && step < 4 ? <button onClick={() => setStep(step - 1)} className="h-10 rounded-lg px-3 text-[13px] font-medium text-n600 transition hover:text-n900">← Back</button> : <span />}
      {step === 1 && (
        <button onClick={() => setStep(2)} className="inline-flex h-10 items-center gap-2 rounded-lg bg-brand px-4 text-[13.5px] font-semibold text-white transition hover:bg-brand-hover">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={network.logo} alt="" className="h-4 w-4 brightness-0 invert" />Continue with {network.name}
        </button>
      )}
      {step === 2 && <button onClick={() => setStep(3)} className="h-10 rounded-lg bg-brand px-5 text-[13.5px] font-semibold text-white transition hover:bg-brand-hover">Continue</button>}
      {step === 3 && <button onClick={() => setStep(4)} className="h-10 rounded-lg bg-brand px-5 text-[13.5px] font-semibold text-white transition hover:bg-brand-hover">Launch · ${budget.toLocaleString()}/{perLabel(freq)}</button>}
      {step === 4 && <a href="/dashboard/marketing" className="h-10 w-full rounded-lg bg-brand text-center text-[13.5px] font-semibold leading-10 text-white transition hover:bg-brand-hover">Go to overview</a>}
    </div>
  );

  return (
    <>
      {/* connect intro */}
      <div className="mx-auto max-w-[520px] py-10 text-center">
        <span className="mx-auto grid h-16 w-16 place-items-center rounded-2xl border border-n200 bg-white sh-card">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={network.logo} alt={network.name} className="h-8 w-8" />
        </span>
        <h2 className="mt-6 text-[22px] font-semibold text-n900">Connect {network.name}</h2>
        <p className="mx-auto mt-2 max-w-[42ch] text-[14px] leading-[1.55] text-n600">
          Link your {network.name} account to launch campaigns, sync leads into your CRM, and track real cost-per-sale — all from Krakd.
        </p>
        <div className="mx-auto mt-6 max-w-[360px] space-y-2 text-left">
          {["Publish inventory ads in a few clicks", "Leads flow into your pipeline instantly", "Target by radius, age and audience"].map((t) => (
            <div key={t} className="flex items-center gap-2.5 text-[13px] text-n700"><Dot tone="ok" />{t}</div>
          ))}
        </div>
        <button onClick={() => setStep(1)} className="mt-7 inline-flex h-11 items-center gap-2 rounded-lg bg-brand px-5 text-[14px] font-semibold text-white transition hover:bg-brand-hover">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={network.logo} alt="" className="h-4 w-4 brightness-0 invert" />
          Set up {network.name}
        </button>
        <p className="mt-3 text-[12px] text-n500">Authorize, set targeting, pick a budget — you&apos;re live.</p>
      </div>

      <Drawer open={step > 0} onClose={() => setStep(0)} title={titles[step] || `Set up ${network.name}`} footer={footer}>
        <div className="mb-5 flex items-center gap-1.5">
          {[1, 2, 3, 4].map((s) => <span key={s} className={cn("h-1.5 rounded-full transition-all", s === step ? "w-5 bg-brand" : s < step ? "w-1.5 bg-brand" : "w-1.5 bg-n300")} />)}
        </div>

        {step === 1 && (
          <div className="py-4 text-center">
            <span className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-n100">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={network.logo} alt="" className="h-8 w-8" />
            </span>
            <h4 className="mt-4 text-[16px] font-semibold text-n900">Authorize your {network.name} account</h4>
            <p className="mx-auto mt-1.5 max-w-[38ch] text-[13px] leading-snug text-n600">Krakd publishes campaigns and syncs leads back automatically. You stay the advertiser of record.</p>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-5">
            <Field label="Objective">
              <Segmented value={objective} onChange={setObjective} options={[{ v: "leads", label: "Leads" }, { v: "calls", label: "Calls" }, { v: "traffic", label: "Traffic" }, { v: "messages", label: "Messages" }]} />
            </Field>
            <Field label="Promote">
              <select value={inventory} onChange={(e) => setInventory(e.target.value)} className={selectCls}>
                <option value="all">All inventory</option>
                <option value="featured">Featured units</option>
                <option value="trucks">Trucks &amp; SUVs</option>
                <option value="under20">Under $20k</option>
                <option value="aging">Aging units (45d+)</option>
              </select>
            </Field>
            <Field label={`Radius · ${radius} miles`}>
              <input type="range" min={5} max={100} step={5} value={radius} onChange={(e) => setRadius(+e.target.value)} className="w-full accent-brand" />
              <div className="tnum mt-1 flex justify-between text-[11px] text-n400"><span>5 mi</span><span>100 mi</span></div>
            </Field>
            <Field label="Age range">
              <div className="flex items-center gap-2">
                <select value={ageMin} onChange={(e) => setAgeMin(Math.min(+e.target.value, ageMax))} className={selectCls}>{ages.map((a) => <option key={a}>{a}</option>)}</select>
                <span className="text-n400">to</span>
                <select value={ageMax} onChange={(e) => setAgeMax(Math.max(+e.target.value, ageMin))} className={selectCls}>{ages.map((a) => <option key={a}>{a}</option>)}</select>
              </div>
            </Field>
            <Field label="Gender">
              <Segmented value={gender} onChange={setGender} options={[{ v: "all", label: "All" }, { v: "men", label: "Men" }, { v: "women", label: "Women" }]} />
            </Field>
            <Toggle on={lookalike} onToggle={() => setLookalike((v) => !v)} label="Auto-target + lookalikes from buyers" />
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6">
            <div>
              <p className="mb-2 text-[13px] font-medium text-n800">Budget</p>
              <BudgetSlider value={budget} onChange={setBudget} />
              <p className="tnum mt-1 text-[11.5px] text-n500">Minimum ${MIN_BUDGET}</p>
            </div>
            <Field label="Frequency">
              <Segmented value={freq} onChange={setFreq} options={[{ v: "one-time", label: "One-time" }, { v: "weekly", label: "Weekly" }, { v: "monthly", label: "Monthly" }]} />
            </Field>
            <div>
              <p className="mb-2 text-[13px] font-medium text-n800">Estimated performance</p>
              <Estimates budget={budget} freq={freq} />
              <p className="mt-2 text-[11.5px] text-n500">Estimates update with your budget, radius and audience. Actual results vary.</p>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="py-6 text-center">
            <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-ok text-[26px] text-white">✓</span>
            <h4 className="mt-4 text-[17px] font-semibold text-n900">You&apos;re live on {network.name}</h4>
            <p className="mx-auto mt-1.5 max-w-[36ch] text-[13px] leading-snug text-n600">
              <span className="font-semibold text-n900">${budget.toLocaleString()}</span> / {perLabel(freq)} · {radius} mi · ages {ageMin}–{ageMax}. Krakd starts optimizing within the hour.
            </p>
          </div>
        )}
      </Drawer>
    </>
  );
}
