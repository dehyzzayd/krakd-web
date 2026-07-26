import type { SiteConfig, SiteVehicle } from "@/lib/server/site";

export type Template = SiteConfig["template"];

/* ── monthly payment estimate (72mo, 8.9% APR, 10% down) ── */
export function estMonthly(priceCents: number, opts?: { apr?: number; term?: number; downPct?: number }): number {
  const apr = opts?.apr ?? 8.9, term = opts?.term ?? 72, downPct = opts?.downPct ?? 0.1;
  const principal = (priceCents / 100) * (1 - downPct);
  const r = apr / 100 / 12;
  if (principal <= 0) return 0;
  const m = r === 0 ? principal / term : (principal * r) / (1 - Math.pow(1 + r, -term));
  return Math.round(m);
}

/* ── condition/value badges a dealer would show ── */
export function vehicleBadges(v: SiteVehicle): { label: string; tone: "value" | "info" | "hot" }[] {
  const out: { label: string; tone: "value" | "info" | "hot" }[] = [];
  const age = new Date().getFullYear() - v.year;
  if (v.mileage > 0 && v.mileage < 30000) out.push({ label: "Low miles", tone: "value" });
  if (age <= 2) out.push({ label: `${v.year}`, tone: "info" });
  if (v.fuel.toLowerCase().includes("electric")) out.push({ label: "Electric", tone: "hot" });
  else if (v.drivetrain.toUpperCase() === "4WD" || v.drivetrain.toUpperCase() === "AWD") out.push({ label: v.drivetrain.toUpperCase(), tone: "info" });
  return out.slice(0, 2);
}

export type TplUI = {
  name: string;
  header: "dark" | "light";
  hero: "bleed" | "light" | "cinematic";
  display: string;    // heading font/transform classes
  h1: string;         // hero headline
  h2: string;         // section heading
  eyebrow: string;    // small uppercase label
  container: string;
  band: string;       // dark band bg
  card: "sharp" | "soft" | "editorial";
  cardRadius: string;
  photo: string;
  btnRadius: string;
  btnCase: string;    // uppercase/tracking for buttons
  chip: string;
  featuredCols: string;
  invCols: string;
  inventoryFirst: boolean;
};

const BOLD: TplUI = {
  name: "Bold", header: "dark", hero: "bleed",
  display: "font-display uppercase tracking-[-0.005em]",
  h1: "text-[44px] leading-[0.95] sm:text-[72px] font-bold",
  h2: "text-[28px] sm:text-[36px] font-bold",
  eyebrow: "font-display text-[12px] font-semibold uppercase tracking-[0.22em]",
  container: "max-w-[1320px]", band: "#0a0a0a",
  card: "sharp", cardRadius: "rounded-md", photo: "aspect-[4/3]",
  btnRadius: "rounded-md", btnCase: "font-display uppercase tracking-[0.08em] text-[13px] font-semibold",
  chip: "rounded", featuredCols: "sm:grid-cols-2 lg:grid-cols-4",
  invCols: "sm:grid-cols-2 lg:grid-cols-3", inventoryFirst: true,
};

const CLEAN: TplUI = {
  name: "Clean", header: "light", hero: "light",
  display: "tracking-tight",
  h1: "text-[38px] leading-[1.03] sm:text-[54px] font-extrabold tracking-tight",
  h2: "text-[26px] sm:text-[30px] font-bold tracking-tight",
  eyebrow: "text-[12px] font-semibold uppercase tracking-[0.14em]",
  container: "max-w-[1280px]", band: "#0f172a",
  card: "soft", cardRadius: "rounded-2xl", photo: "aspect-[4/3]",
  btnRadius: "rounded-xl", btnCase: "text-[14px] font-semibold",
  chip: "rounded-full", featuredCols: "sm:grid-cols-2 lg:grid-cols-4",
  invCols: "sm:grid-cols-2 lg:grid-cols-3", inventoryFirst: false,
};

const LUXE: TplUI = {
  name: "Luxe", header: "dark", hero: "cinematic",
  display: "font-display uppercase tracking-[0.1em] font-light",
  h1: "text-[40px] leading-[1.05] sm:text-[62px] font-light tracking-[0.02em]",
  h2: "text-[24px] sm:text-[32px] font-light uppercase tracking-[0.12em]",
  eyebrow: "font-display text-[11px] font-medium uppercase tracking-[0.32em]",
  container: "max-w-[1200px]", band: "#0b0b0d",
  card: "editorial", cardRadius: "rounded-lg", photo: "aspect-[3/2]",
  btnRadius: "rounded-none", btnCase: "font-display uppercase tracking-[0.18em] text-[12px] font-medium",
  chip: "rounded-none", featuredCols: "sm:grid-cols-2 lg:grid-cols-3",
  invCols: "sm:grid-cols-2 lg:grid-cols-3", inventoryFirst: false,
};

export function siteTheme(t: Template): TplUI {
  return t === "INVENTORY_FIRST" ? BOLD : t === "PREMIUM" ? LUXE : CLEAN;
}
