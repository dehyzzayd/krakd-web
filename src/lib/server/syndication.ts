/** Inventory syndication feeds. Marketplaces (Facebook/Meta catalog, Google
 *  Vehicle Ads, AutoTrader/Cars.com via generic CSV) PULL a feed URL on a
 *  schedule — so we expose the dealer's live inventory as a marketplace-ready
 *  file. No marketplace API keys required; the dealer points their catalog at
 *  the URL. */

export type FeedVehicle = {
  id: string; vin: string | null; stock: string | null;
  year: number | null; make: string | null; model: string | null; trim: string | null;
  mileage: number; priceCents: number; exteriorColor: string | null; bodyType: string | null;
  photoUrls: string[];
};
export type FeedDealer = { name: string; phone: string | null; addressLine1: string | null; city: string | null; state: string | null; postalCode: string | null };

const esc = (v: unknown) => {
  const s = String(v ?? "");
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};
const csv = (head: string[], rows: (string | number)[][]) => [head.join(","), ...rows.map((r) => r.map(esc).join(","))].join("\r\n");

export function buildInventoryFeed(dealer: FeedDealer, vehicles: FeedVehicle[], opts: { baseUrl: string; slug: string; format: "meta" | "csv" }): string {
  const vdp = (id: string) => `${opts.baseUrl}/site/${opts.slug}/inventory/${id}`;
  const title = (v: FeedVehicle) => [v.year, v.make, v.model, v.trim].filter(Boolean).join(" ");

  if (opts.format === "meta") {
    // Facebook / Meta Automotive Inventory Ads catalog columns
    const head = ["vehicle_id", "title", "description", "url", "make", "model", "year", "mileage.value", "mileage.unit", "price", "state_of_vehicle", "exterior_color", "vin", "body_style", "dealer_name", "address.addr1", "address.city", "address.region", "address.postal_code", "address.country", "availability", "image[0].url"];
    const rows = vehicles.map((v) => [
      v.stock || v.id,
      title(v),
      `${title(v)} available now at ${dealer.name}.`,
      vdp(v.id),
      v.make ?? "", v.model ?? "", v.year ?? "",
      v.mileage || 0, "MI",
      `${Math.round(v.priceCents / 100)} USD`,
      "USED",
      v.exteriorColor ?? "",
      v.vin ?? "",
      v.bodyType ?? "",
      dealer.name, dealer.addressLine1 ?? "", dealer.city ?? "", dealer.state ?? "", dealer.postalCode ?? "", "US",
      "available",
      v.photoUrls[0] ?? "",
    ]);
    return csv(head, rows);
  }

  // generic marketplace CSV (broadly compatible with AutoTrader/Cars.com-style ingest)
  const head = ["stock", "vin", "year", "make", "model", "trim", "mileage", "price", "exterior_color", "body_type", "photo_count", "url", "image_url", "dealer_name", "dealer_phone", "city", "state", "zip"];
  const rows = vehicles.map((v) => [
    v.stock ?? "", v.vin ?? "", v.year ?? "", v.make ?? "", v.model ?? "", v.trim ?? "",
    v.mileage || 0, Math.round(v.priceCents / 100), v.exteriorColor ?? "", v.bodyType ?? "", v.photoUrls.length,
    vdp(v.id), v.photoUrls[0] ?? "", dealer.name, dealer.phone ?? "", dealer.city ?? "", dealer.state ?? "", dealer.postalCode ?? "",
  ]);
  return csv(head, rows);
}
