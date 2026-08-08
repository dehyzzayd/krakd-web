import Link from "next/link";
import { accentOf, type SectionBlock, type SiteConfig } from "@/lib/server/site";

/* Renders the dealer's composable homepage sections (Phase 2 builder) in order, after
 * the template's built-in blocks. Styled with the site accent so it blends in. */

const C = "mx-auto max-w-6xl px-5";

function Btn({ label, url, accent }: { label?: string; url?: string; accent: string }) {
  if (!label) return null;
  const href = url || "#";
  const cls = "inline-flex items-center rounded-full px-6 py-3 text-[14px] font-semibold text-white";
  return url && /^https?:\/\//.test(url)
    ? <a href={href} target="_blank" rel="noreferrer" className={cls} style={{ background: accent }}>{label}</a>
    : <Link href={href} className={cls} style={{ background: accent }}>{label}</Link>;
}

function Block({ b, accent }: { b: SectionBlock; accent: string }) {
  switch (b.type) {
    case "richText":
      return (
        <section className={`${C} py-12`}>
          <div className={b.align === "center" ? "mx-auto max-w-[64ch] text-center" : "max-w-[68ch]"}>
            {b.heading && <h2 className="text-[28px] font-bold tracking-tight text-[#0f172a]">{b.heading}</h2>}
            {b.body && <p className="mt-4 whitespace-pre-line text-[15px] leading-relaxed text-[#475569]">{b.body}</p>}
          </div>
        </section>
      );
    case "imageText":
      return (
        <section className={`${C} py-12`}>
          <div className={`grid items-center gap-8 sm:grid-cols-2 ${b.imageRight ? "sm:[&>*:first-child]:order-2" : ""}`}>
            {b.image
              ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={b.image} alt={b.heading ?? ""} className="aspect-[4/3] w-full rounded-2xl object-cover" />
              : <div className="aspect-[4/3] w-full rounded-2xl bg-black/5" />}
            <div>
              {b.heading && <h2 className="text-[26px] font-bold tracking-tight text-[#0f172a]">{b.heading}</h2>}
              {b.body && <p className="mt-3 whitespace-pre-line text-[15px] leading-relaxed text-[#475569]">{b.body}</p>}
              {b.buttonLabel && <div className="mt-6"><Btn label={b.buttonLabel} url={b.buttonUrl} accent={accent} /></div>}
            </div>
          </div>
        </section>
      );
    case "cta":
      return (
        <section className={`${C} py-8`}>
          <div className="rounded-3xl px-8 py-12 text-center text-white" style={{ background: `linear-gradient(120deg, ${accent}, #0f172a)` }}>
            {b.heading && <h2 className="text-[30px] font-extrabold tracking-tight">{b.heading}</h2>}
            {b.body && <p className="mx-auto mt-3 max-w-[56ch] text-[15px] text-white/85">{b.body}</p>}
            {b.buttonLabel && <div className="mt-6 flex justify-center">{b.buttonUrl && /^https?:\/\//.test(b.buttonUrl)
              ? <a href={b.buttonUrl} target="_blank" rel="noreferrer" className="rounded-full bg-white px-8 py-4 text-[14px] font-semibold" style={{ color: accent }}>{b.buttonLabel}</a>
              : <Link href={b.buttonUrl || "#"} className="rounded-full bg-white px-8 py-4 text-[14px] font-semibold" style={{ color: accent }}>{b.buttonLabel}</Link>}</div>}
          </div>
        </section>
      );
    case "stats":
      return (
        <section className={`${C} py-12`}>
          {b.heading && <h2 className="mb-8 text-center text-[26px] font-bold tracking-tight text-[#0f172a]">{b.heading}</h2>}
          <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
            {(b.items ?? []).map((s, i) => (
              <div key={i} className="text-center">
                <p className="text-[38px] font-extrabold tracking-tight" style={{ color: accent }}>{s.value}</p>
                <p className="mt-1 text-[13.5px] text-[#64748b]">{s.label}</p>
              </div>
            ))}
          </div>
        </section>
      );
    case "faq":
      return (
        <section className={`${C} py-12`}>
          {b.heading && <h2 className="mb-6 text-[26px] font-bold tracking-tight text-[#0f172a]">{b.heading}</h2>}
          <div className="mx-auto max-w-[72ch] divide-y divide-black/10">
            {(b.items ?? []).map((qa, i) => (
              <details key={i} className="group py-4">
                <summary className="cursor-pointer list-none text-[15.5px] font-semibold text-[#0f172a]">{qa.q}</summary>
                {qa.a && <p className="mt-2 whitespace-pre-line text-[14.5px] leading-relaxed text-[#475569]">{qa.a}</p>}
              </details>
            ))}
          </div>
        </section>
      );
    default:
      return null;
  }
}

export function CustomSections({ config }: { config: SiteConfig; preview?: boolean }) {
  const layout = config.layout ?? [];
  if (!layout.length) return null;
  const accent = accentOf(config.primaryColor);
  return <div>{layout.map((b) => <Block key={b.id} b={b} accent={accent} />)}</div>;
}
