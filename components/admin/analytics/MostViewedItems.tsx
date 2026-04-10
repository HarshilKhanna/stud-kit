"use client";

import Link from "next/link";
import { AnalyticsEvent, countBy } from "./helpers";

export function MostViewedItems({ events }: { events: AnalyticsEvent[] }) {
  const clicks  = events.filter((e) => e.type === "item_clicked");
  const hovers  = events.filter((e) => e.type === "item_hovered");
  const ranked  = countBy(clicks, (e) => e.payload?.itemName).slice(0, 8);
  const hoverMap = Object.fromEntries(
    countBy(hovers, (e) => e.payload?.itemName).map(({ key, count }) => [key, count]),
  );

  return (
    <div className="flex flex-col border border-neutral-200 bg-white p-6 md:p-8 lg:h-[520px]">
      <h2 className="mb-5 flex-shrink-0 text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-400">
        Most Clicked Items
      </h2>

      {ranked.length === 0 ? (
        <p className="py-12 text-center text-[11px] uppercase tracking-widest text-neutral-500">
          No data yet
        </p>
      ) : (
        <>
          <ol className="flex-1 divide-y divide-neutral-50">
            {ranked.map(({ key, count }, i) => {
              const hover = hoverMap[key] ?? 0;
              return (
                <li key={key} className="flex items-center justify-between gap-4 py-3.5">
                  <div className="flex items-center gap-4 min-w-0">
                    <span className="w-6 flex-shrink-0 text-right text-[10px] font-bold text-neutral-400">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-[11px] font-bold uppercase tracking-[0.1em] text-black">
                        {key}
                      </p>
                      <p className="text-[10px] uppercase tracking-widest text-neutral-400">
                        {hover > 0 ? `${hover} hovers · ` : ""}{count} clicks
                      </p>
                    </div>
                  </div>
                  <span className="flex-shrink-0 text-base text-neutral-400 transition-colors hover:text-black">
                    ↗
                  </span>
                </li>
              );
            })}
          </ol>

          <Link
            href="/admin/items"
            className="mt-4 flex-shrink-0 block w-full bg-black py-3 text-center text-[10px] font-bold uppercase tracking-[0.18em] text-white transition-colors hover:bg-neutral-800"
          >
            View Complete Inventory
          </Link>
        </>
      )}
    </div>
  );
}
