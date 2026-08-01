/** Cloudflare R2 object storage (S3-compatible).
 *  Configured entirely via env — if the keys aren't present, `isR2Configured()`
 *  returns false and callers fall back to the inline (data-URL) path.
 *
 *  Required env (put in .env.local, NEVER commit):
 *    R2_ACCOUNT_ID          Cloudflare account id
 *    R2_ACCESS_KEY_ID       R2 S3 API access key id  (R2 → Manage R2 API Tokens)
 *    R2_SECRET_ACCESS_KEY   R2 S3 API secret
 *    R2_BUCKET              bucket name
 *    R2_PUBLIC_BASE_URL     public base url for the bucket (r2.dev or custom domain)
 */

import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const { R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET, R2_PUBLIC_BASE_URL } = process.env;

export const isR2Configured = () =>
  !!(R2_ACCOUNT_ID && R2_ACCESS_KEY_ID && R2_SECRET_ACCESS_KEY && R2_BUCKET && R2_PUBLIC_BASE_URL);

let client: S3Client | null = null;
function s3(): S3Client {
  if (!client) {
    client = new S3Client({
      region: "auto",
      endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: { accessKeyId: R2_ACCESS_KEY_ID!, secretAccessKey: R2_SECRET_ACCESS_KEY! },
    });
  }
  return client;
}

export function publicUrlFor(key: string): string {
  return `${R2_PUBLIC_BASE_URL!.replace(/\/$/, "")}/${key}`;
}

export async function putObject(key: string, body: Uint8Array, contentType: string): Promise<string> {
  await s3().send(new PutObjectCommand({
    Bucket: R2_BUCKET!,
    Key: key,
    Body: body,
    ContentType: contentType,
    CacheControl: "public, max-age=31536000, immutable",
  }));
  return publicUrlFor(key);
}
