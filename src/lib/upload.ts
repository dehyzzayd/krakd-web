import { API_URL, getToken } from "@/lib/api";
import { compressImage, compressImageToBlob } from "@/lib/image";

/** Upload an image: store it in R2 (returns a public https URL) when object storage
 *  is configured, otherwise fall back to an inline compressed data URL. Either way
 *  the caller just gets a string to put in photoUrls. */
export async function uploadImage(file: File): Promise<string> {
  try {
    const blob = await compressImageToBlob(file);
    if (blob) {
      const ext = blob.type.split("/")[1] || "jpg";
      const fd = new FormData();
      fd.append("file", blob, `photo.${ext}`);
      const token = getToken();
      const res = await fetch(`${API_URL}/uploads`, {
        method: "POST",
        headers: token ? { authorization: `Bearer ${token}` } : {},
        body: fd,
      });
      if (res.ok) return (await res.json()).url as string;
      // 501 (not configured) or any error → fall through to inline storage
    }
  } catch { /* fall through */ }
  return compressImage(file);
}
