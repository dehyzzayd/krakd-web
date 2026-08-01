import { NextRequest } from "next/server";
import { randomUUID } from "crypto";
import { requireAuth } from "@/lib/server/auth";
import { json, route, HttpError } from "@/lib/server/http";
import { isR2Configured, putObject } from "@/lib/server/r2";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const EXT: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };
const MAX_BYTES = 6_000_000; // images are compressed client-side; this is a safety cap

/* POST /api/v1/uploads (multipart: file) → stores the image in R2, returns { url }.
   Falls back with 501 when R2 isn't configured so the client can use inline storage. */
export const POST = route(async (req: NextRequest) => {
  const { dealershipId } = await requireAuth(req);
  if (!isR2Configured()) throw new HttpError(501, "Object storage is not configured");

  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) throw new HttpError(400, "No file provided");
  const ext = EXT[file.type];
  if (!ext) throw new HttpError(400, "Unsupported image type");
  if (file.size > MAX_BYTES) throw new HttpError(413, "Image is too large");

  const bytes = new Uint8Array(await file.arrayBuffer());
  const key = `dealers/${dealershipId}/${randomUUID()}.${ext}`;
  const url = await putObject(key, bytes, file.type);
  return json({ url }, 201);
});
