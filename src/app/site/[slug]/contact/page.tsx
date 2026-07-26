import { notFound } from "next/navigation";
import { getSite, accentOf } from "@/lib/server/site";
import { siteTheme } from "@/components/site/theme";
import { LeadForm } from "@/components/site/LeadForm";
import { MapPin, Phone, Mail, Clock } from "lucide-react";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const c = await getSite(slug);
  return c ? { title: `Contact · ${c.dealershipName}` } : { title: "Site not found" };
}

export default async function ContactPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const config = await getSite(slug);
  if (!config) notFound();
  const accent = accentOf(config.primaryColor);
  const ui = siteTheme(config.template);
  const cityLine = [config.city, config.state, config.zip].filter(Boolean).join(", ");
  const mapQuery = encodeURIComponent([config.address, cityLine].filter(Boolean).join(", "));

  return (
    <section className="mx-auto max-w-[1280px] px-5 py-14">
      <h1 className={`${ui.display} ${ui.h1} text-[#0f172a]`}>Contact {config.dealershipName}</h1>
      <p className="mt-2 text-[14.5px] text-[#64748b]">Questions about a vehicle, a trade, or financing? Send us a message.</p>

      <div className="mt-8 grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,440px)]">
        <div className="space-y-4">
          {config.address && <a href={`https://maps.google.com/?q=${mapQuery}`} target="_blank" rel="noreferrer" className="flex items-start gap-3 rounded-xl border border-black/8 bg-white p-4 shadow-sm hover:border-black/20"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-white" style={{ background: accent }}><MapPin className="h-4.5 w-4.5" /></span><span><span className="block text-[14px] font-semibold">Visit us</span><span className="text-[13px] text-[#64748b]">{config.address}{cityLine ? `, ${cityLine}` : ""}</span></span></a>}
          {config.phone && <a href={`tel:${config.phone}`} className="flex items-center gap-3 rounded-xl border border-black/8 bg-white p-4 shadow-sm hover:border-black/20"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-white" style={{ background: accent }}><Phone className="h-4.5 w-4.5" /></span><span><span className="block text-[14px] font-semibold">Call or text</span><span className="text-[13px] text-[#64748b]">{config.phone}</span></span></a>}
          {config.email && <a href={`mailto:${config.email}`} className="flex items-center gap-3 rounded-xl border border-black/8 bg-white p-4 shadow-sm hover:border-black/20"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-white" style={{ background: accent }}><Mail className="h-4.5 w-4.5" /></span><span><span className="block text-[14px] font-semibold">Email</span><span className="text-[13px] text-[#64748b]">{config.email}</span></span></a>}
          {config.hours.length > 0 && (
            <div className="rounded-xl border border-black/8 bg-white p-4 shadow-sm">
              <div className="mb-2 flex items-center gap-2 text-[14px] font-semibold"><Clock className="h-4 w-4" style={{ color: accent }} />Hours</div>
              <div className="space-y-1">{config.hours.map((h, i) => <div key={i} className="flex justify-between text-[13px] text-[#475569]"><span>{h.day}</span><span className="text-[#64748b]">{h.open}–{h.close}</span></div>)}</div>
            </div>
          )}
        </div>
        <div className="rounded-2xl border border-black/8 bg-white p-6 shadow-sm">
          <p className="text-[16px] font-semibold">Send a message</p>
          <p className="mt-1 mb-4 text-[13px] text-[#64748b]">We&apos;ll get right back to you.</p>
          <LeadForm slug={config.slug} accent={accent} compact />
        </div>
      </div>
    </section>
  );
}
