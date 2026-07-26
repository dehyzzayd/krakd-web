"use client";

import { useState } from "react";

export type SiteVehicle = {
  id: string; year: number; make: string; model: string; trim: string;
  price: number; mileage: number; color: string; drivetrain: string; fuel: string; image: string | null;
};
export type SiteData = {
  slug: string;
  dealershipName: string;
  template: "MODERN" | "INVENTORY_FIRST" | "PREMIUM";
  logoUrl: string | null; primaryColor: string;
  headline: string; intro: string; ctaLabel: string;
  phone: string | null; email: string | null; address: string | null; city: string | null; state: string | null; zip: string | null;
  hours: { day: string; open: string; close: string }[];
  socials: Record<string, string>;
  vehicles: SiteVehicle[];
};

const fmt = (n: number) => `$${n.toLocaleString()}`;

export function SiteView({ data }: { data: SiteData }) {
  const accent = /^#[0-9a-fA-F]{6}$/.test(data.primaryColor) ? data.primaryColor : "#2b6ba4";
  const [lead, setLead] = useState<{ vehicle: SiteVehicle | null } | null>(null);
  const cityLine = [data.city, data.state].filter(Boolean).join(", ");

  return (
    <div className="min-h-screen bg-white text-[#0f172a]" style={{ ["--accent" as string]: accent }}>
      {/* header */}
      <header className="sticky top-0 z-30 border-b border-black/10 bg-[#0f172a] text-white">
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-4 px-5">
          {data.logoUrl
            // eslint-disable-next-line @next/next/no-img-element
            ? <img src={data.logoUrl} alt={data.dealershipName} className="h-7 w-auto" />
            : <span className="text-[15px] font-bold tracking-tight">{data.dealershipName}</span>}
          <nav className="ml-auto hidden items-center gap-6 text-[13px] text-white/80 sm:flex">
            <a href="#inventory" className="hover:text-white">Inventory</a>
            <a href="#contact" className="hover:text-white">Contact</a>
          </nav>
          <button onClick={() => setLead({ vehicle: null })} className="rounded-md px-3.5 py-1.5 text-[12.5px] font-semibold text-white" style={{ background: accent }}>Contact us</button>
        </div>
      </header>

      {/* hero — varies by template */}
      {data.template === "INVENTORY_FIRST" ? (
        <section className="border-b border-black/5 bg-[#f4f6f9]">
          <div className="mx-auto max-w-6xl px-5 py-12 text-center">
            <h1 className="text-[26px] font-bold tracking-tight sm:text-[32px]">{data.headline}</h1>
            {data.intro && <p className="mx-auto mt-2 max-w-[52ch] text-[14px] text-[#475569]">{data.intro}</p>}
            <a href="#inventory" className="mt-6 inline-flex items-center rounded-lg px-6 py-3 text-[14px] font-semibold text-white" style={{ background: accent }}>{data.ctaLabel}</a>
          </div>
        </section>
      ) : data.template === "PREMIUM" ? (
        <section className="text-white" style={{ background: `linear-gradient(135deg, ${accent} 0%, #0f172a 100%)` }}>
          <div className="mx-auto max-w-6xl px-5 py-20">
            <h1 className="max-w-[16ch] text-[34px] font-bold leading-[1.05] tracking-tight sm:text-[46px]">{data.headline}</h1>
            {data.intro && <p className="mt-4 max-w-[54ch] text-[15px] text-white/85">{data.intro}</p>}
            <a href="#inventory" className="mt-8 inline-flex items-center rounded-lg bg-white px-6 py-3 text-[14px] font-semibold" style={{ color: accent }}>{data.ctaLabel}</a>
          </div>
        </section>
      ) : (
        <section className="border-b border-black/5">
          <div className="mx-auto grid max-w-6xl items-center gap-8 px-5 py-16 sm:grid-cols-2">
            <div>
              <h1 className="text-[30px] font-bold leading-tight tracking-tight sm:text-[38px]">{data.headline}</h1>
              {data.intro && <p className="mt-3 max-w-[46ch] text-[14.5px] text-[#475569]">{data.intro}</p>}
              <a href="#inventory" className="mt-6 inline-flex items-center rounded-lg px-6 py-3 text-[14px] font-semibold text-white" style={{ background: accent }}>{data.ctaLabel}</a>
            </div>
            <div className="rounded-2xl border border-black/5 bg-[#f4f6f9] p-6">
              <p className="text-[12px] font-semibold uppercase tracking-wide" style={{ color: accent }}>Now on the lot</p>
              <p className="mt-1 text-[15px] font-semibold">{data.vehicles.length} vehicle{data.vehicles.length === 1 ? "" : "s"} available</p>
              <p className="mt-1 text-[13px] text-[#475569]">Live inventory — updated as cars arrive and sell.</p>
            </div>
          </div>
        </section>
      )}

      {/* inventory */}
      <section id="inventory" className="mx-auto max-w-6xl px-5 py-14">
        <div className="mb-6 flex items-end justify-between">
          <h2 className="text-[22px] font-bold tracking-tight">Available inventory</h2>
          <span className="text-[13px] text-[#64748b]">{data.vehicles.length} listed</span>
        </div>
        {data.vehicles.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-black/10 py-16 text-center text-[14px] text-[#64748b]">
            Fresh inventory is on the way. Contact us and we&apos;ll find the right vehicle for you.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {data.vehicles.map((v) => (
              <div key={v.id} className="overflow-hidden rounded-2xl border border-black/8 bg-white shadow-sm transition hover:shadow-md">
                <div className="aspect-[4/3] bg-[#e8edf3]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  {v.image ? <img src={v.image} alt={`${v.year} ${v.make} ${v.model}`} className="h-full w-full object-cover" /> : <div className="grid h-full place-items-center text-[13px] text-[#94a3b8]">Photos coming soon</div>}
                </div>
                <div className="p-4">
                  <p className="text-[15px] font-semibold">{v.year} {v.make} {v.model}</p>
                  <p className="text-[12.5px] text-[#64748b]">{[v.trim, v.mileage ? `${v.mileage.toLocaleString()} mi` : "", v.drivetrain].filter(Boolean).join(" · ")}</p>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-[18px] font-bold" style={{ color: accent }}>{v.price ? fmt(v.price) : "Call"}</span>
                    <button onClick={() => setLead({ vehicle: v })} className="rounded-lg px-3 py-1.5 text-[12.5px] font-semibold text-white" style={{ background: accent }}>Check availability</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* contact */}
      <section id="contact" className="border-t border-black/5 bg-[#f8fafc]">
        <div className="mx-auto grid max-w-6xl gap-8 px-5 py-14 sm:grid-cols-2">
          <div>
            <h2 className="text-[22px] font-bold tracking-tight">Visit {data.dealershipName}</h2>
            <div className="mt-4 space-y-1.5 text-[14px] text-[#334155]">
              {data.address && <p>{data.address}{cityLine ? `, ${cityLine}` : ""} {data.zip ?? ""}</p>}
              {data.phone && <p>Call or text: <a href={`tel:${data.phone}`} className="font-semibold" style={{ color: accent }}>{data.phone}</a></p>}
              {data.email && <p>Email: <a href={`mailto:${data.email}`} className="font-semibold" style={{ color: accent }}>{data.email}</a></p>}
            </div>
            {data.hours.length > 0 && (
              <div className="mt-5">
                <p className="text-[12px] font-semibold uppercase tracking-wide text-[#64748b]">Hours</p>
                <div className="mt-2 space-y-1 text-[13px] text-[#334155]">
                  {data.hours.map((h, i) => <div key={i} className="flex justify-between gap-6"><span>{h.day}</span><span className="text-[#64748b]">{h.open}–{h.close}</span></div>)}
                </div>
              </div>
            )}
          </div>
          <div className="rounded-2xl border border-black/8 bg-white p-6 shadow-sm">
            <p className="text-[15px] font-semibold">Ask about a vehicle</p>
            <p className="mt-1 text-[13px] text-[#64748b]">Send a message and we&apos;ll get right back to you.</p>
            <button onClick={() => setLead({ vehicle: null })} className="mt-4 w-full rounded-lg py-3 text-[14px] font-semibold text-white" style={{ background: accent }}>Contact the team</button>
          </div>
        </div>
      </section>

      <footer className="bg-[#0f172a] py-8 text-center text-[12.5px] text-white/60">
        <p className="font-semibold text-white/85">{data.dealershipName}</p>
        <p className="mt-1">Powered by Krakd</p>
      </footer>

      {lead && <LeadModal slug={data.slug} accent={accent} vehicle={lead.vehicle} onClose={() => setLead(null)} />}
    </div>
  );
}

function LeadModal({ slug, accent, vehicle, onClose }: { slug: string; accent: string; vehicle: SiteVehicle | null; onClose: () => void }) {
  const [f, setF] = useState({ firstName: "", lastName: "", phone: "", email: "", message: vehicle ? `I'm interested in the ${vehicle.year} ${vehicle.make} ${vehicle.model}.` : "" });
  const set = (k: keyof typeof f, v: string) => setF((p) => ({ ...p, [k]: v }));
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const field = "w-full rounded-lg border border-black/12 bg-white px-3 py-2.5 text-[14px] outline-none focus:border-black/30";

  const submit = async () => {
    setErr(null);
    if (!f.firstName.trim()) { setErr("Enter your name."); return; }
    if (!f.phone.trim() && !f.email.trim()) { setErr("Add a phone or email so we can reach you."); return; }
    setBusy(true);
    try {
      const res = await fetch(`/api/v1/public/site/${slug}/lead`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...f, vehicleId: vehicle?.id }),
      });
      if (!res.ok) { const j = await res.json().catch(() => ({})); throw new Error(j.message ?? "Something went wrong."); }
      setDone(true);
    } catch (e) { setErr(e instanceof Error ? e.message : "Something went wrong."); }
    finally { setBusy(false); }
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4" onClick={onClose}>
      <div className="w-full max-w-[440px] rounded-2xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
        {done ? (
          <div className="py-6 text-center">
            <div className="mx-auto grid h-12 w-12 place-items-center rounded-full text-white" style={{ background: accent }}>✓</div>
            <p className="mt-3 text-[16px] font-semibold">Thanks — we got your message.</p>
            <p className="mt-1 text-[13.5px] text-[#64748b]">The team will reach out shortly.</p>
            <button onClick={onClose} className="mt-5 rounded-lg px-5 py-2.5 text-[13.5px] font-semibold text-white" style={{ background: accent }}>Close</button>
          </div>
        ) : (
          <>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[16px] font-semibold">Get in touch</p>
                {vehicle && <p className="mt-0.5 text-[13px] text-[#64748b]">About the {vehicle.year} {vehicle.make} {vehicle.model}</p>}
              </div>
              <button onClick={onClose} className="text-[18px] text-[#94a3b8] hover:text-[#475569]">✕</button>
            </div>
            <div className="mt-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <input placeholder="First name" value={f.firstName} onChange={(e) => set("firstName", e.target.value)} className={field} />
                <input placeholder="Last name" value={f.lastName} onChange={(e) => set("lastName", e.target.value)} className={field} />
              </div>
              <input placeholder="Phone" value={f.phone} onChange={(e) => set("phone", e.target.value)} className={field} />
              <input placeholder="Email" value={f.email} onChange={(e) => set("email", e.target.value)} className={field} />
              <textarea placeholder="Message" value={f.message} onChange={(e) => set("message", e.target.value)} rows={3} className={`${field} resize-none`} />
              {err && <p className="text-[12.5px] font-medium text-[#dc2626]">{err}</p>}
              <button onClick={submit} disabled={busy} className="w-full rounded-lg py-3 text-[14px] font-semibold text-white disabled:opacity-60" style={{ background: accent }}>{busy ? "Sending…" : "Send message"}</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
