/* One-time backfill: move inline base64 (data:) photos into Cloudflare R2 and
 * rewrite each vehicle's photoUrls to the public URLs. Idempotent — http(s)
 * URLs are left as-is, so it's safe to re-run. */
const { PrismaClient } = require("@prisma/client");
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const { randomUUID } = require("crypto");

const p = new PrismaClient();
const { R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET, R2_PUBLIC_BASE_URL } = process.env;
const EXT = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/gif": "gif", "image/svg+xml": "svg" };

if (!(R2_ACCOUNT_ID && R2_ACCESS_KEY_ID && R2_SECRET_ACCESS_KEY && R2_BUCKET && R2_PUBLIC_BASE_URL)) {
  console.error("✗ R2 env not set — export the R2_* vars (from .env.local) before running.");
  process.exit(1);
}
const s3 = new S3Client({ region: "auto", endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`, credentials: { accessKeyId: R2_ACCESS_KEY_ID, secretAccessKey: R2_SECRET_ACCESS_KEY } });
const base = R2_PUBLIC_BASE_URL.replace(/\/$/, "");

async function putDataUrl(dealershipId, dataUrl) {
  const m = /^data:([^;]+);base64,(.*)$/s.exec(dataUrl);
  if (!m) return null;
  const contentType = m[1];
  const ext = EXT[contentType] || "bin";
  const body = Buffer.from(m[2], "base64");
  const key = `dealers/${dealershipId}/${randomUUID()}.${ext}`;
  await s3.send(new PutObjectCommand({ Bucket: R2_BUCKET, Key: key, Body: body, ContentType: contentType, CacheControl: "public, max-age=31536000, immutable" }));
  return { url: `${base}/${key}`, bytes: body.length };
}

(async () => {
  const vehicles = await p.vehicle.findMany({ select: { id: true, dealershipId: true, photoUrls: true } });
  let scanned = 0, migrated = 0, bytes = 0, updatedRows = 0;
  for (const v of vehicles) {
    const urls = Array.isArray(v.photoUrls) ? v.photoUrls : [];
    if (!urls.some((u) => typeof u === "string" && u.startsWith("data:"))) continue;
    scanned++;
    const next = [];
    for (const u of urls) {
      if (typeof u === "string" && u.startsWith("data:")) {
        const r = await putDataUrl(v.dealershipId, u).catch((e) => { console.log(`  ! ${v.id}: ${e.message}`); return null; });
        if (r) { next.push(r.url); migrated++; bytes += r.bytes; } else { next.push(u); }
      } else next.push(u);
    }
    await p.vehicle.update({ where: { id: v.id }, data: { photoUrls: next } });
    updatedRows++;
    console.log(`  · ${v.id} — ${next.length} photo(s), ${urls.filter((u) => typeof u === "string" && u.startsWith("data:")).length} migrated`);
  }
  console.log(`\n✓ Done. ${vehicles.length} vehicles checked · ${scanned} had inline photos · ${migrated} photos moved to R2 · ${updatedRows} rows updated · ~${(bytes / 1024 / 1024).toFixed(1)}MB freed from Postgres`);
  await p.$disconnect();
})().catch((e) => { console.error(e); process.exit(1); });
