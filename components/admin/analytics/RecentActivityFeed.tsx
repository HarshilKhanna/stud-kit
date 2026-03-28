"use client";

import { AnalyticsEvent, timeAgo, CARD_CLS } from "./helpers";

function Badge({ type }: { type: string }) {
  if (type === "item_clicked") {
    return (
      <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-600">
        Item Clicked
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-600">
      Accommodation
    </span>
  );
}

function label(e: AnalyticsEvent): string {
  if (e.type === "item_clicked") return e.payload?.itemName ?? e.payload?.itemId ?? "Unknown";
  if (e.type === "accommodation_selected") return e.payload?.accommodationType ?? "Unknown";
  return e.type;
}

export function RecentActivityFeed({ events }: { events: AnalyticsEvent[] }) {
  const recent = events
    .filter((e) => e.type !== "item_hovered" && e.type !== "scroll_depth")
    // Show only the latest 14 events; new ones appear at the top and push older out.
    .slice(0, 12);

  return (
    <div className={`${CARD_CLS} flex flex-col p-5 lg:h-[650px]`}>
      <h2 className="mb-4 flex-shrink-0 text-xs font-semibold uppercase tracking-[0.12em] text-neutral-400">
        Recent Activity
      </h2>

      {recent.length === 0 ? (
        <p className="py-8 text-center text-sm text-neutral-400">No data yet</p>
      ) : (
        <div className="space-y-2">
          {recent.map((e) => (
            <div
              key={e.id}
              className="flex items-center justify-between gap-3 border-b border-neutral-50 py-2.5 last:border-0"
            >
              <div className="flex min-w-0 items-center gap-2.5">
                <Badge type={e.type} />
                <span className="truncate text-sm text-neutral-700">{label(e)}</span>
              </div>
              <span className="flex-shrink-0 text-[11px] text-neutral-400">
                {timeAgo(e.timestamp)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
