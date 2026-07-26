import { notFound } from "next/navigation";
import Link from "next/link";
import { getSite, accentOf } from "@/lib/server/site";
import { ShieldCheck, BadgeCheck, Wrench } from "lucide-react";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const c = await getSite(slug);
  return c ? { title: `About · ${c.dealershipName}` } : { title: "Site not found" };
}

const DEFAULT_WHY = [
  { title: "Hand-picked inventory", body: "Every vehicle is selected for quality, then priced to the live market." },
  { title: "Inspected & reconditioned", body: "Multi-point inspection before any car reaches our lot." },
  { title: "Simple financing", body: "Get pre-qualified in minutes — options for every credit situation." },
];

export default async function AboutPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const config = await getSite(slug);
  if (!config) notFound();
  const accent = accentOf(config.primaryColor);
  const why = config.whyUs.length ? config.whyUs : DEFAULT_WHY;
  const icons = [ShieldCheck, BadgeCheck, Wrench];

  return (
    <>
      <section className="w-full bg-[#f8fafc]">
        <div className="mx-auto max-w-[1280px] px-5 py-16">
          <h1 className="text-[32px] font-extrabold tracking-tight sm:text-[40px]">About {config.dealershipName}</h1>
          <p className="mt-4 max-w-[70ch] text-[15px] leading-relaxed text-[#475569]">{config.aboutText || `${config.dealershipName} is a locally trusted dealership focused on honest pricing and a straightforward buying experience. We hand-pick our inventory, recondition every vehicle, and make financing easy — so you can drive home with confidence.`}</p>
        </div>
      </section>

      <section className="mx-auto max-w-[1280px] px-5 py-14">
        <h2 className="text-[24px] font-bold tracking-tight">Why buy from us</h2>
        <div className="mt-6 grid gap-6 sm:grid-cols-3">
          {why.slice(0, 3).map((w, i) => {
            const Icon = icons[i % icons.length];
            return (
              <div key={i} className="rounded-2xl border border-black/8 bg-white p-6 shadow-sm">
                <span className="grid h-11 w-11 place-items-center rounded-xl text-white" style={{ background: accent }}><Icon className="h-5 w-5" /></span>
                <p className="mt-3 text-[16px] font-semibold">{w.title}</p>
                <p className="mt-1 text-[13.5px] leading-relaxed text-[#475569]">{w.body}</p>
              </div>
            );
          })}
        </div>
      </section>

      {config.staff.length > 0 && (
        <section className="w-full bg-[#f8fafc] py-14">
          <div className="mx-auto max-w-[1280px] px-5">
            <h2 className="text-[24px] font-bold tracking-tight">Meet the team</h2>
            <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {config.staff.map((s, i) => (
                <div key={i} className="rounded-2xl border border-black/8 bg-white p-5 text-center shadow-sm">
                  <div className="mx-auto h-20 w-20 overflow-hidden rounded-full bg-[#e8edf3]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    {s.photoUrl ? <img src={s.photoUrl} alt={s.name} className="h-full w-full object-cover" /> : <div className="grid h-full place-items-center text-[20px] font-bold text-[#94a3b8]">{s.name.charAt(0)}</div>}
                  </div>
                  <p className="mt-3 text-[15px] font-semibold">{s.name}</p>
                  <p className="text-[12.5px] text-[#64748b]">{s.role}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="mx-auto max-w-[1280px] px-5 py-14 text-center">
        <h2 className="text-[24px] font-bold tracking-tight">Come see us</h2>
        <p className="mx-auto mt-2 max-w-[46ch] text-[14px] text-[#64748b]">Browse our inventory online or stop by — we&apos;re happy to help you find the right vehicle.</p>
        <div className="mt-5 flex flex-wrap justify-center gap-3">
          <Link href={`/site/${config.slug}/inventory`} className="rounded-lg px-6 py-3 text-[14px] font-semibold text-white" style={{ background: accent }}>View inventory</Link>
          <Link href={`/site/${config.slug}/contact`} className="rounded-lg border border-black/12 px-6 py-3 text-[14px] font-semibold" style={{ color: accent }}>Contact us</Link>
        </div>
      </section>
    </>
  );
}
