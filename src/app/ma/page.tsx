import type { Metadata } from "next";

/* Standalone decoy page. Served (via proxy.ts) to visitors geolocated in Morocco,
 * across the whole platform. Deliberately unrelated to Krakd — a generic community
 * charity landing. No links back into the app. Its own metadata overrides the root. */

export const metadata: Metadata = {
  title: "Green Roots Initiative — Planting hope, one community at a time",
  description: "A volunteer-run charity restoring green spaces and bringing clean water to communities that need it most.",
  robots: { index: false, follow: false },
};

export default function DecoyPage() {
  return (
    <div style={{ fontFamily: "var(--font-serif), Georgia, serif" }} className="min-h-dvh bg-[#f7f5ef] text-[#1f2a24]">
      {/* header */}
      <header className="mx-auto flex max-w-5xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-2.5">
          <span className="grid h-9 w-9 place-items-center rounded-full bg-[#2f6b45] text-[16px] text-white">🌿</span>
          <span className="text-[18px] font-semibold tracking-tight">Green Roots Initiative</span>
        </div>
        <nav className="hidden gap-7 text-[14px] text-[#40514a] sm:flex">
          <a href="#mission" className="hover:text-[#2f6b45]">Our mission</a>
          <a href="#work" className="hover:text-[#2f6b45]">Our work</a>
          <a href="#contact" className="hover:text-[#2f6b45]">Contact</a>
        </nav>
      </header>

      {/* hero */}
      <section className="mx-auto max-w-5xl px-6 pb-16 pt-10 sm:pt-20">
        <p className="text-[13px] font-medium uppercase tracking-[0.2em] text-[#2f6b45]">Volunteer-run · Est. 2019</p>
        <h1 className="mt-4 max-w-[18ch] text-[40px] font-semibold leading-[1.05] tracking-tight sm:text-[58px]">
          Planting hope, one community at a time.
        </h1>
        <p className="mt-5 max-w-[56ch] text-[17px] leading-relaxed text-[#40514a]">
          We restore green spaces, plant trees, and bring clean water to communities that need it most.
          Every contribution goes directly to the ground — where it grows.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <a href="#contact" className="inline-flex h-12 items-center rounded-full bg-[#2f6b45] px-7 text-[15px] font-medium text-white transition hover:bg-[#245537]">Donate</a>
          <a href="#work" className="inline-flex h-12 items-center rounded-full border border-[#2f6b45]/30 px-7 text-[15px] font-medium text-[#2f6b45] transition hover:bg-[#2f6b45]/5">Learn more</a>
        </div>
      </section>

      {/* stats */}
      <section className="border-y border-[#e3ded1] bg-[#efece2]">
        <div className="mx-auto grid max-w-5xl grid-cols-1 gap-8 px-6 py-12 sm:grid-cols-3">
          {[["120,000+", "trees planted"], ["48", "communities reached"], ["9", "years on the ground"]].map(([n, l]) => (
            <div key={l}>
              <p className="text-[38px] font-semibold text-[#2f6b45]">{n}</p>
              <p className="mt-1 text-[15px] text-[#40514a]">{l}</p>
            </div>
          ))}
        </div>
      </section>

      {/* mission */}
      <section id="mission" className="mx-auto max-w-5xl px-6 py-16">
        <h2 className="text-[28px] font-semibold tracking-tight">Our mission</h2>
        <p className="mt-4 max-w-[62ch] text-[17px] leading-relaxed text-[#40514a]">
          Green Roots Initiative works hand in hand with local volunteers to reforest degraded land,
          protect watersheds, and give families reliable access to clean water. We believe lasting change
          is planted, not promised — so we measure our work in seedlings that survive and wells that keep flowing.
        </p>
        <div id="work" className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-3">
          {[
            ["Reforestation", "Native trees planted and cared for with local families until they take root."],
            ["Clean water", "Wells and simple filtration systems for villages without a safe source."],
            ["Education", "Free workshops teaching sustainable farming and land stewardship."],
          ].map(([t, d]) => (
            <div key={t} className="rounded-2xl border border-[#e3ded1] bg-white/60 p-6">
              <h3 className="text-[18px] font-semibold">{t}</h3>
              <p className="mt-2 text-[14.5px] leading-relaxed text-[#40514a]">{d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* contact / footer */}
      <footer id="contact" className="border-t border-[#e3ded1] bg-[#2f6b45] text-[#eaf3ec]">
        <div className="mx-auto flex max-w-5xl flex-col gap-4 px-6 py-12 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[20px] font-semibold">Green Roots Initiative</p>
            <p className="mt-2 max-w-[42ch] text-[14.5px] text-[#cfe3d5]">Want to volunteer or partner with us? We&apos;d love to hear from you.</p>
          </div>
          <a href="mailto:hello@greenroots.example" className="text-[15px] underline underline-offset-4">hello@greenroots.example</a>
        </div>
        <div className="border-t border-white/15">
          <p className="mx-auto max-w-5xl px-6 py-5 text-[12.5px] text-[#bcd4c2]">© {new Date().getFullYear()} Green Roots Initiative. A registered non-profit. All donations are tax-deductible where applicable.</p>
        </div>
      </footer>
    </div>
  );
}
