"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch, getToken, ApiError } from "./api";

// transient = worth retrying: network drop, or a 5xx / 408 / 429 from the server.
// permanent = a real 4xx (bad request, not found, forbidden) — retrying won't help.
const isTransient = (e: unknown) => !(e instanceof ApiError) || e.status >= 500 || e.status === 408 || e.status === 429;
const BACKOFF = [400, 900, 1800]; // ms — ~3s of self-healing before we surface an error

/** Fetch tenant data for the logged-in dealer. Auto-retries transient failures
 *  (network blips, momentary 5xx) before surfacing an error; redirects to /login
 *  on 401. `reload()` re-runs on demand. */
export function useApi<T>(path: string) {
  const router = useRouter();
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    if (!getToken()) { router.replace("/login"); return; }
    let alive = true;
    setLoading(true); setError(null);

    (async () => {
      for (let attempt = 0; ; attempt++) {
        try {
          const d = await apiFetch<T>(path);
          if (alive) { setData(d); setError(null); setLoading(false); }
          return;
        } catch (e) {
          if (!alive) return;
          if (e instanceof ApiError && e.status === 401) { router.replace("/login"); return; }
          if (isTransient(e) && attempt < BACKOFF.length) {
            await new Promise((r) => setTimeout(r, BACKOFF[attempt]));
            if (!alive) return;
            continue; // retry
          }
          setError(e instanceof Error ? e.message : "Failed to load");
          setLoading(false);
          return;
        }
      }
    })();

    return () => { alive = false; };
  }, [path, router, nonce]);

  return { data, loading, error, reload: () => setNonce((n) => n + 1) };
}
