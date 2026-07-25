import type { Variants, Transition } from "motion/react";

/** Shared motion tokens so easing/timing stay consistent across the site. */
export const easeExpo = [0.16, 1, 0.3, 1] as const;
export const easeQuint = [0.22, 1, 0.36, 1] as const;
export const easeSoft = [0.65, 0, 0.35, 1] as const;

export const springSoft: Transition = {
  type: "spring",
  stiffness: 120,
  damping: 20,
  mass: 0.9,
};

/** Staggered rise used for hero copy + section intros. */
export const riseParent: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.09, delayChildren: 0.1 } },
};

export const riseChild: Variants = {
  hidden: { opacity: 0, y: 22, filter: "blur(8px)" },
  show: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.9, ease: easeExpo },
  },
};
