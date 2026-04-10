"use client";

import { AnalyticsEvent, countBy, isToday } from "./helpers";

export function OverviewCards({ events }: { events: AnalyticsEvent[] }) {
  const clicks    = events.filter((e) => e.type === "item_clicked");
  const totalClicks = clicks.length;
  const todayClicks = clicks.filter((e) => isToday(e.timestamp)).length;
  const topItem   = countBy(clicks, (e) => e.payload?.itemName)[0]?.key ?? "—";
  const topAccom  =
    countBy(
      events.filter((e) => e.type === "accommodation_selected"),
      (e) => e.payload?.accommodationType,
    )[0]?.key ?? "—";

  const cards = [
    { label: "Total Item Clicks",  value: totalClicks.toLocaleString(), sub: null },
    { label: "Clicks Today",        value: todayClicks.toLocaleString(), sub: null },
    { label: "Most Clicked Item",  value: topItem,                       sub: "Top performer" },
    { label: "Top Accommodation",  value: topAccom,                      sub: "Most selected" },
  ];

  return (
    <div className="grid grid-cols-2 divide-x divide-y divide-neutral-100 border border-neutral-200 bg-white lg:grid-cols-4 lg:divide-y-0">
      {cards.map((c) => (
        <div key={c.label} className="px-6 py-5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-neutral-400">
            {c.label}
          </p>
          <p
            className="mt-2 truncate text-2xl font-bold text-black"
            style={{ fontFamily: "var(--font-serif), serif" }}
            title={String(c.value)}
          >
            {c.value}
          </p>
          {c.sub && (
            <p className="mt-0.5 text-[10px] uppercase tracking-[0.14em] text-neutral-500">
              {c.sub}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}
