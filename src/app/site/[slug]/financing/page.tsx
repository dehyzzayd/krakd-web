import { notFound } from "next/navigation";
import { getSite, accentOf } from "@/lib/server/site";
import { LeadForm } from "@/components/site/LeadForm";
import { PaymentCalculator } from "@/components/site/PaymentCalculator";
import { siteTheme } from "@/components/site/theme";
import { vertical as verticalDef } from "@/components/site/verticals";
import { ShieldCheck, Clock, CheckCircle2 } from "lucide-react";

const PERK_ICONS = [CheckCircle2, Clock, ShieldCheck];

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const c = await getSite(slug);
  return c ? { title: `${verticalDef(c.vertical).market.financeNav} · ${c.dealershipName}` } : { title: "Site not found" };
}

export default async function FinancingPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const config = await getSite(slug);
  if (!config) notFound();
  const def = verticalDef(config.vertical);
  if (!def.market.financeNav) notFound();       // verticals without financing have no such page
  const accent = accentOf(config.primaryColor);
  const ui = siteTheme(config.template);
  const fp = def.market.financePage;
  const isAuto = config.vertical === "AUTOMOTIVE" || !config.vertical;

  return (
    <>
      <section className="w-full text-white" style={{ background: `linear-gradient(120deg, ${accent} 0%, ${ui.band} 100%)` }}>
        <div className={`mx-auto ${ui.container} px-5 py-16`}>
          <p className={ui.eyebrow + " text-white/70"}>{def.market.financeNav}</p>
          <h1 className={`mt-2 ${ui.display} ${ui.h1}`}>{fp.heading}</h1>
          <p className="mt-3 max-w-[56ch] text-[15px] text-white/85">{config.financingText || fp.sub}</p>
        </div>
      </section>

      <section className={`mx-auto ${ui.container} px-5 py-14`}>
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,440px)]">
          <div>
            <div className="grid gap-6 sm:grid-cols-3">
              {fp.perks.map((p, i) => { const Icon = PERK_ICONS[i] ?? CheckCircle2; return (
                <div key={p.t}>
                  <span className="grid h-11 w-11 place-items-center rounded-xl text-white" style={{ background: accent }}><Icon className="h-5 w-5" /></span>
                  <p className="mt-3 text-[15px] font-semibold">{p.t}</p>
                  <p className="mt-1 text-[13.5px] leading-relaxed text-[#475569]">{p.b}</p>
                </div>
              ); })}
            </div>
            <div className="mt-8 rounded-2xl border border-black/8 bg-[#f8fafc] p-6">
              <p className="text-[15px] font-semibold">How it works</p>
              <ol className="mt-3 space-y-2 text-[13.5px] text-[#475569]">
                {fp.steps.map((st, i) => <li key={i}>{i + 1}. {st}</li>)}
              </ol>
            </div>
            {isAuto && <div className="mt-6"><PaymentCalculator price={0} accent={accent} title="Payment calculator" /></div>}
          </div>
          <div className="rounded-2xl border border-black/8 bg-white p-6 shadow-sm lg:sticky lg:top-24 lg:self-start">
            <p className="text-[16px] font-semibold">{fp.formHeading}</p>
            <p className="mt-1 mb-4 text-[13px] text-[#64748b]">{isAuto ? "No impact to your credit score." : "No obligation — we'll be in touch."}</p>
            <LeadForm slug={config.slug} accent={accent} financing compact />
          </div>
        </div>
      </section>
    </>
  );
}
