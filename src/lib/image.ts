/** Client-side image handling.
 *  Vehicle/listing photos come off phones at 3–8 MB each; storing 24 of those as
 *  base64 would bloat the row to tens of MB. `compressImage` downscales + recompresses
 *  to a capped-size JPEG data URL before upload. (Object storage / signed URLs is the
 *  eventual home for originals; this keeps us sane until then.) */

export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result as string);
    r.onerror = () => rej(new Error("read failed"));
    r.readAsDataURL(file);
  });
}

export async function compressImage(
  file: File,
  { maxDim = 1600, quality = 0.82, maxBytes = 600_000 }: { maxDim?: number; quality?: number; maxBytes?: number } = {},
): Promise<string> {
  // leave non-photographic formats (svg/gif) and non-images untouched
  if (!file.type.startsWith("image/") || file.type === "image/svg+xml" || file.type === "image/gif") return fileToDataUrl(file);
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    return fileToDataUrl(file);
  }
  const scale = Math.min(1, maxDim / Math.max(bitmap.width, bitmap.height));
  const w = Math.max(1, Math.round(bitmap.width * scale));
  const h = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = w; canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) { bitmap.close(); return fileToDataUrl(file); }
  ctx.drawImage(bitmap, 0, 0, w, h);
  bitmap.close();
  // step quality down until the encoded size is under the cap (base64 ≈ 4/3 of bytes)
  let q = quality;
  let url = canvas.toDataURL("image/jpeg", q);
  while (url.length * 0.75 > maxBytes && q > 0.4) { q -= 0.12; url = canvas.toDataURL("image/jpeg", q); }
  return url;
}

const UPLOADABLE = new Set(["image/jpeg", "image/png", "image/webp"]);

/** Same compression, but as a Blob for direct upload. Returns null for formats
 *  we don't push to object storage (svg/gif/etc) so callers fall back to inline. */
export async function compressImageToBlob(file: File, opts?: { maxDim?: number; quality?: number; maxBytes?: number }): Promise<Blob | null> {
  const dataUrl = await compressImage(file, opts);
  const res = await fetch(dataUrl);
  const blob = await res.blob();
  return UPLOADABLE.has(blob.type) ? blob : null;
}
