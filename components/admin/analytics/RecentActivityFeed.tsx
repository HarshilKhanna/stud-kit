"use client";

import { MousePointerClick, Home } from "lucide-react";
import { AnalyticsEvent, timeAgo } from "./helpers";

function EventIcon({ type }: { type: string }) {
  const base = "flex h-8 w-8 flex-shrink-0 items-center justify-center border border-neutral-100 bg-neutral-50";
  if (type === "item_clicked") {
    return (
      <span className={base}>
        <MousePointerClick className="h-3.5 w-3.5 text-neutral-500" />
      </span>
    );
  }
  return (
    <span className={base}>
      <Home className="h-3.5 w-3.5 text-neutral-500" />
    </span>
  );
}

function eventLabel(e: AnalyticsEvent): { title: string; sub: string } {
  if (e.type === "item_clicked") {
    return {
      title: e.payload?.itemName ?? e.payload?.itemId ?? "Unknown item",
      sub:   "ITEM CLICKED",
    };
  }
  if (e.type === "accommodation_selected") {
    return {
      title: e.payload?.accommodationType ?? "Unknown",
      sub:   "ACCOMMODATION SELECTED",
    };
  }
  return { title: e.type, sub: "EVENT" };
}

export function RecentActivityFeed({ events }: { events: AnalyticsEvent[] }) {
  const recent = events
    .filter((e) => e.type !== "item_hovered" && e.type !== "scroll_depth")
    .slice(0, 12);

  return (
    <div className="flex h-[480px] flex-col border border-neutral-200 bg-white p-6 md:p-8">
      <h2 className="mb-5 flex-shrink-0 text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-400">
        Recent Activity
      </h2>

      {recent.length === 0 ? (
        <p className="py-12 text-center text-[11px] uppercase tracking-widest text-neutral-500">
          No data yet
        </p>
      ) : (
        <div className="flex-1 divide-y divide-neutral-50 overflow-y-auto">
          {recent.map((e) => {
            const { title, sub } = eventLabel(e);
            return (
              <div
                key={e.id}
                className="flex items-center justify-between gap-3 py-3"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <EventIcon type={e.type} />
                  <div className="min-w-0">
                    <p className="truncate text-xs font-semibold text-black">{title}</p>
                    <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-neutral-400">
                      {sub}
                    </p>
                  </div>
                </div>
                <span className="flex-shrink-0 text-[10px] uppercase tracking-widest text-neutral-500">
                  {timeAgo(e.timestamp)}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
