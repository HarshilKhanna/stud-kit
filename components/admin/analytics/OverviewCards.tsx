"use client";

import { AnalyticsEvent, countBy, isToday } from "./helpers";

export function OverviewCards({ events }: { events: AnalyticsEvent[] }) {
  const clicks      = events.filter((e) => e.type === "item_clicked");
  const totalClicks = clicks.length;
  const todayClicks = clicks.filter((e) => isToday(e.timestamp)).length;
  const topItem     = countBy(clicks, (e) => e.payload?.itemName)[0]?.key ?? "—";
  const topAccom    = countBy(
    events.filter((e) => e.type === "accommodation_selected"),
    (e) => e.payload?.value,
  )[0]?.key ?? "—";

  const ACCOM_LABEL: Record<string, string> = {
    "dorm-furnished":   "Dorm (furnished)",
    "dorm-unfurnished": "Dorm (unfurnished)",
    "shared-apt":       "Shared Apt",
    "solo-apt":         "Solo Apt",
  };

  return (
    <div className="flex divide-x divide-neutral-100 border border-neutral-200 bg-white">
      {/* Compact numeric cells */}
      <div className="w-36 flex-shrink-0 px-6 py-5">
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-neutral-400">
          Total Clicks
        </p>
        <p className="mt-2 text-3xl font-light text-black" style={{ fontFamily: "var(--font-serif, serif)" }}>
          {totalClicks}
        </p>
      </div>
      <div className="w-36 flex-shrink-0 px-6 py-5">
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-neutral-400">
          Today
        </p>
        <p className="mt-2 text-3xl font-light text-black" style={{ fontFamily: "var(--font-serif, serif)" }}>
          {todayClicks}
        </p>
      </div>
      {/* Expanding text cells */}
      <div className="min-w-0 flex-1 px-6 py-5">
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-neutral-400">
          Most Clicked Item
        </p>
        <p className="mt-2 truncate text-lg font-semibold text-black" style={{ fontFamily: "var(--font-serif, serif)" }} title={topItem}>
          {topItem}
        </p>
        <p className="mt-0.5 text-[9px] uppercase tracking-[0.14em] text-neutral-400">Top performer</p>
      </div>
      <div className="min-w-0 flex-1 px-6 py-5">
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-neutral-400">
          Top Accommodation
        </p>
        <p className="mt-2 truncate text-lg font-semibold text-black" style={{ fontFamily: "var(--font-serif, serif)" }} title={topAccom}>
          {ACCOM_LABEL[topAccom] ?? topAccom}
        </p>
        <p className="mt-0.5 text-[9px] uppercase tracking-[0.14em] text-neutral-400">Most selected</p>
      </div>
    </div>
  );
}
