"use client";

import { useEffect, useRef, useState } from "react";
import { AnalyticsEvent, countBy, CARD_CLS } from "./helpers";

export function MostViewedItems({ events }: { events: AnalyticsEvent[] }) {
  const clicks = events.filter((e) => e.type === "item_clicked");
  const hovers = events.filter((e) => e.type === "item_hovered");

  const ranked = countBy(clicks, (e) => e.payload?.itemName).slice(0, 10);

  // Build hover counts keyed by itemName
  const hoverCounts = Object.fromEntries(
    countBy(hovers, (e) => e.payload?.itemName).map(({ key, count }) => [key, count])
  );

  const [mounted, setMounted] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setMounted(true); observer.disconnect(); } },
      { threshold: 0.1 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  const max = ranked[0]?.count ?? 1;

  return (
    <div className={`${CARD_CLS} flex flex-col p-5 lg:h-[650px]`} ref={ref}>
      <h2 className="mb-4 text-xs font-semibold uppercase tracking-[0.12em] text-neutral-400">
        Most Clicked Items
      </h2>

      {ranked.length === 0 ? (
        <p className="py-8 text-center text-sm text-neutral-400">No data yet</p>
      ) : (
        <ol className="space-y-3">
          {ranked.map(({ key, count }, i) => {
            const pct = (count / max) * 100;
            const catEntry = events.find(
              (e) => e.type === "item_clicked" && e.payload?.itemName === key
            );
            const category = catEntry?.payload?.category ?? "";
            const hoverCount = hoverCounts[key] ?? 0;

            return (
              <li key={key}>
                <div className="flex items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-2.5">
                    <span className="w-5 flex-shrink-0 text-right text-[11px] font-semibold text-neutral-300">
                      {i + 1}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-neutral-800">{key}</p>
                      <p className="text-[11px] text-neutral-400">
                        {category && <span>{category} · </span>}
                        {hoverCount > 0 && (
                          <span>{hoverCount} hover{hoverCount !== 1 ? "s" : ""} · </span>
                        )}
                        <span>{count} click{count !== 1 ? "s" : ""}</span>
                      </p>
                    </div>
                  </div>
                  <span className="flex-shrink-0 text-sm font-bold text-neutral-700">
                    {count}
                  </span>
                </div>
                <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-neutral-100">
                  <div
                    className="h-full rounded-full bg-blue-400 transition-all duration-[600ms] ease-out"
                    style={{ width: mounted ? `${pct}%` : "0%" }}
                  />
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
