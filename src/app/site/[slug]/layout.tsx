import { notFound } from "next/navigation";
import { getSite, accentOf } from "@/lib/server/site";
import { SiteHeader, SiteFooter } from "@/components/site/SiteChrome";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function SiteLayout({ children, params }: { children: React.ReactNode; params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const config = await getSite(slug);
  if (!config) notFound();

  // chat widget is on by default for a published site; a dealer can turn it off
  // via the "Website" channel in Krakd AI settings (channels.website === false)
  let chatOn = true;
  let welcome = "";
  const w = await prisma.website.findUnique({ where: { slug }, select: { dealershipId: true } });
  if (w) {
    const ai = await prisma.aiSettings.findUnique({ where: { dealershipId: w.dealershipId }, select: { channels: true, welcomeMessage: true } });
    const ch = (ai?.channels ?? {}) as { website?: boolean };
    chatOn = ch.website !== false;
    welcome = ai?.welcomeMessage ?? "";
  }

  const bg = config.template === "PREMIUM" ? "#f4f0e8" : config.template === "AURORA" ? "#161227" : config.template === "QUIET" ? "#f5f3ee" : "#ffffff";
  return (
    <div className="relative min-h-screen overflow-x-clip text-[#0f172a]" style={{ background: bg, ["--accent" as string]: accentOf(config.primaryColor) }}>
      <SiteHeader config={config} />
      <main>{children}</main>
      <SiteFooter config={config} />
      {/* eslint-disable-next-line @next/next/no-sync-scripts */}
      {chatOn && <script src="/widget.js" data-slug={slug} data-color={accentOf(config.primaryColor)} data-name={config.dealershipName} data-welcome={welcome} async />}
    </div>
  );
}
