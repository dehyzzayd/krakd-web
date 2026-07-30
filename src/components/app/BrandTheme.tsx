"use client";

import { useEffect, useState } from "react";
import { apiFetch, getToken } from "@/lib/api";

/* Recolors the dashboard accent (--color-brand + derived) from the business's
 * global Settings brand color. Scoped to .app-scope via an injected <style>, so
 * marketing + public sites are untouched. No brand set → theme default stands. */
const clamp = (n: number) => Math.max(0, Math.min(255, Math.round(n)));
function shift(hex: string, amt: number): string {
  const m = /^#([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return hex;
  const n = parseInt(m[1], 16);
  const r = clamp((n >> 16) + amt), g = clamp(((n >> 8) & 0xff) + amt), b = clamp((n & 0xff) + amt);
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
}

export function BrandTheme() {
  const [brand, setBrand] = useState<string | null>(null);
  useEffect(() => {
    if (!getToken()) return;
    apiFetch<{ brandColor?: string | null }>("/overview")
      .then((d) => { if (d.brandColor && /^#[0-9a-f]{6}$/i.test(d.brandColor)) setBrand(d.brandColor); })
      .catch(() => {});
  }, []);
  if (!brand) return null;
  const css = `.app-scope{--color-brand:${brand};--color-brand-hover:${shift(brand, -26)};--color-brand-soft:color-mix(in srgb, ${brand} 12%, white);}`;
  return <style>{css}</style>;
}
