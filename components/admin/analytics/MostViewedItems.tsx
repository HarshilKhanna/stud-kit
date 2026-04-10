"use client";

import { AnalyticsEvent, countBy } from "./helpers";

export function MostViewedItems({ events }: { events: AnalyticsEvent[] }) {
  const clicks  = events.filter((e) => e.type === "item_clicked");
  const hovers  = events.filter((e) => e.type === "item_hovered");
  const ranked  = countBy(clicks, (e) => e.payload?.itemName).slice(0, 8);
  const hoverMap = Object.fromEntries(
    countBy(hovers, (e) => e.payload?.itemName).map(({ key, count }) => [key, count]),
  );

  return (
    <div className="flex h-[480px] flex-col border border-neutral-200 bg-white p-6 md:p-8">
      <h2 className="mb-5 flex-shrink-0 text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-400">
        Most Clicked Items
      </h2>

      {ranked.length === 0 ? (
        <p className="py-12 text-center text-[11px] uppercase tracking-widest text-neutral-500">
          No data yet
        </p>
      ) : (
        <ol className="flex-1 divide-y divide-neutral-50 overflow-y-auto">
          {ranked.map(({ key, count }, i) => {
            const hover = hoverMap[key] ?? 0;
            return (
              <li key={key} className="flex items-center justify-between gap-4 py-3.5">
                <div className="flex min-w-0 items-center gap-4">
                  <span className="w-6 flex-shrink-0 text-right text-[10px] font-bold text-neutral-300">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-[11px] font-bold uppercase tracking-[0.1em] text-black">
                      {key}
                    </p>
                    <p className="text-[10px] uppercase tracking-widest text-neutral-400">
                      {hover > 0 ? `${hover} hover${hover !== 1 ? "s" : ""} · ` : ""}{count} click{count !== 1 ? "s" : ""}
                    </p>
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
