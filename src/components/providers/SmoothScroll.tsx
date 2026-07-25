"use client";

import { MotionConfig } from "motion/react";
import type { ReactNode } from "react";

/**
 * Native scrolling — smooth-scroll (Lenis) was removed: it made the dense
 * dashboard feel laggy. MotionConfig still respects reduced-motion.
 */
export function SmoothScroll({ children }: { children: ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
