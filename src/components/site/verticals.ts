/** Vertical registry — the one place that makes the same engine render as a car lot,
 * a real-estate brokerage, etc. Add a vertical here; no schema migration needed. */

export type Vertical = "AUTOMOTIVE" | "REAL_ESTATE" | "RESTAURANT" | "SERVICES" | "RETAIL" | "GENERIC";

export type ListingView = {
  year?: number | null; make?: string; model?: string; trim?: string; body?: string;
  mileage?: number; drivetrain?: string; fuel?: string; transmission?: string; vin?: string; color?: string;
  title?: string | null; subtitle?: string | null; attributes?: Record<string, unknown>;
  price: number;
};

type Spec = { label: string; value: string };
type Facet =
  | { key: string; label: string; kind: "check"; value: (l: ListingView) => string }
  | { key: string; label: string; kind: "max"; steps: number[]; fmt: (n: number) => string; value: (l: ListingView) => number }
  | { key: string; label: string; kind: "min"; steps: number[]; value: (l: ListingView) => number };

export type VerticalDef = {
  noun: string; plural: string;            // "vehicle"/"inventory", "property"/"listings"
  bookingLabel: string;                    // "Test drive" / "Viewing"
  searchPlaceholder: string;
  finance: { show: boolean; label: string; term: number; apr: number; downPct: number } | null;
  titleOf: (l: ListingView) => string;
  subtitleOf: (l: ListingView) => string;
  specs: (l: ListingView) => Spec[];       // card chips
  detail: (l: ListingView) => Spec[];      // detail spec table
  badges: (l: ListingView) => string[];
  facets: Facet[];
  sorts: { key: string; label: string }[];
};

const num = (v: unknown) => (typeof v === "number" ? v : Number(v) || 0);
const str = (v: unknown) => (v == null ? "" : String(v));

const AUTOMOTIVE: VerticalDef = {
  noun: "vehicle", plural: "inventory", bookingLabel: "Test drive", searchPlaceholder: "Search make, model or keyword…",
  finance: { show: true, label: "est.", term: 72, apr: 8.9, downPct: 0.1 },
  titleOf: (l) => [l.year, l.make, l.model].filter(Boolean).join(" ") || l.title || "Vehicle",
  subtitleOf: (l) => l.trim || l.body || "",
  specs: (l) => [
    l.mileage ? { label: "mi", value: `${l.mileage.toLocaleString()} mi` } : null,
    l.drivetrain ? { label: "drive", value: l.drivetrain } : null,
    l.fuel ? { label: "fuel", value: l.fuel } : null,
  ].filter(Boolean) as Spec[],
  detail: (l) => ([
    ["Mileage", l.mileage ? `${l.mileage.toLocaleString()} mi` : "—"], ["Year", l.year ? `${l.year}` : "—"],
    ["Body", l.body || "—"], ["Drivetrain", l.drivetrain || "—"], ["Fuel", l.fuel || "—"],
    ["Transmission", l.transmission || "—"], ["Exterior", l.color || "—"], ["VIN", l.vin || "—"],
  ] as [string, string][]).map(([label, value]) => ({ label, value })),
  badges: (l) => {
    const out: string[] = []; const age = new Date().getFullYear() - (l.year ?? 0);
    if (l.mileage && l.mileage < 30000) out.push("Low miles");
    if (l.year && age <= 2) out.push(`${l.year}`);
    if ((l.fuel ?? "").toLowerCase().includes("electric")) out.push("Electric");
    else if (["4WD", "AWD"].includes((l.drivetrain ?? "").toUpperCase())) out.push(l.drivetrain!.toUpperCase());
    return out.slice(0, 2);
  },
  facets: [
    { key: "make", label: "Make", kind: "check", value: (l) => str(l.make) },
    { key: "body", label: "Body type", kind: "check", value: (l) => str(l.body) },
    { key: "fuel", label: "Fuel", kind: "check", value: (l) => str(l.fuel) },
    { key: "drivetrain", label: "Drivetrain", kind: "check", value: (l) => str(l.drivetrain) },
    { key: "price", label: "Max price", kind: "max", steps: [15000, 20000, 30000, 45000, 60000, 80000], fmt: (n) => `$${(n / 1000)}k`, value: (l) => l.price },
  ],
  sorts: [{ key: "newest", label: "Newest" }, { key: "price_low", label: "Price: low → high" }, { key: "price_high", label: "Price: high → low" }, { key: "miles_low", label: "Fewest miles" }],
};

const REAL_ESTATE: VerticalDef = {
  noun: "property", plural: "listings", bookingLabel: "Viewing", searchPlaceholder: "Search address, neighborhood or keyword…",
  finance: { show: true, label: "est. mortgage", term: 360, apr: 6.5, downPct: 0.2 },
  titleOf: (l) => l.title || [str(l.attributes?.beds) && `${str(l.attributes?.beds)} bed`, str(l.attributes?.propertyType)].filter(Boolean).join(" ") || "Property",
  subtitleOf: (l) => l.subtitle || str(l.attributes?.neighborhood) || str(l.attributes?.propertyType) || "",
  specs: (l) => [
    l.attributes?.beds != null ? { label: "beds", value: `${num(l.attributes.beds)} bd` } : null,
    l.attributes?.baths != null ? { label: "baths", value: `${num(l.attributes.baths)} ba` } : null,
    l.attributes?.sqft != null ? { label: "sqft", value: `${num(l.attributes.sqft).toLocaleString()} sqft` } : null,
  ].filter(Boolean) as Spec[],
  detail: (l) => ([
    ["Bedrooms", str(l.attributes?.beds) || "—"], ["Bathrooms", str(l.attributes?.baths) || "—"],
    ["Interior", l.attributes?.sqft != null ? `${num(l.attributes.sqft).toLocaleString()} sqft` : "—"],
    ["Lot", str(l.attributes?.lotSize) || "—"], ["Type", str(l.attributes?.propertyType) || "—"],
    ["Year built", str(l.attributes?.yearBuilt) || "—"], ["Parking", str(l.attributes?.parking) || "—"],
    ["Neighborhood", str(l.attributes?.neighborhood) || "—"],
  ] as [string, string][]).map(([label, value]) => ({ label, value })),
  badges: (l) => {
    const out: string[] = [];
    if (l.attributes?.status === "new") out.push("New listing");
    if (l.attributes?.reduced) out.push("Price reduced");
    if (str(l.attributes?.propertyType)) out.push(str(l.attributes?.propertyType));
    return out.slice(0, 2);
  },
  facets: [
    { key: "propertyType", label: "Property type", kind: "check", value: (l) => str(l.attributes?.propertyType) },
    { key: "beds", label: "Beds", kind: "min", steps: [1, 2, 3, 4, 5], value: (l) => num(l.attributes?.beds) },
    { key: "baths", label: "Baths", kind: "min", steps: [1, 2, 3], value: (l) => num(l.attributes?.baths) },
    { key: "price", label: "Max price", kind: "max", steps: [300000, 500000, 750000, 1000000, 1500000, 2500000], fmt: (n) => `$${(n / 1000)}k`, value: (l) => l.price },
  ],
  sorts: [{ key: "newest", label: "Newest" }, { key: "price_low", label: "Price: low → high" }, { key: "price_high", label: "Price: high → low" }],
};

export const VERTICALS: Record<string, VerticalDef> = { AUTOMOTIVE, REAL_ESTATE };
export const vertical = (v?: string | null): VerticalDef => VERTICALS[v ?? "AUTOMOTIVE"] ?? AUTOMOTIVE;

export function estMonthlyFor(def: VerticalDef, priceCents: number): number {
  if (!def.finance || !priceCents) return 0;
  const { term, apr, downPct } = def.finance;
  const principal = (priceCents / 100) * (1 - downPct);
  const r = apr / 100 / 12;
  return Math.round(r === 0 ? principal / term : (principal * r) / (1 - Math.pow(1 + r, -term)));
}
