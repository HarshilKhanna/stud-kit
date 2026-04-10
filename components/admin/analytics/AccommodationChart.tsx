"use client";

import { AnalyticsEvent, countBy, CARD_CLS } from "./helpers";

const REGION_LABEL: Record<string, string> = {
  "us-cold":      "US Northeast",
  "us-warm":      "US South/West",
  "uk":           "UK",
  "canada":       "Canada",
  "europe-west":  "W. Europe",
  "australia":    "Australia",
  "singapore":    "Singapore",
  "middle-east":  "Middle East",
};

const ACCOM_LABEL: Record<string, string> = {
  "dorm-furnished":   "Dorm (furnished)",
  "dorm-unfurnished": "Dorm (unfurnished)",
  "shared-apt":       "Shared Apt",
  "solo-apt":         "Solo Apt",
};

const ARRIVAL_LABEL: Record<string, string> = {
  "lt-2-weeks":    "< 2 weeks",
  "1-2-months":    "1–2 months",
  "3-plus-months": "3+ months",
};

const BUDGET_LABEL: Record<string, string> = {
  "tight":       "Tight",
  "comfortable": "Comfortable",
  "flexible":    "Flexible",
};

function HorizontalBars({
  title,
  data,
  labelMap,
}: {
  title: string;
  data: { key: string; count: number }[];
  labelMap: Record<string, string>;
}) {
  const max = Math.max(...data.map((d) => d.count), 1);
  return (
    <div>
      <p className="mb-4 text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-400">
        {title}
      </p>
      {data.length === 0 ? (
        <p className="py-4 text-center text-[10px] uppercase tracking-widest text-neutral-400">No data yet</p>
      ) : (
        <div className="space-y-2.5">
          {data.map(({ key, count }) => {
            const pct = Math.round((count / max) * 100);
            const label = labelMap[key] ?? key;
            return (
              <div key={key}>
                <div className="mb-1 flex items-baseline justify-between gap-2">
                  <span className="truncate text-[10px] font-semibold text-neutral-700" title={label}>
                    {label}
                  </span>
                  <span className="flex-shrink-0 text-[10px] font-bold text-black">{count}</span>
                </div>
                <div className="relative h-[2px] w-full bg-neutral-100">
                  <div
                    className="absolute left-0 top-0 h-full bg-black transition-all duration-500"
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

export function AccommodationChart({ events }: { events: AnalyticsEvent[] }) {
  const regions  = countBy(events.filter((e) => e.type === "region_selected"),        (e) => e.payload?.value);
  const accoms   = countBy(events.filter((e) => e.type === "accommodation_selected"), (e) => e.payload?.value);
  const arrivals = countBy(events.filter((e) => e.type === "arrival_selected"),       (e) => e.payload?.value);
  const budgets  = countBy(events.filter((e) => e.type === "budget_selected"),        (e) => e.payload?.value);

  return (
    <div className={`${CARD_CLS} p-6 md:p-8`}>
      <h2 className="mb-8 text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-400">
        Profile Question Breakdown
      </h2>
      <div className="grid grid-cols-1 gap-10 sm:grid-cols-2">
        <HorizontalBars title="Destination"         data={regions}  labelMap={REGION_LABEL}  />
        <HorizontalBars title="Accommodation Type"  data={accoms}   labelMap={ACCOM_LABEL}   />
        <HorizontalBars title="Arrival Timing"      data={arrivals} labelMap={ARRIVAL_LABEL} />
        <HorizontalBars title="Budget"              data={budgets}  labelMap={BUDGET_LABEL}  />
      </div>
    </div>
  );
}
