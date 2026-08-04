import type { ReactNode } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { KrakdDash } from "@/components/marketing/KrakdDash";
import { Logo } from "@/components/layout/Logo";

/* ───────────────────────────── content ───────────────────────────── */

const FEATURES = [
  {
    n: "01",
    kicker: "Catalog",
    title: "Every listing, priced and published in minutes.",
    body: "Add a vehicle, property, product or service and its details, media and market price come together in seconds. One click pushes each item to your channels and your own website — priced, photographed, live.",
    stat: "40+",
    statLabel: "channels, one click",
  },
  {
    n: "02",
    kicker: "CRM + AI",
    title: "An AI employee working every lead, day and night.",
    body: "Krakd texts, emails, qualifies and books while your team sleeps — then hands off a warm customer with the whole conversation attached. No lead goes cold, no follow-up forgotten.",
    stat: "12 min",
    statLabel: "average response",
  },
  {
    n: "03",
    kicker: "Marketing",
    title: "Launch campaigns without an agency invoice.",
    body: "Connect Facebook and Google once. Krakd writes the copy, builds the audiences, sets the budget and reports the real number that matters — cost per sale, not per click.",
    stat: "6.4×",
    statLabel: "return on ad spend",
  },
  {
    n: "04",
    kicker: "One inbox",
    title: "Every conversation on a single screen.",
    body: "SMS, email, Messenger and web chat land in one thread per customer. The AI drafts, you approve, or let it run — the handoff between human and machine is seamless.",
    stat: "1",
    statLabel: "inbox for all of it",
  },
];

const BUILT_FOR = [
  {
    kicker: "Automotive",
    title: "Car lots & dealer groups",
    line: "Inventory, syndication, desking and AI follow-up tuned to the way cars actually sell — from a single independent lot to a multi-rooftop group.",
    bullet: "Inventory · Syndication · Desking · AI",
  },
  {
    kicker: "Real estate",
    title: "Brokerages & agents",
    line: "Listings, buyer and seller pipelines, showings and automatic follow-up — your entire book of business on one calm screen.",
    bullet: "Listings · Pipelines · Showings · CRM",
  },
  {
    kicker: "And more",
    title: "Services, retail & local",
    line: "Restaurants, home services, studios and shops — a catalog, a customer database, marketing and an AI that never sleeps, all under one login.",
    bullet: "Catalog · CRM · Marketing · Inbox",
  },
];

const TIERS = [
  { name: "Starter", price: "$149", pitch: "Single location. Catalog, syndication, CRM, one inbox and AI follow-up." },
  { name: "Growth", price: "$349", pitch: "Everything in Starter + AI voice, marketing automation and full attribution.", featured: true },
  { name: "Scale", price: "Custom", pitch: "Multi-location groups, API access, dedicated onboarding and support." },
];

const FAQS = [
  { q: "How fast can I be live?", a: "Import your catalog by CSV, an industry feed or a quick scan, connect your channels, and most businesses are publishing the same afternoon. No integrator, no four-week onboarding." },
  { q: "Does the AI text customers without consent?", a: "Never. Consent is tracked per contact and channel, quiet hours are enforced by the customer's timezone, and every opt-out is honored automatically. Compliance is built into the data model, not bolted on." },
  { q: "Do I own my customer data?", a: "Yes. Every lead, deal and conversation builds a customer record that belongs to you — segment it, export the whole database as CSV, and take it with you whenever you want." },
  { q: "What does it replace?", a: "Your point solutions, CRM, syndication or listing tool, marketing agency, call service and the pile of spreadsheets in between — one subscription instead of six invoices." },
  { q: "Will it work with my current tools?", a: "Krakd imports from FTP/SFTP, common industry feeds, CSV and Excel, and exposes an open API. You can run it alongside what you have and switch on your own timeline." },
];

/* ───────────────────────────── primitives ───────────────────────────── */

function Kicker({ children, onDark = false }: { children: ReactNode; onDark?: boolean }) {
  return (
    <span
      className={`inline-flex h-7 items-center gap-2 rounded-full pl-2.5 pr-3.5 text-[11px] font-semibold uppercase tracking-[0.12em] ${
        onDark ? "bg-white/10 text-white/80" : "bg-card text-ink-2 lift"
      }`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-accent" />
      {children}
    </span>
  );
}

const BTN_PRIMARY =
  "inline-flex h-12 items-center justify-center rounded-full bg-ink px-6 text-[15px] font-semibold text-white transition-colors duration-150 hover:bg-black focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink";
const BTN_GHOST =
  "inline-flex h-12 items-center justify-center rounded-full bg-card px-6 text-[15px] font-semibold text-ink lift transition-shadow duration-150 hover:shadow-[0_2px_10px_rgba(15,15,15,0.10)]";

/* ───────────────────────────── page ───────────────────────────── */

export default function Home() {
  return (
    <div id="top" className="relative flex min-h-dvh flex-col">
      {/* full-bleed blue backdrop — behind the navbar, down to mid-dashboard */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 z-0 h-[760px] bg-cover bg-top sm:h-[860px] lg:h-[940px]"
        style={{ backgroundImage: "url(/hero-bg.webp)", backgroundColor: "#173a5e" }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-canvas" />
      </div>

      <Navbar />
      <main className="relative z-10 flex-1">
        {/* HERO */}
        <section className="shell px-5 pt-14 pb-10 sm:px-8 lg:pt-20">
          <div className="max-w-[52rem]">
            <h1 className="fade-up d1 text-[42px] font-semibold leading-[0.98] tracking-[-0.035em] text-white sm:text-[58px] lg:text-[72px]">
              Run your whole business from one calm screen.
            </h1>
            <p className="fade-up d3 mt-6 max-w-[54ch] text-[17px] leading-[1.6] text-white/85 sm:text-[18px]">
              The operating system for local business. One platform replaces the
              six vendors you juggle — catalog, CRM, marketing, communication and
              AI employees that call, text and close. Add your listings, connect
              your channels, be live by this afternoon.
            </p>
            <div className="fade-up d4 mt-8 flex flex-wrap items-center gap-3">
              <a href="/signup" className={BTN_GHOST}>Start free</a>
              <a href="#pricing" className="inline-flex h-12 items-center justify-center rounded-full border border-white/30 bg-white/5 px-6 text-[15px] font-semibold text-white backdrop-blur-sm transition-colors duration-150 hover:bg-white/15">
                See pricing
              </a>
              <span className="inline-flex h-9 items-center rounded-full bg-accent px-3.5 text-[12px] font-semibold uppercase tracking-[0.08em] text-accent-ink">
                14 days free
              </span>
            </div>
            <p className="fade-up d4 mt-4 text-[13px] text-white/70">
              No card required · From <span className="font-semibold text-white">$149/mo</span> · Cancel anytime
            </p>
          </div>

          <div className="fade-up d4 mt-12">
            <KrakdDash />
          </div>
        </section>

        {/* STAT STRIP */}
        <section className="shell px-5 py-10 sm:px-8 lg:py-14">
          <div className="overflow-hidden rounded-[26px] bg-card lift">
            <div className="grid grid-cols-2 divide-x divide-y divide-line lg:grid-cols-4 lg:divide-y-0">
              {[
                { v: "6→1", l: "vendors replaced", note: "one login, one bill" },
                { v: "40+", l: "channels · one click", note: "FB · Google · your site", accent: true },
                { v: "12 min", l: "avg AI lead response", note: "day or night" },
                { v: "$0", l: "setup, no contract", note: "live in a weekend" },
              ].map((s) => (
                <div key={s.l} className="p-7 lg:p-8">
                  <div className={`text-[44px] font-semibold leading-none tracking-[-0.04em] lg:text-[52px] ${s.accent ? "text-accent" : "text-ink"}`}>
                    {s.v}
                  </div>
                  <div className="mt-3 text-[13.5px] font-medium text-ink">{s.l}</div>
                  <div className="mt-1 text-[12.5px] text-muted">{s.note}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* EDITORIAL OPENER */}
        <section id="platform" className="shell px-5 py-12 sm:px-8 lg:py-20">
          <div className="rounded-[26px] bg-card p-8 lift sm:p-12 lg:p-16">
            <div className="grid items-start gap-10 lg:grid-cols-12 lg:gap-12">
              <div className="lg:col-span-5">
                <Kicker>The platform</Kicker>
                <h2 className="mt-5 text-[32px] font-semibold leading-[1.03] tracking-[-0.03em] text-ink lg:text-[46px]">
                  Stop running your business from six browser tabs.
                </h2>
              </div>
              <div className="lg:col-span-7">
                <p className="text-[17px] leading-[1.65] text-ink-2">
                  A typical local business runs on a stack of vendors — a point
                  solution for the catalog, a CRM, a syndication or listing tool,
                  a marketing agency, a call service, and a spreadsheet holding it
                  together. Each one charges. Each one owns a fragment of the
                  customer. The owner stitches the fragments by hand, usually after
                  close.
                </p>
                <p className="mt-5 text-[17px] leading-[1.65] text-ink-2">
                  Krakd replaces the stack. One subscription. One customer record.
                  One screen your team and your manager can both read — with AI
                  quietly working the pipeline in the background.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* FEATURE CARDS */}
        <section id="product" className="shell px-5 py-12 sm:px-8 lg:py-16">
          <div className="mb-10 max-w-2xl">
            <Kicker>What&apos;s inside</Kicker>
            <h2 className="mt-5 text-[32px] font-semibold leading-[1.04] tracking-[-0.03em] text-ink lg:text-[44px]">
              Six tools, one login, zero glue.
            </h2>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {FEATURES.map((f) => (
              <article key={f.n} className="flex flex-col rounded-[26px] bg-card p-7 lift lg:p-9">
                <div className="flex items-center gap-3">
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-ink text-[12px] font-semibold text-white">
                    {f.n}
                  </span>
                  <span className="text-[12px] font-semibold uppercase tracking-[0.12em] text-muted">
                    {f.kicker}
                  </span>
                </div>
                <h3 className="mt-6 max-w-[20ch] text-[24px] font-semibold leading-[1.1] tracking-[-0.025em] text-ink lg:text-[28px]">
                  {f.title}
                </h3>
                <p className="mt-4 flex-1 text-[15px] leading-[1.6] text-body">{f.body}</p>
                <div className="mt-7 flex items-baseline gap-3 border-t border-hairline pt-5">
                  <span className="text-[26px] font-semibold tracking-[-0.02em] text-ink">{f.stat}</span>
                  <span className="text-[12px] font-medium uppercase tracking-[0.1em] text-muted">{f.statLabel}</span>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* BUILT FOR */}
        <section className="shell px-5 py-12 sm:px-8 lg:py-16">
          <div className="mb-10 max-w-2xl">
            <Kicker>Built for</Kicker>
            <h2 className="mt-5 text-[30px] font-semibold leading-[1.05] tracking-[-0.03em] text-ink lg:text-[42px]">
              Built for every local business.
            </h2>
          </div>
          <div className="grid gap-4 lg:grid-cols-3">
            {BUILT_FOR.map((b) => (
              <div key={b.title} className="flex flex-col gap-5 rounded-[26px] bg-card p-8 lift">
                <Kicker>{b.kicker}</Kicker>
                <h3 className="text-[22px] font-semibold leading-[1.15] tracking-[-0.02em] text-ink">{b.title}</h3>
                <p className="flex-1 text-[14.5px] leading-[1.6] text-body">{b.line}</p>
                <p className="border-t border-hairline pt-4 text-[12px] font-medium uppercase tracking-[0.08em] text-muted">
                  {b.bullet}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* PRICING */}
        <section id="pricing" className="shell px-5 py-12 sm:px-8 lg:py-16">
          <div className="mb-10 max-w-2xl">
            <Kicker>Pricing</Kicker>
            <h2 className="mt-5 text-[30px] font-semibold leading-[1.05] tracking-[-0.03em] text-ink lg:text-[42px]">
              Honest pricing. No per-seat games.
            </h2>
            <p className="mt-5 max-w-[58ch] text-[16px] leading-[1.6] text-body">
              Start free for fourteen days, cancel anytime. Pay for the tier that
              matches your business — not the number of seats.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            {TIERS.map((t) => {
              const featured = !!t.featured;
              return (
                <div
                  key={t.name}
                  className={`flex flex-col gap-4 rounded-[26px] p-8 ${featured ? "bg-ink text-white" : "bg-card text-ink lift"}`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[18px] font-semibold tracking-[-0.01em]">{t.name}</span>
                    {featured && (
                      <span className="inline-flex h-6 items-center rounded-full bg-accent px-2.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-accent-ink">
                        Most common
                      </span>
                    )}
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-[44px] font-semibold leading-none tracking-[-0.03em]">{t.price}</span>
                    {t.price !== "Custom" && <span className={`text-[14px] ${featured ? "text-white/50" : "text-muted"}`}>/mo</span>}
                  </div>
                  <p className={`flex-1 text-[14px] leading-[1.6] ${featured ? "text-white/70" : "text-body"}`}>{t.pitch}</p>
                  <a
                    href="/signup"
                    className={`mt-3 inline-flex h-11 items-center justify-center rounded-full px-5 text-[14px] font-semibold transition-colors duration-150 ${
                      featured ? "bg-accent text-accent-ink hover:brightness-105" : "bg-ink text-white hover:bg-black"
                    }`}
                  >
                    Start free
                  </a>
                </div>
              );
            })}
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="shell px-5 py-12 sm:px-8 lg:py-16">
          <div className="grid gap-8 lg:grid-cols-12 lg:gap-12">
            <div className="lg:col-span-4">
              <Kicker>FAQ</Kicker>
              <h2 className="mt-5 text-[30px] font-semibold leading-[1.06] tracking-[-0.03em] text-ink lg:text-[40px]">
                Questions, answered.
              </h2>
            </div>
            <div className="rounded-[26px] bg-card px-6 lift sm:px-8 lg:col-span-8">
              {FAQS.map((f) => (
                <details key={f.q} className="group border-b border-hairline last:border-b-0">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-5 [&::-webkit-details-marker]:hidden">
                    <span className="text-[16.5px] font-medium leading-snug text-ink">{f.q}</span>
                    <span className="relative h-4 w-4 shrink-0" aria-hidden>
                      <span className="absolute left-1/2 top-1/2 h-[1.5px] w-3.5 -translate-x-1/2 -translate-y-1/2 bg-ink-2" />
                      <span className="absolute left-1/2 top-1/2 h-3.5 w-[1.5px] -translate-x-1/2 -translate-y-1/2 bg-ink-2 transition-transform duration-200 group-open:rotate-90 group-open:opacity-0" />
                    </span>
                  </summary>
                  <p className="-mt-1 max-w-[64ch] pb-5 text-[14.5px] leading-[1.65] text-body">{f.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* CLOSING CTA */}
        <section className="shell px-5 pt-6 pb-16 sm:px-8 lg:pb-20">
          <div className="relative overflow-hidden rounded-[26px] bg-ink p-8 text-white sm:p-12 lg:p-16">
            <div
              className="pointer-events-none absolute -right-16 -top-24 h-80 w-80 rounded-full"
              style={{ background: "radial-gradient(circle, rgba(255,90,22,0.22) 0%, rgba(255,90,22,0) 70%)" }}
              aria-hidden
            />
            <div className="relative grid items-end gap-10 lg:grid-cols-12">
              <div className="lg:col-span-8">
                <Kicker onDark>Get started</Kicker>
                <h2 className="mt-5 text-[34px] font-semibold leading-[1.02] tracking-[-0.03em] text-white sm:text-[46px] lg:text-[56px]">
                  The next ten minutes is the difference between four weeks and this afternoon.
                </h2>
              </div>
              <div className="flex flex-col gap-5 lg:col-span-4 lg:items-end">
                <a href="/signup" className="inline-flex h-12 items-center justify-center rounded-full bg-accent px-6 text-[15px] font-semibold text-accent-ink transition hover:brightness-105">
                  Start free →
                </a>
                <p className="max-w-[28ch] text-[12px] font-semibold uppercase tracking-[0.1em] text-white/45 lg:text-right">
                  Add your catalog · Connect your channels · Go live today
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="shell w-full px-5 pb-10 sm:px-8">
        <div className="flex flex-col items-start justify-between gap-6 border-t border-[#dcdcdc] pt-8 sm:flex-row sm:items-center">
          <Logo />
          <p className="text-[13px] text-muted">
            © {2026} Krakd — The Operating System for local business.
          </p>
          <div className="flex gap-5 text-[13px] text-body">
            <a href="#privacy" className="hover:text-ink">Privacy</a>
            <a href="#terms" className="hover:text-ink">Terms</a>
            <a href="/login" className="hover:text-ink">Sign in</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
