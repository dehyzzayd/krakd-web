"use client";

import { ReactLenis } from "lenis/react";
import { MotionConfig } from "motion/react";
import type { ReactNode } from "react";

/**
 * Lenis smooth scroll. Tuned for a heavy, "expensive" glide — not bouncy.
 * Respects prefers-reduced-motion by disabling smoothing entirely.
 */
export function SmoothScroll({ children }: { children: ReactNode }) {
  const reduced =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  return (
    <ReactLenis
      root
      options={{
        lerp: reduced ? 1 : 0.09,
        duration: 1.15,
        smoothWheel: !reduced,
        wheelMultiplier: 1,
        touchMultiplier: 1.6,
      }}
    >
      <MotionConfig reducedMotion="user">{children}</MotionConfig>
    </ReactLenis>
  );
}
