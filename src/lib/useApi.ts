"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch, getToken, ApiError } from "./api";

// transient = worth retrying: network drop, or a 5xx / 408 / 429 from the server.
// permanent = a real 4xx (bad request, not found, forbidden) — retrying won't help.
const isTransient = (e: unknown) => !(e instanceof ApiError) || e.status >= 500 || e.status === 408 || e.status === 429;
const BACKOFF = [400, 900, 1800]; // ms — ~3s of self-healing before we surface an error

// stale-while-revalidate cache: a page you've already seen paints instantly from
// cache while it silently refreshes in the background — no empty flash on revisit.
const cache = new Map<string, unknown>();

/** Fetch tenant data for the logged-in dealer. Shows cached data instantly on
 *  revisit and revalidates; auto-retries transient failures; redirects to /login
 *  on 401. `reload()` re-runs on demand. */
export function useApi<T>(path: string) {
  const router = useRouter();
  const [data, setData] = useState<T | null>(() => (cache.has(path) ? (cache.get(path) as T) : null));
  const [loading, setLoading] = useState(!cache.has(path));
  const [error, setError] = useState<string | null>(null);
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    if (!getToken()) { router.replace("/login"); return; }
    let alive = true;
    // paint cached data immediately (if any), then revalidate quietly
    if (cache.has(path)) { setData(cache.get(path) as T); setLoading(false); } else { setLoading(true); }
    setError(null);

    (async () => {
      for (let attempt = 0; ; attempt++) {
        try {
          const d = await apiFetch<T>(path);
          if (alive) { cache.set(path, d); setData(d); setError(null); setLoading(false); }
          return;
        } catch (e) {
          if (!alive) return;
          if (e instanceof ApiError && e.status === 401) { router.replace("/login"); return; }
          if (isTransient(e) && attempt < BACKOFF.length) {
            await new Promise((r) => setTimeout(r, BACKOFF[attempt]));
            if (!alive) return;
            continue; // retry
          }
          // only surface an error if we have nothing cached to show
          if (!cache.has(path)) { setError(e instanceof Error ? e.message : "Failed to load"); setData(null); }
          setLoading(false);
          return;
        }
      }
    })();

    return () => { alive = false; };
  }, [path, router, nonce]);

  return { data, loading, error, reload: () => setNonce((n) => n + 1) };
}
