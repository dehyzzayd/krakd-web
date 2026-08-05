import crypto from "crypto";

/* At-rest encryption for sensitive JSON (credit-app applicant data incl. SSN).
 * AES-256-GCM with a key from ENCRYPTION_KEY (32-byte, hex or base64). Env-gated:
 * with a key set, sensitive JSON is stored as an "enc:v1:<blob>" string; without
 * one (dev), it's stored as-is. Reads transparently decrypt either form. */

const PREFIX = "enc:v1:";

function key(): Buffer | null {
  const raw = process.env.ENCRYPTION_KEY;
  if (!raw) return null;
  const buf = raw.length === 64 ? Buffer.from(raw, "hex") : Buffer.from(raw, "base64");
  return buf.length === 32 ? buf : null;
}

export const encryptionConfigured = () => key() !== null;

/** Seal a JSON-serializable value for storage. Returns an encrypted string when a
 *  key is configured, otherwise the original value (so dev keeps working). */
export function sealJson(value: unknown): unknown {
  const k = key();
  if (!k || value == null) return value;
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", k, iv);
  const pt = Buffer.from(JSON.stringify(value), "utf8");
  const ct = Buffer.concat([cipher.update(pt), cipher.final()]);
  const tag = cipher.getAuthTag();
  return PREFIX + Buffer.concat([iv, tag, ct]).toString("base64");
}

/** Open a value that may be a sealed string or a plain object. */
export function openJson<T = unknown>(value: unknown): T {
  if (typeof value !== "string" || !value.startsWith(PREFIX)) return value as T;
  const k = key();
  if (!k) return value as T; // encrypted but no key present — can't open
  try {
    const raw = Buffer.from(value.slice(PREFIX.length), "base64");
    const iv = raw.subarray(0, 12), tag = raw.subarray(12, 28), ct = raw.subarray(28);
    const decipher = crypto.createDecipheriv("aes-256-gcm", k, iv);
    decipher.setAuthTag(tag);
    const pt = Buffer.concat([decipher.update(ct), decipher.final()]);
    return JSON.parse(pt.toString("utf8")) as T;
  } catch {
    return value as T;
  }
}
