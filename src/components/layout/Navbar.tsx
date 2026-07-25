"use client";

import { useState } from "react";
import { useMotionValueEvent, useScroll } from "motion/react";
import { Logo } from "./Logo";
import { cn } from "@/lib/cn";

const LINKS = [
  { href: "#platform", label: "Platform" },
  { href: "#pricing", label: "Pricing" },
  { href: "#faq", label: "FAQ" },
];

export function Navbar() {
  const { scrollY } = useScroll();
  // While the blue hero backdrop sits behind the nav we render light items;
  // once scrolled onto the grey canvas we flip to dark + a frosted bar.
  const [scrolled, setScrolled] = useState(false);
  useMotionValueEvent(scrollY, "change", (v) => setScrolled(v > 560));
  const light = !scrolled;

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full transition-colors duration-300",
        scrolled
          ? "bg-canvas/80 backdrop-blur-xl backdrop-saturate-150"
          : "bg-transparent",
      )}
    >
      <input type="checkbox" id="nav-toggle" className="peer sr-only" aria-hidden />

      <div className="shell flex h-[72px] items-center justify-between gap-4 px-5 sm:px-8">
        <a href="#top" aria-label="Krakd home" className="flex shrink-0 items-center">
          <Logo onDark={light} className="text-[24px]" />
        </a>

        <nav
          className={cn(
            "hidden items-center gap-1 rounded-full p-1 md:flex transition-colors duration-300",
            light ? "bg-white/12 backdrop-blur-md" : "bg-card lift",
          )}
          aria-label="Primary"
        >
          {LINKS.map((l) => (
            <a
              key={l.label}
              href={l.href}
              className={cn(
                "inline-flex h-8 items-center rounded-full px-4 text-[13.5px] font-medium transition-colors duration-150",
                light
                  ? "text-white/85 hover:bg-white hover:text-ink"
                  : "text-body hover:bg-ink hover:text-white",
              )}
            >
              {l.label}
            </a>
          ))}
        </nav>

        <div className="flex shrink-0 items-center gap-2">
          <a
            href="/login"
            className={cn(
              "hidden h-9 items-center px-3 text-[13.5px] font-medium transition-colors duration-150 sm:inline-flex",
              light ? "text-white hover:text-white/70" : "text-body hover:text-ink",
            )}
          >
            Sign in
          </a>
          <a
            href="/signup"
            className={cn(
              "inline-flex h-9 items-center rounded-full px-4 text-[13.5px] font-semibold transition-colors duration-150",
              light
                ? "bg-white text-ink hover:bg-white/90"
                : "bg-ink text-white hover:bg-black",
            )}
          >
            Get started
          </a>
          <label
            htmlFor="nav-toggle"
            className={cn(
              "inline-flex h-9 w-9 -mr-1 cursor-pointer items-center justify-center rounded-full md:hidden",
              light ? "bg-white/15 text-white" : "bg-card text-ink lift",
            )}
            aria-label="Toggle menu"
          >
            <span className="flex flex-col gap-[3px]">
              <span className="h-[1.5px] w-3.5 bg-current" />
              <span className="h-[1.5px] w-3.5 bg-current" />
              <span className="h-[1.5px] w-3.5 bg-current" />
            </span>
          </label>
        </div>
      </div>

      <div className="hidden px-4 pb-3 peer-checked:block md:hidden">
        <div className="shell rounded-[20px] bg-card p-2 lift">
          {LINKS.map((l) => (
            <a
              key={l.label}
              href={l.href}
              className="block rounded-[14px] px-4 py-2.5 text-[15px] font-medium text-ink-2 hover:bg-inset"
            >
              {l.label}
            </a>
          ))}
        </div>
      </div>
    </header>
  );
}
