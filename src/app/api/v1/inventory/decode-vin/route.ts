import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/server/auth";
import { json, route, HttpError } from "@/lib/server/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const title = (s: string) => s.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());

/* GET /api/v1/inventory/decode-vin?vin=... → real VIN decode via NHTSA vPIC (free, no key). */
export const GET = route(async (req: NextRequest) => {
  await requireAuth(req);
  const vin = (req.nextUrl.searchParams.get("vin") || "").trim().toUpperCase();
  if (!/^[A-HJ-NPR-Z0-9]{11,17}$/.test(vin)) throw new HttpError(400, "Enter a valid VIN (11–17 characters).");

  const res = await fetch(`https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVinValues/${encodeURIComponent(vin)}?format=json`, {
    headers: { accept: "application/json" },
  }).catch(() => null);
  if (!res || !res.ok) throw new HttpError(502, "VIN service is unavailable right now — enter details manually.");

  const data = await res.json().catch(() => null);
  const r = data?.Results?.[0] as Record<string, string> | undefined;
  if (!r || !r.Make) throw new HttpError(422, "Couldn't decode that VIN. Check it or enter details manually.");

  return json({
    year: r.ModelYear || "",
    make: r.Make ? title(r.Make) : "",
    model: r.Model ? title(r.Model) : "",
    trim: r.Trim || r.Series || "",
    bodyStyle: r.BodyClass || "",
    fuelType: r.FuelTypePrimary || "",
    drivetrain: r.DriveType || "",
    transmission: r.TransmissionStyle || "",
  });
});
