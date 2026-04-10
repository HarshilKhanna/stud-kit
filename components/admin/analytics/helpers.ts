import type { AnalyticsEvent } from "@/lib/analytics";

export type { AnalyticsEvent };

/** "2 minutes ago", "3 hours ago", etc. — no external lib */
export function timeAgo(ts: AnalyticsEvent["timestamp"]): string {
  if (!ts) return "just now";
  const seconds = Math.floor(Date.now() / 1000 - ts.seconds);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

/** Format a date as "Mar 13" */
export function fmtDate(date: Date): string {
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

/** Count occurrences of a string field across events, return sorted desc */
export function countBy(
  events: AnalyticsEvent[],
  fn: (e: AnalyticsEvent) => string | undefined
): { key: string; count: number }[] {
  const map: Record<string, number> = {};
  for (const e of events) {
    const k = fn(e);
    if (k) map[k] = (map[k] ?? 0) + 1;
  }
  return Object.entries(map)
    .map(([key, count]) => ({ key, count }))
    .sort((a, b) => b.count - a.count);
}

/** Is a timestamp from today? */
export function isToday(ts: AnalyticsEvent["timestamp"]): boolean {
  if (!ts) return false;
  const d = new Date(ts.seconds * 1000);
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
}

const CARD_CLS =
  "border border-neutral-200 bg-white";
export { CARD_CLS };
