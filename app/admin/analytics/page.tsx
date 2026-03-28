"use client";

import { useEffect, useState } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { getAllEvents } from "@/lib/analytics";
import type { AnalyticsEvent } from "@/lib/analytics";
import { OverviewCards } from "@/components/admin/analytics/OverviewCards";
import { ScrollDepthCard } from "@/components/admin/analytics/ScrollDepthCard";
import { MostViewedItems } from "@/components/admin/analytics/MostViewedItems";
import { AccommodationChart } from "@/components/admin/analytics/AccommodationChart";
import { CategoryBreakdown } from "@/components/admin/analytics/CategoryBreakdown";
import { DailyClicksChart } from "@/components/admin/analytics/DailyClicksChart";
import { RecentActivityFeed } from "@/components/admin/analytics/RecentActivityFeed";

export default function AnalyticsPage() {
  const [events, setEvents] = useState<AnalyticsEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAllEvents()
      .then(setEvents)
      .catch((err) => console.error("Analytics fetch failed:", err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <AdminShell>
      <div className="mb-6">
        <h1 className="text-base font-medium text-neutral-900">Analytics</h1>
        <p className="mt-0.5 text-xs font-light text-neutral-400">
          Event data collected from browse interactions. Fetched once per visit.
        </p>
      </div>

      {loading ? (
        <p className="py-20 text-center text-sm text-neutral-400">
          Loading analytics…
        </p>
      ) : (
        <div className="space-y-4 md:space-y-5">
          {/* Overview */}
          <OverviewCards events={events} />

          {/* Scroll depth */}
          <ScrollDepthCard events={events} />

        {/* MostViewed + Recent Activity — side by side on desktop.
            MostViewed sets the natural height; RecentActivity scrolls within that height. */}
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2 lg:items-start">
            <MostViewedItems events={events} />
            <RecentActivityFeed events={events} />
          </div>

          {/* Category breakdown — full width */}
          <CategoryBreakdown events={events} />

          {/* Daily clicks — full width */}
          <DailyClicksChart events={events} />

          {/* Accommodation selections — full width */}
          <AccommodationChart events={events} />
        </div>
      )}
    </AdminShell>
  );
}
