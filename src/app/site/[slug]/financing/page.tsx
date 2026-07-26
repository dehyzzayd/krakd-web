import { notFound } from "next/navigation";
import { getSite, accentOf } from "@/lib/server/site";
import { LeadForm } from "@/components/site/LeadForm";
import { PaymentCalculator } from "@/components/site/PaymentCalculator";
import { siteTheme } from "@/components/site/theme";
import { ShieldCheck, Clock, CheckCircle2 } from "lucide-react";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const c = await getSite(slug);
  return c ? { title: `Financing · ${c.dealershipName}` } : { title: "Site not found" };
}

export default async function FinancingPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const config = await getSite(slug);
  if (!config) notFound();
  const accent = accentOf(config.primaryColor);
  const ui = siteTheme(config.template);
  const points = [
    { Icon: CheckCircle2, t: "All credit welcome", b: "Good, bad, or building — we work with lenders for every situation." },
    { Icon: Clock, t: "Fast pre-approval", b: "Apply in minutes and get a real answer, often the same day." },
    { Icon: ShieldCheck, t: "No obligation", b: "Getting pre-qualified won't affect your credit or commit you to anything." },
  ];

  return (
    <>
      <section className="w-full text-white" style={{ background: `linear-gradient(120deg, ${accent} 0%, ${ui.band} 100%)` }}>
        <div className={`mx-auto ${ui.container} px-5 py-16`}>
          <p className={ui.eyebrow + " text-white/70"}>Financing</p>
          <h1 className={`mt-2 ${ui.display} ${ui.h1}`}>Financing made simple.</h1>
          <p className="mt-3 max-w-[56ch] text-[15px] text-white/85">{config.financingText || "Get pre-qualified in minutes. Tell us a little about yourself and our finance team will match you with the right options."}</p>
        </div>
      </section>

      <section className={`mx-auto ${ui.container} px-5 py-14`}>
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,440px)]">
          <div>
            <div className="grid gap-6 sm:grid-cols-3">
              {points.map((p) => (
                <div key={p.t}>
                  <span className="grid h-11 w-11 place-items-center rounded-xl text-white" style={{ background: accent }}><p.Icon className="h-5 w-5" /></span>
                  <p className="mt-3 text-[15px] font-semibold">{p.t}</p>
                  <p className="mt-1 text-[13.5px] leading-relaxed text-[#475569]">{p.b}</p>
                </div>
              ))}
            </div>
            <div className="mt-8 rounded-2xl border border-black/8 bg-[#f8fafc] p-6">
              <p className="text-[15px] font-semibold">How it works</p>
              <ol className="mt-3 space-y-2 text-[13.5px] text-[#475569]">
                <li>1. Submit the quick pre-qualification form.</li>
                <li>2. Our finance team reviews your options with our lenders.</li>
                <li>3. We reach out with terms — then pick your vehicle.</li>
              </ol>
            </div>
            <div className="mt-6"><PaymentCalculator price={0} accent={accent} title="Payment calculator" /></div>
          </div>
          <div className="rounded-2xl border border-black/8 bg-white p-6 shadow-sm lg:sticky lg:top-24 lg:self-start">
            <p className="text-[16px] font-semibold">Get pre-qualified</p>
            <p className="mt-1 mb-4 text-[13px] text-[#64748b]">No impact to your credit score.</p>
            <LeadForm slug={config.slug} accent={accent} financing compact />
          </div>
        </div>
      </section>
    </>
  );
}
