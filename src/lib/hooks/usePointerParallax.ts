"use client";

import { useRef } from "react";
import {
  useMotionValue,
  useSpring,
  useTransform,
  type MotionValue,
} from "motion/react";

type Parallax = {
  onPointerMove: (e: React.PointerEvent) => void;
  onPointerLeave: () => void;
  /** Normalized -0.5..0.5 pointer position, spring-smoothed. */
  x: MotionValue<number>;
  y: MotionValue<number>;
};

/**
 * Pointer-driven parallax source. Returns spring-smoothed normalized
 * coordinates. Pair with `useDepth` on each floating layer so elements travel
 * at their own depth. Movement is subtle by design — expensive, not gimmicky.
 */
export function usePointerParallax(): Parallax {
  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);
  const x = useSpring(rawX, { stiffness: 90, damping: 22, mass: 0.7 });
  const y = useSpring(rawY, { stiffness: 90, damping: 22, mass: 0.7 });
  const rect = useRef<DOMRect | null>(null);

  const onPointerMove = (e: React.PointerEvent) => {
    const el = e.currentTarget as HTMLElement;
    rect.current ??= el.getBoundingClientRect();
    const r = rect.current;
    rawX.set((e.clientX - r.left) / r.width - 0.5);
    rawY.set((e.clientY - r.top) / r.height - 0.5);
  };

  const onPointerLeave = () => {
    rect.current = null;
    rawX.set(0);
    rawY.set(0);
  };

  return { onPointerMove, onPointerLeave, x, y };
}

/** Derive a depth-scaled {x,y} transform from a parallax source. */
export function useDepth(
  x: MotionValue<number>,
  y: MotionValue<number>,
  depth: number,
) {
  return {
    x: useTransform(x, (v) => v * depth),
    y: useTransform(y, (v) => v * depth),
  };
}
