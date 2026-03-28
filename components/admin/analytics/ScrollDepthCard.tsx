"use client";

import { AnalyticsEvent, CARD_CLS } from "./helpers";

const DEPTHS = ["25%", "50%", "75%", "100%"] as const;

export function ScrollDepthCard({ events }: { events: AnalyticsEvent[] }) {
  const depthEvents = events.filter((e) => e.type === "scroll_depth");

  // Count unique sessions that reached each depth.
  // Since we don't have session IDs, we use raw event counts as a proxy.
  // Each depth fires at most once per page load, so count = # of page loads that reached it.
  const counts: Record<string, number> = {};
  for (const e of depthEvents) {
    const d = e.payload?.depth;
    if (d) counts[d] = (counts[d] ?? 0) + 1;
  }

  // Total "sessions" approximated by max depth count (25% should always be highest)
  const total = Math.max(counts["25%"] ?? 0, 1);

  return (
    <div className={`${CARD_CLS} p-5`}>
      <h2 className="mb-4 text-xs font-semibold uppercase tracking-[0.12em] text-neutral-400">
        Scroll Depth
      </h2>

      {total === 0 || depthEvents.length === 0 ? (
        <p className="py-4 text-center text-sm text-neutral-400">No data yet</p>
      ) : (
        <div className="space-y-3">
          {DEPTHS.map((depth) => {
            const count = counts[depth] ?? 0;
            const pct = Math.round((count / total) * 100);
            const reached = count > 0;
            return (
              <div key={depth}>
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-xs font-medium text-neutral-600">{depth}</span>
                  <span className="text-xs text-neutral-400">
                    {count} {count === 1 ? "session" : "sessions"} · {pct}%
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-neutral-100">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ease-out ${
                      reached ? "bg-violet-400" : "bg-neutral-200"
                    }`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
