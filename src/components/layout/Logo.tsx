import { cn } from "@/lib/cn";

/**
 * Krakd wordmark — no icon. The mark is the type: a tight geometric grotesk
 * with the accent living in a single trailing dot (the ink-mark motif).
 */
export function Logo({
  className,
  onDark = false,
}: {
  className?: string;
  onDark?: boolean;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-baseline text-[19px] font-semibold leading-none tracking-[-0.04em]",
        onDark ? "text-white" : "text-ink",
        className,
      )}
    >
      Krakd
      <span className="text-accent">.</span>
    </span>
  );
}
