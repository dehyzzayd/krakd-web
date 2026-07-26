"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch, getToken, ApiError } from "./api";

/** Fetch tenant data for the logged-in dealer. Redirects to /login if unauthed. */
export function useApi<T>(path: string) {
  const router = useRouter();
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    if (!getToken()) { router.replace("/login"); return; }
    let alive = true;
    setLoading(true);
    apiFetch<T>(path)
      .then((d) => { if (alive) { setData(d); setError(null); } })
      .catch((e) => {
        if (!alive) return;
        if (e instanceof ApiError && e.status === 401) { router.replace("/login"); return; }
        setError(e instanceof Error ? e.message : "Failed to load");
      })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [path, router, nonce]);

  return { data, loading, error, reload: () => setNonce((n) => n + 1) };
}
