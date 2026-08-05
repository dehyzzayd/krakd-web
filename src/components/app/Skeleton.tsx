import { cn } from "@/lib/cn";

/** A shimmering placeholder block. Compose these into page-shaped skeletons so
 *  the layout never flashes empty before data arrives. */
export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("shimmer rounded-md", className)} aria-hidden />;
}

/** Row of KPI cards. */
export function SkeletonKpis({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-2xl border border-n200 bg-white p-4">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="mt-3 h-7 w-16" />
        </div>
      ))}
    </div>
  );
}

/** Just the shimmer rows — drop inside an existing card/table container. */
export function SkeletonRows({ rows = 6, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div>
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex items-center gap-3 border-b border-n100 px-4 py-3 last:border-0">
          <Skeleton className="h-9 w-9 shrink-0 rounded-full" />
          <Skeleton className="h-3.5 flex-1" />
          {Array.from({ length: Math.max(0, cols - 2) }).map((_, c) => (
            <Skeleton key={c} className="hidden h-3.5 w-20 sm:block" />
          ))}
        </div>
      ))}
    </div>
  );
}

/** A card wrapping a table with shimmer rows. */
export function SkeletonTable({ rows = 6, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-n200 bg-white sh-card">
      <div className="flex items-center gap-3 border-b border-n200 px-4 py-3.5">
        <Skeleton className="h-4 w-32" />
      </div>
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex items-center gap-3 border-b border-n100 px-4 py-3 last:border-0">
          <Skeleton className="h-9 w-9 shrink-0 rounded-full" />
          <Skeleton className="h-3.5 flex-1" />
          {Array.from({ length: Math.max(0, cols - 2) }).map((_, c) => (
            <Skeleton key={c} className="hidden h-3.5 w-20 sm:block" />
          ))}
        </div>
      ))}
    </div>
  );
}
