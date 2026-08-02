"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";
import { Sheet } from "./Sheet";
import { apiFetch, ApiError } from "@/lib/api";
import { UploadCloud, FileSpreadsheet, Check, AlertTriangle, Download } from "lucide-react";

// mapping targets — core fields go top-level, spec fields go into attributes
type Target = { key: string; label: string; aliases: string[]; spec?: boolean };
const TARGETS: Target[] = [
  { key: "vin", label: "VIN", aliases: ["vin"] },
  { key: "stockNumber", label: "Stock #", aliases: ["stock", "stockno", "stocknumber", "stock#", "stocknum"] },
  { key: "year", label: "Year", aliases: ["year", "yr"] },
  { key: "make", label: "Make", aliases: ["make", "manufacturer", "brand"] },
  { key: "model", label: "Model", aliases: ["model"] },
  { key: "trim", label: "Trim", aliases: ["trim", "series", "styledescription"] },
  { key: "category", label: "Category", aliases: ["category", "class", "unittype", "vehicletype"] },
  { key: "mileage", label: "Mileage", aliases: ["mileage", "miles", "odometer", "odo"] },
  { key: "price", label: "Price", aliases: ["price", "internetprice", "askingprice", "listprice", "sellingprice", "retail"] },
  { key: "cost", label: "Cost", aliases: ["cost", "unitcost", "invoice", "bookvalue"] },
  { key: "status", label: "Status", aliases: ["status", "lotstatus"] },
  { key: "bodyStyle", label: "Body style", aliases: ["body", "bodystyle", "bodytype"], spec: true },
  { key: "exteriorColor", label: "Exterior color", aliases: ["color", "exteriorcolor", "extcolor", "exterior"] },
  { key: "interiorColor", label: "Interior color", aliases: ["interior", "interiorcolor", "intcolor"], spec: true },
  { key: "drivetrain", label: "Drivetrain", aliases: ["drivetrain", "drive", "drivetype", "drivenwheels"], spec: true },
  { key: "fuelType", label: "Fuel type", aliases: ["fuel", "fueltype"], spec: true },
  { key: "transmission", label: "Transmission", aliases: ["transmission", "trans"], spec: true },
  { key: "engine", label: "Engine", aliases: ["engine", "enginedescription"], spec: true },
  { key: "condition", label: "Condition", aliases: ["condition", "newused", "type"], spec: true },
];
const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
const CAT: [RegExp, string][] = [[/motor?cycle|bike/, "MOTORCYCLE"], [/atv|utv|powersport|side.?by/, "POWERSPORT"], [/rv|camper|motorhome|travel.?trailer|fifth.?wheel/, "RV"], [/trailer/, "TRAILER"]];
const catOf = (v: string) => CAT.find(([re]) => re.test(v.toLowerCase()))?.[1] ?? "CAR";
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

const TEMPLATE = "VIN,Stock #,Year,Make,Model,Trim,Category,Mileage,Price,Cost,Body style,Exterior color,Fuel type,Drivetrain,Transmission,Status\n1FTFW1E85MFA00001,K-1001,2021,Ford,F-150,XLT,Car,32000,42995,37000,Pickup Truck,Oxford White,Gasoline,4WD,Automatic,Available\n,M-2002,2023,Harley-Davidson,Street Glide,,Motorcycle,4200,28995,24000,,Vivid Black,,,,Available";

export function BulkImportSheet({ open, onClose, onImported }: { open: boolean; onClose: () => void; onImported: () => void }) {
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<string[][]>([]);
  const [map, setMap] = useState<Record<number, string>>({});
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [result, setResult] = useState<{ created: number; failed: { row: number; error: string }[] } | null>(null);

  const reset = () => { setHeaders([]); setRows([]); setMap({}); setResult(null); setErr(null); };
  const close = () => { reset(); onClose(); };

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    setErr(null); setResult(null);
    const grid = parseCsv(await file.text());
    if (grid.length < 2) { setErr("That file has no data rows."); return; }
    const hd = grid[0].map((h) => h.trim());
    const auto: Record<number, string> = {};
    hd.forEach((h, i) => { const t = TARGETS.find((t) => t.aliases.includes(norm(h))); if (t) auto[i] = t.key; });
    setHeaders(hd); setRows(grid.slice(1)); setMap(auto);
  };

  const downloadTemplate = () => { const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([TEMPLATE], { type: "text/csv" })); a.download = "krakd-inventory-template.csv"; a.click(); URL.revokeObjectURL(a.href); };

  const buildItems = () => rows.map((r) => {
    const item: Record<string, unknown> = {}; const attributes: Record<string, unknown> = {};
    headers.forEach((_, i) => {
      const key = map[i]; if (!key) return;
      const val = (r[i] ?? "").trim(); if (!val) return;
      const t = TARGETS.find((t) => t.key === key)!;
      if (t.spec) attributes[key] = val;
      else if (key === "year") item.year = digits(val);
      else if (key === "mileage") item.mileage = digits(val);
      else if (key === "price") item.priceCents = cents(val);
      else if (key === "cost") item.costCents = cents(val);
      else if (key === "category") item.category = catOf(val);
      else if (key === "status") item.status = statusOf(val);
      else item[key] = val;
    });
    if (attributes.bodyStyle) item.bodyType = attributes.bodyStyle;
    if (Object.keys(attributes).length) item.attributes = attributes;
    return item;
  });

  const mappedKeys = new Set(Object.values(map));
  const canImport = mappedKeys.has("make") && mappedKeys.has("model");

  const doImport = async () => {
    setBusy(true); setErr(null);
    try {
      const res = await apiFetch<{ created: number; failed: { row: number; error: string }[] }>("/inventory/bulk", { method: "POST", body: JSON.stringify({ items: buildItems() }) });
      setResult(res);
      if (res.created > 0) onImported();
    } catch (e) { setErr(e instanceof ApiError ? e.message : "Import failed."); }
    finally { setBusy(false); }
  };

  return (
    <Sheet open={open} onClose={close} width="max-w-3xl" title="Import inventory" subtitle="Upload a CSV — map the columns and Krakd creates the units."
      footer={result ? (
        <button onClick={close} className="btn-brand h-9 rounded-md px-4 text-[13px] font-semibold">Done</button>
      ) : headers.length > 0 ? (<>
        <button onClick={reset} className="h-9 rounded-md border border-n200 bg-white px-4 text-[13px] font-medium text-n700 hover:bg-n100">Choose another file</button>
        <button onClick={doImport} disabled={busy || !canImport} className="btn-brand h-9 rounded-md px-4 text-[13px] font-semibold disabled:opacity-50">{busy ? "Importing…" : `Import ${rows.length} row${rows.length === 1 ? "" : "s"}`}</button>
      </>) : undefined}>
      {result ? (
        <div className="space-y-4">
          <div className="flex items-center gap-3 rounded-xl bg-ok-soft p-4"><Check className="h-6 w-6 text-ok" /><div><p className="text-[15px] font-semibold text-n900">{result.created} unit{result.created === 1 ? "" : "s"} imported</p><p className="text-[12.5px] text-n600">They&apos;re in your inventory now.</p></div></div>
          {result.failed.length > 0 && (
            <div className="rounded-xl border border-warn/30 bg-warn-soft/40 p-4">
              <p className="flex items-center gap-2 text-[13px] font-semibold text-warn"><AlertTriangle className="h-4 w-4" />{result.failed.length} row{result.failed.length === 1 ? "" : "s"} skipped</p>
              <ul className="mt-2 max-h-40 space-y-1 overflow-y-auto text-[12px] text-n600">{result.failed.slice(0, 50).map((f) => <li key={f.row}>Row {f.row}: {f.error}</li>)}</ul>
            </div>
          )}
        </div>
      ) : headers.length === 0 ? (
        <div className="space-y-4">
          <label className="grid cursor-pointer place-items-center gap-2 rounded-2xl border-2 border-dashed border-n300 bg-n50/50 py-12 text-center transition hover:bg-n50">
            <UploadCloud className="h-8 w-8 text-n400" />
            <p className="text-[14px] font-semibold text-n800">Drop a CSV or click to choose</p>
            <p className="text-[12px] text-n500">Export from your DMS, feed provider, or a spreadsheet</p>
            <input type="file" accept=".csv,text/csv" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} />
          </label>
          {err && <p className="text-[12.5px] font-medium text-err">{err}</p>}
          <button onClick={downloadTemplate} className="inline-flex items-center gap-2 text-[12.5px] font-semibold text-brand hover:underline"><Download className="h-3.5 w-3.5" />Download a template CSV</button>
          <div className="rounded-xl bg-n50 p-3 text-[12px] leading-relaxed text-n600"><span className="font-semibold text-n800">Tip:</span> your file just needs <span className="font-semibold">Make</span> and <span className="font-semibold">Model</span> columns to import. Everything else — VIN, price, mileage, specs — maps automatically when the column names match.</div>
        </div>
      ) : (
        <div className="space-y-5">
          <div className="flex items-center gap-2 rounded-lg bg-n50 px-3 py-2 text-[12.5px] text-n600"><FileSpreadsheet className="h-4 w-4 text-n400" /><b className="text-n800">{rows.length}</b> rows · <b className="text-n800">{headers.length}</b> columns detected</div>

          <div>
            <p className="mb-2 text-[12px] font-semibold uppercase tracking-wide text-n500">Map your columns</p>
            <div className="max-h-64 space-y-1.5 overflow-y-auto pr-1">
              {headers.map((h, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="w-40 shrink-0 truncate text-[12.5px] font-medium text-n800" title={h}>{h || <span className="text-n400">(unnamed)</span>}</span>
                  <span className="max-w-[120px] flex-1 truncate text-[11.5px] text-n400">{rows[0]?.[i] || "—"}</span>
                  <select value={map[i] ?? ""} onChange={(e) => setMap((m) => ({ ...m, [i]: e.target.value }))} className="h-8 w-44 shrink-0 rounded-md border border-n200 bg-white px-2 text-[12px] text-n900 outline-none focus:border-brand">
                    <option value="">— Skip —</option>
                    {TARGETS.map((t) => <option key={t.key} value={t.key}>{t.label}</option>)}
                  </select>
                </div>
              ))}
            </div>
          </div>

          {!canImport && <p className="flex items-center gap-1.5 text-[12px] font-medium text-warn"><AlertTriangle className="h-3.5 w-3.5" />Map a <b>Make</b> and a <b>Model</b> column to import.</p>}

          <div>
            <p className="mb-2 text-[12px] font-semibold uppercase tracking-wide text-n500">Preview · first 5</p>
            <div className="overflow-x-auto rounded-lg border border-n200">
              <table className="w-full text-[12px]">
                <thead className="bg-n50 text-[10.5px] font-bold uppercase tracking-wide text-n500"><tr>{["Year", "Make", "Model", "Trim", "Category", "Price"].map((c) => <th key={c} className="px-2.5 py-1.5 text-left">{c}</th>)}</tr></thead>
                <tbody>
                  {buildItems().slice(0, 5).map((it, i) => (
                    <tr key={i} className="border-t border-n100">
                      <td className="tnum px-2.5 py-1.5">{String((it.year as number) ?? "—")}</td>
                      <td className="px-2.5 py-1.5">{String(it.make ?? "—")}</td>
                      <td className="px-2.5 py-1.5">{String(it.model ?? "—")}</td>
                      <td className="px-2.5 py-1.5 text-n500">{String(it.trim ?? "—")}</td>
                      <td className="px-2.5 py-1.5 text-n500">{String(it.category ?? "CAR")}</td>
                      <td className="tnum px-2.5 py-1.5">{it.priceCents ? `$${Math.round((it.priceCents as number) / 100).toLocaleString()}` : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          {err && <p className="text-[12.5px] font-medium text-err">{err}</p>}
        </div>
      )}
    </Sheet>
  );
}
