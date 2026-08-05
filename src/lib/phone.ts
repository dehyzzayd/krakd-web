/** Format any phone input as North American (US/Canada): (XXX) XXX-XXXX.
 *  Drops a leading country-code 1, ignores non-digits, formats progressively as typed. */
export function formatUSPhone(v: string): string {
  let d = (v ?? "").replace(/\D/g, "");
  if (d.length === 11 && d[0] === "1") d = d.slice(1);
  d = d.slice(0, 10);
  const a = d.slice(0, 3), b = d.slice(3, 6), c = d.slice(6, 10);
  if (d.length > 6) return `(${a}) ${b}-${c}`;
  if (d.length > 3) return `(${a}) ${b}`;
  if (d.length > 0) return `(${a}`;
  return "";
}
