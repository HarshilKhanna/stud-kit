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

  const cells = [
    {
      label: "Total Clicks",
      value: String(totalClicks),
      sub: null,
      large: true,
    },
    {
      label: "Today",
      value: String(todayClicks),
      sub: null,
      large: true,
    },
    {
      label: "Most Clicked Item",
      value: topItem,
      sub: "Top performer",
      large: false,
    },
    {
      label: "Top Accommodation",
      value: ACCOM_LABEL[topAccom] ?? topAccom,
      sub: "Most selected",
      large: false,
    },
  ];

  return (
    /* auto-fit: each cell is at least 120px, grows to fill */
    <div
      className="border border-neutral-200 bg-white"
      style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))" }}
    >
      {cells.map(({ label, value, sub, large }, idx) => (
        <div
          key={label}
          className="min-w-0 px-5 py-4"
          style={{
            borderRight: idx < cells.length - 1 ? "1px solid #f5f5f5" : undefined,
            borderBottom: "1px solid #f5f5f5",
          }}
        >
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-neutral-400">
            {label}
          </p>
          {large ? (
            <p
              className="mt-2 text-3xl font-light text-black"
              style={{ fontFamily: "var(--font-serif, serif)" }}
            >
              {value}
            </p>
          ) : (
            <p
              className="mt-2 truncate text-base font-semibold text-black"
              style={{ fontFamily: "var(--font-serif, serif)" }}
              title={value}
            >
              {value}
            </p>
          )}
          {sub && (
            <p className="mt-0.5 text-[9px] uppercase tracking-[0.14em] text-neutral-400">{sub}</p>
          )}
        </div>
      ))}
    </div>
  );
}
