"use client";

import { AnalyticsEvent } from "./helpers";

const MILESTONES = [
  { depth: "25%",  label: "First Quarter" },
  { depth: "50%",  label: "Halfway" },
  { depth: "75%",  label: "Three Quarters" },
  { depth: "100%", label: "Full Page" },
] as const;

export function ScrollDepthCard({ events }: { events: AnalyticsEvent[] }) {
  const depthEvents = events.filter((e) => e.type === "scroll_depth");
  const counts: Record<string, number> = {};
  for (const e of depthEvents) {
    const d = e.payload?.depth;
    if (d) counts[d] = (counts[d] ?? 0) + 1;
  }

  const base    = counts["25%"] ?? 0;
  const hasData = depthEvents.length > 0;

  return (
    <div className="border border-neutral-200 bg-white">
      {/* Header — stacks on narrow, row on wider */}
      <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-neutral-100 px-5 py-4">
        <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-400">
          Browse Page Scroll Depth
        </h2>
        <span className="text-[10px] uppercase tracking-[0.14em] text-neutral-400">
          Unique milestone hits
        </span>
      </div>

      {!hasData ? (
        <p className="px-5 py-10 text-center text-[11px] uppercase tracking-widest text-neutral-400">
          No scroll data yet — visit the browse page to generate events.
        </p>
      ) : (
        /* auto-fit columns: 2 on mobile, 4 on wider */
        <div
          style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))" }}
        >
          {MILESTONES.map(({ depth, label }, i) => {
            const count  = counts[depth] ?? 0;
            const prev   = i === 0 ? base : (counts[MILESTONES[i - 1].depth] ?? 0);
            const retPct = prev > 0 ? Math.round((count / prev) * 100) : 0;
            const barPct = base > 0 ? Math.round((count / base) * 100) : 0;

            return (
              <div
                key={depth}
                className="flex flex-col gap-3 px-5 py-4"
                style={{ borderRight: "1px solid #f5f5f5", borderBottom: "1px solid #f5f5f5" }}
              >
                {/* Label + count */}
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-neutral-400">
                      {label}
                    </p>
                    <p
                      className="mt-1 text-3xl font-light text-black"
                      style={{ fontFamily: "var(--font-serif, serif)" }}
                    >
                      {count}
                    </p>
                  </div>
                  <span className="mt-1 flex-shrink-0 rounded-sm bg-neutral-100 px-1.5 py-0.5 text-[10px] font-bold text-neutral-500">
                    {depth}
                  </span>
                </div>

                {/* Retention */}
                {i > 0 ? (
                  <p className="text-[10px] font-semibold text-neutral-400">
                    {retPct}%{" "}
                    <span className="font-normal text-neutral-300">retained from prev</span>
                  </p>
                ) : (
                  <p className="text-[10px] font-semibold text-neutral-400">Baseline</p>
                )}

                {/* Bar */}
                <div className="relative h-[2px] w-full bg-neutral-100">
                  <div
                    className="absolute left-0 top-0 h-full bg-black transition-all duration-700"
                    style={{ width: `${barPct}%` }}
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
