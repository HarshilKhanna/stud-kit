import type { Item } from "@/types";

/** Ensures a valid http(s) buy link (legacy rows / localStorage may omit or invalidate). */
export function coerceExternalUrl(name: string, raw?: string | null): string {
  const t = raw?.trim();
  if (t && /^https?:\/\//i.test(t)) return t;
  return `https://www.amazon.com/s?k=${encodeURIComponent(name || "student essentials")}`;
}

/** Buy link for catalogue cards. */
export function getItemBuyUrl(item: Item): string {
  return item.externalUrl.trim();
}
