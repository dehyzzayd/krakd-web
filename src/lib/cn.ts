/** Minimal className joiner — no dependency, tree-shakeable. */
export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}
