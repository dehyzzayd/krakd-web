/** Marketplace integrations registry. Shared by the settings UI and the server
 *  delivery engine. "live" providers deliver real data now via a dealer-supplied
 *  webhook/email (no vendor API needed). Non-live providers store config and
 *  activate when Krakd finishes the vendor-side wiring (same pattern as the
 *  Stripe/OAuth launch tasks). */

export type IntegrationCategory = "crm" | "credit" | "inventory";
export type IntegrationField = { key: string; label: string; type: "text" | "password" | "url" | "email"; placeholder?: string; hint?: string };

export type IntegrationDef = {
  id: string;
  name: string;
  category: IntegrationCategory;
  blurb: string;
  fields: IntegrationField[];
  priceCents: number | null;      // paid subscription (Stripe checkout wired at launch)
  hasMode?: boolean;              // automatic vs manual submission
  /** What Krakd delivers to this provider's webhook/email when live. */
  deliver: "lead" | "creditapp" | null;
  /** true = works now via dealer-supplied webhook/email; false = config stored, vendor API wired at launch. */
  live: boolean;
  trialDays?: number;
};

const webhook = (name: string): IntegrationField => ({ key: "webhookUrl", label: `${name} webhook URL`, type: "url", placeholder: "https://…", hint: `Paste the inbound webhook / lead-intake URL from ${name}.` });

export const INTEGRATIONS: IntegrationDef[] = [
  // ── CRM (live: push leads to a dealer-provided webhook) ──
  { id: "gohighlevel", name: "GoHighLevel", category: "crm", blurb: "Sync every new lead into GoHighLevel in real time.", fields: [webhook("GoHighLevel")], priceCents: null, deliver: "lead", live: true },
  { id: "lightspeed", name: "LightSpeed", category: "crm", blurb: "Push leads and customer data into LightSpeed CRM.", fields: [webhook("LightSpeed")], priceCents: null, deliver: "lead", live: true },
  { id: "verifacto", name: "Verifacto", category: "crm", blurb: "Send leads to Verifacto for identity & insurance verification.", fields: [webhook("Verifacto")], priceCents: null, deliver: "lead", live: true },

  // ── Credit application delivery ──
  { id: "automaticusa", name: "Automatic USA", category: "credit", blurb: "Automatically send credit applications to Automatic USA.", fields: [{ key: "email", label: "Automatic USA intake email", type: "email", placeholder: "apps@automaticusa.com" }, { key: "webhookUrl", label: "or webhook URL (optional)", type: "url", placeholder: "https://…" }], priceCents: null, deliver: "creditapp", live: true, hasMode: true, trialDays: 60 },
  { id: "dealercenter", name: "DealerCenter", category: "credit", blurb: "Send credit applications straight to DealerCenter.", fields: [{ key: "email", label: "DealerCenter intake email", type: "email", placeholder: "deals@dealercenter.com" }, { key: "webhookUrl", label: "or webhook URL (optional)", type: "url", placeholder: "https://…" }], priceCents: null, deliver: "creditapp", live: true, hasMode: true },
  { id: "routeone", name: "RouteOne", category: "credit", blurb: "Submit credit apps to RouteOne's lender network.", fields: [{ key: "routeoneId", label: "RouteOne dealer ID", type: "text", placeholder: "Your RouteOne ID" }], priceCents: 4400, deliver: "creditapp", live: false, hasMode: true },

  // ── Inventory & vehicle data (vendor API — activates at launch) ──
  { id: "carfaxusa", name: "Carfax USA", category: "inventory", blurb: "Show Carfax vehicle history reports on your listings.", fields: [{ key: "username", label: "Carfax username", type: "text" }, { key: "password", label: "Carfax password", type: "password" }], priceCents: null, deliver: null, live: false },
  { id: "carfaxcanada", name: "Carfax Canada", category: "inventory", blurb: "Canadian vehicle history with accident & service records.", fields: [{ key: "token", label: "Integration token", type: "text", hint: "From your Carfax Canada dealer portal." }], priceCents: null, deliver: null, live: false },
  { id: "autocheck", name: "AutoCheck", category: "inventory", blurb: "Experian-powered vehicle history reports.", fields: [{ key: "autocheckId", label: "AutoCheck ID", type: "text" }], priceCents: null, deliver: null, live: false },
  { id: "vinaudit", name: "VinAudit", category: "inventory", blurb: "Title records, odometer and market values.", fields: [], priceCents: null, deliver: null, live: false },
  { id: "kbb", name: "Kelley Blue Book", category: "inventory", blurb: "Trusted KBB pricing & valuations on your listings.", fields: [], priceCents: 6500, deliver: null, live: false },
  { id: "jdpower", name: "J.D. Power", category: "inventory", blurb: "J.D. Power valuations and market insights.", fields: [], priceCents: 7900, deliver: null, live: false },
];

export const byId = (id: string) => INTEGRATIONS.find((i) => i.id === id);
export const CATEGORY_LABEL: Record<IntegrationCategory, string> = { crm: "CRM", credit: "Credit application", inventory: "Inventory & vehicle data" };

export type ProviderConfig = { enabled?: boolean; connectedAt?: string; mode?: "automatic" | "manual"; [k: string]: unknown };
export type IntegrationsRecord = Record<string, ProviderConfig>;
