import { notFound } from "next/navigation";
import Link from "next/link";
import { getSite, getSitePage, accentOf } from "@/lib/server/site";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string; page: string }> }) {
  const { slug, page } = await params;
  const p = await getSitePage(slug, page);
  return p ? { title: p.title } : { title: "Page not found" };
}

/** Renders plain-English page body: blank line = paragraph, "## " = heading, "- " = list item. */
function Body({ text }: { text: string }) {
  const blocks = text.split(/\n{2,}/).map((b) => b.trim()).filter(Boolean);
  return (
    <div className="space-y-4">
      {blocks.map((b, i) => {
        if (b.startsWith("## ")) return <h2 key={i} className="pt-2 text-[22px] font-bold tracking-tight text-[#0f172a]">{b.slice(3)}</h2>;
        if (b.startsWith("# ")) return <h2 key={i} className="pt-2 text-[26px] font-bold tracking-tight text-[#0f172a]">{b.slice(2)}</h2>;
        if (b.split("\n").every((l) => l.trim().startsWith("- "))) return (
          <ul key={i} className="list-disc space-y-1.5 pl-5 text-[15px] leading-relaxed text-[#334155]">{b.split("\n").map((l, j) => <li key={j}>{l.trim().slice(2)}</li>)}</ul>
        );
        return <p key={i} className="whitespace-pre-wrap text-[15px] leading-relaxed text-[#334155]">{b}</p>;
      })}
    </div>
  );
}

export default async function CustomPage({ params }: { params: Promise<{ slug: string; page: string }> }) {
  const { slug, page } = await params;
  const config = await getSite(slug);
  if (!config) notFound();
  const p = await getSitePage(slug, page);
  if (!p) notFound();
  const accent = accentOf(config.primaryColor);
  const navPages = config.pages.filter((x) => x.inNav || x.showSidebar);

  return (
    <section className="mx-auto max-w-[1180px] px-5 py-14">
      <div className={p.showSidebar ? "grid gap-10 lg:grid-cols-[minmax(0,1fr)_220px]" : "mx-auto max-w-[760px]"}>
        <div>
          <h1 className="text-[34px] font-extrabold tracking-tight text-[#0f172a] sm:text-[40px]">{p.title}</h1>
          <div className="mt-6"><Body text={p.body} /></div>
        </div>
        {p.showSidebar && (
          <aside className="lg:sticky lg:top-24 lg:self-start">
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-[#94a3b8]">Pages</p>
            <nav className="space-y-1">
              {navPages.map((x) => {
                const active = x.slug === p.slug;
                return <Link key={x.id} href={`/site/${slug}/${x.slug}`} className="block rounded-lg px-3 py-2 text-[13.5px] font-medium transition" style={active ? { background: accent, color: "#fff" } : { color: "#334155" }}>{x.title}</Link>;
              })}
            </nav>
          </aside>
        )}
      </div>
    </section>
  );
}
