/** Marketplace integrations registry. Shared by the settings UI and the server
 *  delivery engine. Only providers that actually move data are listed — each
 *  delivers real leads / credit apps to a dealer-supplied webhook or email. */

export type IntegrationCategory = "crm" | "credit";
export type IntegrationField = { key: string; label: string; type: "text" | "password" | "url" | "email"; placeholder?: string; hint?: string };

export type IntegrationDef = {
  id: string;
  name: string;
  category: IntegrationCategory;
  blurb: string;
  logo?: string;
  fields: IntegrationField[];
  priceCents: number | null;
  hasMode?: boolean;              // automatic vs manual submission
  deliver: "lead" | "creditapp" | null;
  live: boolean;
  trialDays?: number;
};

const webhook = (name: string): IntegrationField => ({ key: "webhookUrl", label: `${name} webhook URL`, type: "url", placeholder: "https://…", hint: `Paste the inbound webhook / lead-intake URL from ${name}.` });

export const INTEGRATIONS: IntegrationDef[] = [
  // ── CRM (push leads to a dealer-provided webhook) ──
  { id: "gohighlevel", name: "GoHighLevel", category: "crm", blurb: "Sync every new lead into GoHighLevel in real time.", logo: "https://d2gdx5nv84sdx2.cloudfront.net/uploads/xziokecu/theme/brand/3036/logo/HighLevel_Logo_Full_Color_Dark_Blue_Artwork.png", fields: [webhook("GoHighLevel")], priceCents: null, deliver: "lead", live: true },
  { id: "lightspeed", name: "LightSpeed", category: "crm", blurb: "Push leads and customer data into LightSpeed CRM.", logo: "https://repay.com/wp-content/uploads/2025/02/Lightspeed-Logo-1024x117.png", fields: [webhook("LightSpeed")], priceCents: null, deliver: "lead", live: true },
  { id: "verifacto", name: "Verifacto", category: "crm", blurb: "Send leads to Verifacto for identity & insurance verification.", logo: "https://verifacto.com/wp-content/uploads/2017/09/verifacto_logo.png", fields: [webhook("Verifacto")], priceCents: null, deliver: "lead", live: true },

  // ── Credit application delivery ──
  { id: "automaticusa", name: "Automatic USA", category: "credit", blurb: "Automatically send credit applications to Automatic USA.", logo: "https://www.automaticusa.com/assets/images/home/logo.webp", fields: [{ key: "email", label: "Automatic USA intake email", type: "email", placeholder: "apps@automaticusa.com" }, { key: "webhookUrl", label: "or webhook URL (optional)", type: "url", placeholder: "https://…" }], priceCents: null, deliver: "creditapp", live: true, hasMode: true, trialDays: 60 },
  { id: "dealercenter", name: "DealerCenter", category: "credit", blurb: "Send credit applications straight to DealerCenter.", logo: "https://blob.westlakefinancial.com/media/2020/09/dealercenter-logo-1-scaled.png", fields: [{ key: "email", label: "DealerCenter intake email", type: "email", placeholder: "deals@dealercenter.com" }, { key: "webhookUrl", label: "or webhook URL (optional)", type: "url", placeholder: "https://…" }], priceCents: null, deliver: "creditapp", live: true, hasMode: true },
];

export const byId = (id: string) => INTEGRATIONS.find((i) => i.id === id);
export const CATEGORY_LABEL: Record<IntegrationCategory, string> = { crm: "CRM", credit: "Credit application" };

export type ProviderConfig = { enabled?: boolean; connectedAt?: string; mode?: "automatic" | "manual"; [k: string]: unknown };
export type IntegrationsRecord = Record<string, ProviderConfig>;
