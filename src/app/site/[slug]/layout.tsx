import { notFound } from "next/navigation";
import { getSite, accentOf } from "@/lib/server/site";
import { SiteHeader, SiteFooter } from "@/components/site/SiteChrome";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function SiteLayout({ children, params }: { children: React.ReactNode; params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const config = await getSite(slug);
  if (!config) notFound();

  return (
    <div className="min-h-screen overflow-x-clip bg-white text-[#0f172a]" style={{ ["--accent" as string]: accentOf(config.primaryColor) }}>
      <SiteHeader config={config} />
      <main>{children}</main>
      <SiteFooter config={config} />
    </div>
  );
}
