import { Writable } from "stream";
import { prisma } from "@/lib/db";
import type { Prisma } from "@prisma/client";

/** Per-dealer FTP inventory feed: pull a CSV feed and upsert inventory (match by
 *  VIN/stock, update existing, add new). Runs on demand or on a daily cron. */

export type FeedConfig = {
  enabled?: boolean;
  protocol?: "ftp" | "ftps";
  host?: string;
  port?: number;
  username?: string;
  password?: string;
  path?: string; // path to the CSV feed file on the server
  lastRunAt?: string;
  lastResult?: string;
};

/* ── CSV parse + column mapping (server-side twin of the manual importer) ── */
type Target = { key: string; aliases: string[]; spec?: boolean };
const TARGETS: Target[] = [
  { key: "vin", aliases: ["vin"] },
  { key: "stockNumber", aliases: ["stock", "stockno", "stocknumber", "stock#", "stocknum"] },
  { key: "year", aliases: ["year", "yr"] },
  { key: "make", aliases: ["make", "manufacturer", "brand"] },
  { key: "model", aliases: ["model"] },
  { key: "trim", aliases: ["trim", "series", "styledescription"] },
  { key: "category", aliases: ["category", "class", "unittype", "vehicletype"] },
  { key: "mileage", aliases: ["mileage", "miles", "odometer", "odo"] },
  { key: "price", aliases: ["price", "internetprice", "askingprice", "listprice", "sellingprice", "retail"] },
  { key: "cost", aliases: ["cost", "unitcost", "invoice", "bookvalue"] },
  { key: "status", aliases: ["status", "lotstatus"] },
  { key: "bodyStyle", aliases: ["body", "bodystyle", "bodytype"], spec: true },
  { key: "exteriorColor", aliases: ["color", "exteriorcolor", "extcolor", "exterior"] },
  { key: "interiorColor", aliases: ["interior", "interiorcolor", "intcolor"], spec: true },
  { key: "drivetrain", aliases: ["drivetrain", "drive", "drivetype", "drivenwheels"], spec: true },
  { key: "fuelType", aliases: ["fuel", "fueltype"], spec: true },
  { key: "transmission", aliases: ["transmission", "trans"], spec: true },
  { key: "engine", aliases: ["engine", "enginedescription"], spec: true },
];
const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
const catOf = (v: string) => { const s = v.toLowerCase(); if (/motor?cycle|bike/.test(s)) return "MOTORCYCLE"; if (/atv|utv|powersport|side.?by/.test(s)) return "POWERSPORT"; if (/rv|camper|motorhome|travel.?trailer|fifth.?wheel/.test(s)) return "RV"; if (/trailer/.test(s)) return "TRAILER"; return "CAR"; };
const statusOf = (v: string) => { const s = v.toLowerCase(); if (/recon/.test(s)) return "RECON"; if (/reserv|pend/.test(s)) return "RESERVED"; if (/wholesale/.test(s)) return "WHOLESALE"; if (/sold/.test(s)) return "SOLD"; return "AVAILABLE"; };
const cents = (v: string) => { const n = parseFloat(v.replace(/[^0-9.]/g, "")); return isFinite(n) ? Math.round(n * 100) : 0; };
const digits = (v: string) => { const n = parseInt(v.replace(/[^0-9]/g, ""), 10); return isFinite(n) ? n : undefined; };

function parseCsv(text: string): string[][] {
  const rows: string[][] = []; let row: string[] = []; let cur = ""; let q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) { if (c === '"') { if (text[i + 1] === '"') { cur += '"'; i++; } else q = false; } else cur += c; }
    else if (c === '"') q = true;
    else if (c === ",") { row.push(cur); cur = ""; }
    else if (c === "\n") { row.push(cur); rows.push(row); row = []; cur = ""; }
    else if (c !== "\r") cur += c;
  }
  if (cur !== "" || row.length) { row.push(cur); rows.push(row); }
  return rows.filter((r) => r.some((x) => x.trim() !== ""));
}

export type FeedItem = { vin?: string; stockNumber?: string; year?: number; make?: string; model?: string; trim?: string; category?: string; mileage?: number; priceCents?: number; costCents?: number; status?: string; bodyType?: string; exteriorColor?: string; attributes?: Record<string, string> };

export function feedItemsFromCsv(text: string): FeedItem[] {
  const grid = parseCsv(text);
  if (grid.length < 2) return [];
  const headers = grid[0].map((h) => h.trim());
  const map: Record<number, Target> = {};
  headers.forEach((h, i) => { const t = TARGETS.find((t) => t.aliases.includes(norm(h))); if (t) map[i] = t; });
  return grid.slice(1).map((r) => {
    const item: FeedItem = {}; const attributes: Record<string, string> = {};
    headers.forEach((_, i) => {
      const t = map[i]; const val = (r[i] ?? "").trim(); if (!t || !val) return;
      if (t.spec) attributes[t.key] = val;
      else if (t.key === "year") item.year = digits(val);
      else if (t.key === "mileage") item.mileage = digits(val);
      else if (t.key === "price") item.priceCents = cents(val);
      else if (t.key === "cost") item.costCents = cents(val);
      else if (t.key === "category") item.category = catOf(val);
      else if (t.key === "status") item.status = statusOf(val);
      else (item as Record<string, unknown>)[t.key] = val;
    });
    if (attributes.bodyStyle) item.bodyType = attributes.bodyStyle;
    if (Object.keys(attributes).length) item.attributes = attributes;
    return item;
  });
}

/* ── upsert: match a feed row to existing inventory by VIN then stock ── */
export async function applyFeed(dealershipId: string, items: FeedItem[]): Promise<{ created: number; updated: number; skipped: number }> {
  let created = 0, updated = 0, skipped = 0;
  for (const it of items) {
    if (!it.make || !it.model) { skipped++; continue; }
    const vin = it.vin ? it.vin.toUpperCase() : null;
    const existing = await prisma.vehicle.findFirst({
      where: { dealershipId, OR: [...(vin ? [{ vin }] : []), ...(it.stockNumber ? [{ stockNumber: it.stockNumber }] : [])] },
      select: { id: true },
    });
    const common = {
      year: it.year ?? null, make: it.make, model: it.model, trim: it.trim ?? null, category: it.category ?? "CAR",
      bodyType: it.bodyType ?? null, mileage: it.mileage ?? 0, priceCents: it.priceCents ?? 0,
      ...(it.costCents ? { costCents: it.costCents } : {}), exteriorColor: it.exteriorColor ?? null,
      status: (it.status ?? "AVAILABLE") as "AVAILABLE" | "RECON" | "RESERVED" | "WHOLESALE" | "SOLD",
      ...(it.attributes ? { attributes: it.attributes as unknown as Prisma.InputJsonValue } : {}),
    };
    if (existing) { await prisma.vehicle.update({ where: { id: existing.id }, data: common }); updated++; }
    else {
      await prisma.vehicle.create({ data: { dealershipId, vin, stockNumber: it.stockNumber?.trim() || `FEED-${Date.now().toString(36)}-${created}`, ...common, listedAt: common.status === "AVAILABLE" ? new Date() : null } });
      created++;
    }
  }
  return { created, updated, skipped };
}

/* ── FTP download ── */
export async function downloadFeed(cfg: FeedConfig): Promise<string> {
  const { Client } = await import("basic-ftp");
  const client = new Client(20000);
  const chunks: Buffer[] = [];
  const sink = new Writable({ write(chunk, _enc, cb) { chunks.push(Buffer.from(chunk)); cb(); } });
  try {
    await client.access({ host: cfg.host, port: cfg.port || 21, user: cfg.username, password: cfg.password, secure: cfg.protocol === "ftps" });
    await client.downloadTo(sink, cfg.path || "");
    return Buffer.concat(chunks).toString("utf8");
  } finally {
    client.close();
  }
}

/** Full run: download → parse → upsert. Records lastRunAt/lastResult on the dealer. */
export async function runFeedSync(dealershipId: string): Promise<{ created: number; updated: number; skipped: number }> {
  const d = await prisma.dealership.findUnique({ where: { id: dealershipId }, select: { feedConfig: true } });
  const cfg = (d?.feedConfig ?? {}) as FeedConfig;
  if (!cfg.host || !cfg.path) throw new Error("Feed is not configured");
  const text = await downloadFeed(cfg);
  const items = feedItemsFromCsv(text);
  const result = await applyFeed(dealershipId, items);
  await prisma.dealership.update({
    where: { id: dealershipId },
    data: { feedConfig: { ...cfg, lastRunAt: new Date().toISOString(), lastResult: `${result.created} added, ${result.updated} updated, ${result.skipped} skipped` } as unknown as Prisma.InputJsonValue },
  });
  return result;
}
