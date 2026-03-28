"use client";

import { AnalyticsEvent, countBy, isToday, CARD_CLS } from "./helpers";

const ACCENT_COLORS = [
  "border-blue-400",
  "border-emerald-400",
  "border-violet-400",
  "border-amber-400",
];

function StatCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: string | number;
  accent: string;
}) {
  return (
    <div className={`${CARD_CLS} flex overflow-hidden`}>
      <div className={`w-1 flex-shrink-0 rounded-l-lg ${accent}`} />
      <div className="px-4 py-4">
        <p className="text-2xl font-bold text-neutral-900">{value}</p>
        <p className="mt-0.5 text-[11px] font-medium uppercase tracking-[0.12em] text-neutral-400">
          {label}
        </p>
      </div>
    </div>
  );
}

export function OverviewCards({ events }: { events: AnalyticsEvent[] }) {
  const clicks = events.filter((e) => e.type === "item_clicked");
  const totalClicks = clicks.length;
  const todayClicks = clicks.filter((e) => isToday(e.timestamp)).length;

  const topItem = countBy(clicks, (e) => e.payload?.itemName)[0]?.key ?? "—";
  const topAccom =
    countBy(
      events.filter((e) => e.type === "accommodation_selected"),
      (e) => e.payload?.accommodationType
    )[0]?.key ?? "—";

  const cards = [
    { label: "Total Item Clicks", value: totalClicks, accent: ACCENT_COLORS[0] },
    { label: "Clicks Today", value: todayClicks, accent: ACCENT_COLORS[1] },
    { label: "Most Clicked Item", value: topItem, accent: ACCENT_COLORS[2] },
    { label: "Top Accommodation", value: topAccom, accent: ACCENT_COLORS[3] },
  ];

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((c) => (
        <StatCard key={c.label} {...c} />
      ))}
    </div>
  );
}
