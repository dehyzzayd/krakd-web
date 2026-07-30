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

// Dashboard workspace config — the internal manager (list table + add/edit form).
export type FormField = { key: string; label: string; type: "text" | "number" | "select"; options?: string[]; placeholder?: string; attr?: boolean; half?: boolean };
export type DashConfig = {
  units: string;                                   // countable: "vehicles" | "listings"
  valueLabel: string;                              // KPI: "Retail value" | "Portfolio value"
  daysLabel: string;                               // KPI: "Avg days on lot" | "Avg days listed"
  showGross: boolean;                              // show the front-gross KPI (automotive only)
  titleField: string;                              // add/edit form label for the title input
  subtitleField: string;                           // add/edit form label for the subtitle input
  statuses: { value: string; label: string }[];    // tabs + status buttons (excludes SOLD)
  statusLabel: Record<string, string>;             // full status → label map
  tableCols: { label: string; get: (l: ListingView) => string; align?: "right" }[];
  formFields: FormField[];                          // vertical-specific inputs (non-automotive generic form)
  emptyTitle: string;
  emptyBody: string;
};

// Marketing copy for the public site templates — keeps CTAs, tickers and the finance page on-vertical.
export type MarketConfig = {
  financeNav: string | null;                       // nav/page label ("Financing"), or null to hide finance entirely
  headerCtaTo: "financing" | "contact" | "book";   // where the header button links
  financeBtn: string;                              // header button ("Get financing" / "Reserve")
  heroSecondary: { label: string; to: "financing" | "contact" | "book" }; // hero's secondary button
  showFinanceBands: boolean;                       // render the finance marketing bands inside home templates
  ticker: string[];                                // marquee strip (bold template)
  defaultWhy: { title: string; body: string }[];   // used when the owner hasn't written their own
  steps: { t: string; b: string }[];               // "how it works" (3)
  stats: [string, string][];                       // stat strip pairs
  financePage: { heading: string; sub: string; formHeading: string; perks: { t: string; b: string }[]; steps: string[] };
};

export type VerticalDef = {
  noun: string; plural: string;            // "vehicle"/"inventory", "property"/"listings"
  bookingLabel: string;                    // "Test drive" / "Viewing"
  searchPlaceholder: string;
  market: MarketConfig;
  finance: { show: boolean; label: string; term: number; apr: number; downPct: number } | null;
  titleOf: (l: ListingView) => string;
  subtitleOf: (l: ListingView) => string;
  specs: (l: ListingView) => Spec[];       // card chips
  detail: (l: ListingView) => Spec[];      // detail spec table
  badges: (l: ListingView) => string[];
  facets: Facet[];
  sorts: { key: string; label: string }[];
  dash: DashConfig;
};

const num = (v: unknown) => (typeof v === "number" ? v : Number(v) || 0);
const str = (v: unknown) => (v == null ? "" : String(v));

const AUTOMOTIVE: VerticalDef = {
  noun: "vehicle", plural: "inventory", bookingLabel: "Test drive", searchPlaceholder: "Search make, model or keyword…",
  market: {
    financeNav: "Financing", headerCtaTo: "financing", financeBtn: "Get financing", heroSecondary: { label: "Get pre-qualified", to: "financing" },
    showFinanceBands: true,
    ticker: ["In stock now", "All-credit financing", "Trade-ins welcome", "Multi-point inspected", "Drive home today"],
    defaultWhy: [
      { title: "Hand-picked inventory", body: "Every vehicle is selected for quality and priced to the live market — never over sticker." },
      { title: "Inspected & reconditioned", body: "A rigorous multi-point inspection and full reconditioning before any car hits the lot." },
      { title: "Financing for everyone", body: "Get pre-qualified in minutes with lenders for every credit situation — all online." },
    ],
    steps: [
      { t: "Browse", b: "Filter our live inventory and find your match." },
      { t: "Get pre-qualified", b: "Apply online in minutes — all credit welcome." },
      { t: "Drive home", b: "Pick it up, or we deliver. Simple." },
    ],
    stats: [["All credit", "Financing"], ["Inspected", "Every vehicle"], ["Trade-ins", "Top dollar"]],
    financePage: {
      heading: "Financing made simple.", sub: "Get pre-qualified in minutes — options for every credit situation, with no impact to your score.",
      formHeading: "Get pre-qualified",
      perks: [
        { t: "All credit welcome", b: "Good, bad, or building — we work with lenders for every situation." },
        { t: "Fast pre-approval", b: "Apply in minutes and get a real answer, often the same day." },
        { t: "No obligation", b: "Getting pre-qualified won't affect your credit or commit you to anything." },
      ],
      steps: ["Submit the quick pre-qualification form.", "We match you with the right lender.", "Pick your vehicle and drive home."],
    },
  },
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
  dash: {
    units: "vehicles", valueLabel: "Retail value", daysLabel: "Avg days on lot", showGross: true,
    titleField: "Title", subtitleField: "Trim",
    statuses: [{ value: "AVAILABLE", label: "Available" }, { value: "RECON", label: "In recon" }, { value: "RESERVED", label: "Reserved" }, { value: "WHOLESALE", label: "Wholesale" }],
    statusLabel: { AVAILABLE: "Available", RECON: "In recon", RESERVED: "Reserved", WHOLESALE: "Wholesale", SOLD: "Sold" },
    tableCols: [
      { label: "Miles", align: "right", get: (l) => (l.mileage ? `${Math.round(l.mileage / 1000)}k` : "—") },
      { label: "Body", get: (l) => l.body || "—" },
      { label: "Drivetrain", get: (l) => l.drivetrain || "—" },
      { label: "Fuel", get: (l) => l.fuel || "—" },
      { label: "Ext. color", get: (l) => l.color || "—" },
    ],
    formFields: [],
    emptyTitle: "No inventory yet",
    emptyBody: "Add or import your first vehicle — decode the VIN, price it, and push it live across every channel in one click.",
  },
};

const REAL_ESTATE: VerticalDef = {
  noun: "property", plural: "listings", bookingLabel: "Viewing", searchPlaceholder: "Search address, neighborhood or keyword…",
  market: {
    financeNav: "Financing", headerCtaTo: "financing", financeBtn: "Get pre-approved", heroSecondary: { label: "Book a viewing", to: "book" },
    showFinanceBands: false,
    ticker: ["New listings weekly", "Local market experts", "Private showings", "Sold with confidence", "Mortgage guidance"],
    defaultWhy: [
      { title: "Local market experts", body: "Decades of combined experience across the city's most sought-after neighborhoods and price points." },
      { title: "White-glove representation", body: "From first showing to closing table, a dedicated agent guides every step — nothing is outsourced." },
      { title: "Financing made easy", body: "Our mortgage partners pre-approve you in a single conversation, so you can make an offer with confidence." },
    ],
    steps: [
      { t: "Browse", b: "Explore our current listings and save the ones you love." },
      { t: "Book a showing", b: "Tour any property with a dedicated local agent." },
      { t: "Make it home", b: "We guide you from offer to closing table." },
    ],
    stats: [["Pre-approval", "In a day"], ["Local", "Market experts"], ["Private", "Showings"]],
    financePage: {
      heading: "Financing made simple.", sub: "Get pre-approved in a single conversation — conventional, jumbo and first-time buyer programs available.",
      formHeading: "Get pre-approved",
      perks: [
        { t: "One conversation", b: "Our mortgage partners pre-approve you fast, so you can make an offer with confidence." },
        { t: "Fast turnaround", b: "Most buyers hear back the same day, so you can move quickly on the right home." },
        { t: "Every program", b: "Conventional, jumbo, FHA and first-time buyer options — matched to your goals." },
      ],
      steps: ["Submit the quick pre-approval form.", "We connect you with a trusted lender.", "Make an offer with confidence."],
    },
  },
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
  dash: {
    units: "listings", valueLabel: "Portfolio value", daysLabel: "Avg days listed", showGross: false,
    titleField: "Listing title", subtitleField: "Address / neighborhood",
    statuses: [{ value: "AVAILABLE", label: "Active" }, { value: "RESERVED", label: "Under contract" }, { value: "RECON", label: "Coming soon" }],
    statusLabel: { AVAILABLE: "Active", RESERVED: "Under contract", RECON: "Coming soon", WHOLESALE: "Off-market", SOLD: "Sold" },
    tableCols: [
      { label: "Beds", get: (l) => (l.attributes?.beds != null ? String(l.attributes.beds) : "—") },
      { label: "Baths", get: (l) => (l.attributes?.baths != null ? String(l.attributes.baths) : "—") },
      { label: "Sqft", align: "right", get: (l) => (l.attributes?.sqft != null ? Number(l.attributes.sqft).toLocaleString() : "—") },
      { label: "Type", get: (l) => (l.attributes?.propertyType ? String(l.attributes.propertyType) : "—") },
    ],
    formFields: [
      { key: "propertyType", label: "Property type", type: "select", options: ["House", "Condo", "Townhouse", "Multi-family", "Land"], attr: true, half: true },
      { key: "beds", label: "Bedrooms", type: "number", attr: true, half: true, placeholder: "3" },
      { key: "baths", label: "Bathrooms", type: "number", attr: true, half: true, placeholder: "2" },
      { key: "sqft", label: "Interior sqft", type: "number", attr: true, half: true, placeholder: "1850" },
      { key: "yearBuilt", label: "Year built", type: "number", attr: true, half: true, placeholder: "2019" },
      { key: "lotSize", label: "Lot size", type: "text", attr: true, half: true, placeholder: "0.25 acre" },
      { key: "parking", label: "Parking", type: "text", attr: true, half: true, placeholder: "2-car garage" },
      { key: "neighborhood", label: "Neighborhood", type: "text", attr: true, half: true, placeholder: "Travis Heights" },
    ],
    emptyTitle: "No listings yet",
    emptyBody: "Add your first property — set the address, beds, baths and price, and it goes live on your site in one click.",
  },
};

const MEDICAL: VerticalDef = {
  noun: "service", plural: "services", bookingLabel: "Appointment", searchPlaceholder: "Search treatments or providers…",
  market: {
    financeNav: null, headerCtaTo: "book", financeBtn: "Book appointment", heroSecondary: { label: "Request appointment", to: "book" },
    showFinanceBands: false,
    ticker: ["Accepting new patients", "Most insurance accepted", "Same-day appointments", "Gentle, modern care", "Book online"],
    defaultWhy: [
      { title: "Experienced providers", body: "A credentialed team delivering attentive, up-to-date care for every patient." },
      { title: "Most insurance accepted", body: "We work with major plans and offer clear self-pay options — no surprises." },
      { title: "Comfortable, modern care", body: "A calm, modern practice built around your time and your comfort." },
    ],
    steps: [
      { t: "Find your care", b: "Browse the services and providers we offer." },
      { t: "Request an appointment", b: "Tell us what you need and your availability." },
      { t: "We confirm & see you", b: "Our team confirms and takes it from there." },
    ],
    stats: [["New patients", "Welcome"], ["Most", "Insurance"], ["Same-day", "Availability"]],
    financePage: { heading: "", sub: "", formHeading: "", perks: [], steps: [] },
  },
  finance: null,
  titleOf: (l) => l.title || "Service",
  subtitleOf: (l) => l.subtitle || str(l.attributes?.category) || "",
  specs: (l) => [
    l.attributes?.category ? { label: "category", value: str(l.attributes.category) } : null,
    l.attributes?.provider ? { label: "provider", value: str(l.attributes.provider) } : null,
    l.attributes?.duration ? { label: "duration", value: str(l.attributes.duration) } : null,
  ].filter(Boolean) as Spec[],
  detail: (l) => ([
    ["Category", str(l.attributes?.category) || "—"], ["Provider", str(l.attributes?.provider) || "—"],
    ["Duration", str(l.attributes?.duration) || "—"], ["Insurance", str(l.attributes?.insurance) || "—"],
  ] as [string, string][]).map(([label, value]) => ({ label, value })),
  badges: (l) => {
    const out: string[] = [];
    if (str(l.attributes?.insurance) === "Most plans") out.push("Insurance OK");
    if (str(l.attributes?.category)) out.push(str(l.attributes?.category));
    return out.slice(0, 2);
  },
  facets: [
    { key: "category", label: "Category", kind: "check", value: (l) => str(l.attributes?.category) },
    { key: "provider", label: "Provider", kind: "check", value: (l) => str(l.attributes?.provider) },
    { key: "price", label: "Max price", kind: "max", steps: [100, 250, 500, 1000, 2500], fmt: (n) => `$${n}`, value: (l) => l.price },
  ],
  sorts: [{ key: "newest", label: "Newest" }, { key: "price_low", label: "Price: low → high" }, { key: "price_high", label: "Price: high → low" }],
  dash: {
    units: "services", valueLabel: "List value", daysLabel: "Avg days listed", showGross: false,
    titleField: "Service name", subtitleField: "Short tagline",
    statuses: [{ value: "AVAILABLE", label: "Offered" }, { value: "RESERVED", label: "Limited" }, { value: "RECON", label: "Coming soon" }],
    statusLabel: { AVAILABLE: "Offered", RESERVED: "Limited", RECON: "Coming soon", WHOLESALE: "Retired", SOLD: "Discontinued" },
    tableCols: [
      { label: "Category", get: (l) => (l.attributes?.category ? str(l.attributes.category) : "—") },
      { label: "Provider", get: (l) => (l.attributes?.provider ? str(l.attributes.provider) : "—") },
      { label: "Duration", get: (l) => (l.attributes?.duration ? str(l.attributes.duration) : "—") },
    ],
    formFields: [
      { key: "category", label: "Category", type: "select", options: ["Preventive", "Cosmetic", "Restorative", "Diagnostic", "Surgical", "Wellness"], attr: true, half: true },
      { key: "provider", label: "Provider", type: "text", attr: true, half: true, placeholder: "Dr. Alvarez" },
      { key: "duration", label: "Duration", type: "text", attr: true, half: true, placeholder: "45 min" },
      { key: "insurance", label: "Insurance", type: "select", options: ["Most plans", "Select plans", "Self-pay"], attr: true, half: true },
    ],
    emptyTitle: "No services yet",
    emptyBody: "Add your first service — name it, set the details, and it goes live on your site in one click.",
  },
};

export const VERTICALS: Record<string, VerticalDef> = { AUTOMOTIVE, REAL_ESTATE, MEDICAL };
export const vertical = (v?: string | null): VerticalDef => VERTICALS[v ?? "AUTOMOTIVE"] ?? AUTOMOTIVE;

export function estMonthlyFor(def: VerticalDef, priceCents: number): number {
  if (!def.finance || !priceCents) return 0;
  const { term, apr, downPct } = def.finance;
  const principal = (priceCents / 100) * (1 - downPct);
  const r = apr / 100 / 12;
  return Math.round(r === 0 ? principal / term : (principal * r) / (1 - Math.pow(1 + r, -term)));
}
