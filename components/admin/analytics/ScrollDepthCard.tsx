"use client";

import { AnalyticsEvent } from "./helpers";

const DEPTHS = ["25%", "50%", "75%", "100%"] as const;

export function ScrollDepthCard({ events }: { events: AnalyticsEvent[] }) {
  const depthEvents = events.filter((e) => e.type === "scroll_depth");
  const counts: Record<string, number> = {};
  for (const e of depthEvents) {
    const d = e.payload?.depth;
    if (d) counts[d] = (counts[d] ?? 0) + 1;
  }
  const total = Math.max(counts["25%"] ?? 0, 1);
  const hasData = depthEvents.length > 0;

  return (
    <div className="border border-neutral-200 bg-white p-6 md:p-8">
      <div className="mb-6 flex items-baseline justify-between">
        <h2
          className="text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-400"
        >
          Scroll Depth
        </h2>
        <span className="text-[10px] uppercase tracking-[0.14em] text-neutral-500">
          Engagement by scroll milestone
        </span>
      </div>

      {!hasData ? (
        <p className="py-12 text-center text-[11px] uppercase tracking-widest text-neutral-500">
          No data yet
        </p>
      ) : (
        <>
          {/* Vertical bar chart */}
          <div className="flex items-end justify-around gap-4 border-b border-neutral-100 pb-4" style={{ height: 140 }}>
            {DEPTHS.map((depth) => {
              const count = counts[depth] ?? 0;
              const pct   = Math.round((count / total) * 100);
              return (
                <div key={depth} className="flex flex-1 flex-col items-center gap-2">
                  <span className="text-xs font-bold text-neutral-600">{pct}%</span>
                  <div
                    className="w-full bg-black transition-all duration-700"
                    style={{ height: `${Math.max(pct, 2)}%`, maxHeight: 90 }}
                  />
                </div>
              );
            })}
          </div>

          {/* Labels */}
          <div className="flex justify-around pt-3">
            {DEPTHS.map((depth) => {
              const count = counts[depth] ?? 0;
              return (
                <div key={depth} className="flex flex-1 flex-col items-center gap-0.5">
                  <span className="text-[9px] font-bold uppercase tracking-[0.14em] text-neutral-400">
                    {depth} Depth
                  </span>
                  <span className="text-[9px] uppercase tracking-widest text-neutral-500">
                    {count} sessions
                  </span>
                </div>
              );
            })}
          </div>

          {/* Insight */}
          {(counts["75%"] ?? 0) < (counts["25%"] ?? 0) * 0.6 && (
            <p className="mt-5 border-t border-neutral-100 pt-4 text-xs text-neutral-400">
              Engagement drops significantly after the 50% mark. Consider moving
              critical call-to-actions higher in the page to increase conversion.
            </p>
          )}
        </>
      )}
    </div>
  );
}
