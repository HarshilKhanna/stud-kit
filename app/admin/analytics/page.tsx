"use client";

import { useEffect, useState } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { getAllEvents } from "@/lib/analytics";
import type { AnalyticsEvent } from "@/lib/analytics";
import { OverviewCards }      from "@/components/admin/analytics/OverviewCards";
import { ScrollDepthCard }    from "@/components/admin/analytics/ScrollDepthCard";
import { MostViewedItems }    from "@/components/admin/analytics/MostViewedItems";
import { AccommodationChart } from "@/components/admin/analytics/AccommodationChart";
import { CategoryBreakdown }  from "@/components/admin/analytics/CategoryBreakdown";
import { DailyClicksChart }   from "@/components/admin/analytics/DailyClicksChart";
import { RecentActivityFeed } from "@/components/admin/analytics/RecentActivityFeed";

export default function AnalyticsPage() {
  const [events, setEvents]   = useState<AnalyticsEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncedAt]            = useState(() =>
    new Date().toLocaleString("en-GB", {
      day:    "2-digit",
      month:  "short",
      year:   "numeric",
      hour:   "2-digit",
      minute: "2-digit",
    }).toUpperCase(),
  );

  useEffect(() => {
    getAllEvents()
      .then(setEvents)
      .catch((err) => console.error("Analytics fetch failed:", err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <AdminShell>
      {/* Editorial header */}
      <div className="mb-10 flex flex-col gap-4 border-b border-neutral-100 pb-8 md:flex-row md:items-baseline md:justify-between">
        <div>
          <h1
            className="text-5xl font-light leading-none tracking-tight text-black"
            style={{ fontFamily: "var(--font-serif, serif)" }}
          >
            Analytics
          </h1>
          <p
            className="mt-2 text-base italic text-neutral-400"
            style={{ fontFamily: "var(--font-serif, serif)" }}
          >
            Historical trends &amp; interaction patterns for the current academic year.
          </p>
        </div>
        <div className="flex-shrink-0 text-right">
          <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-neutral-400">
            Last Synchronized
          </p>
          <p className="mt-1 text-xs font-bold text-neutral-700">{syncedAt}</p>
        </div>
      </div>

      {loading ? (
        <p className="py-24 text-center text-[11px] uppercase tracking-widest text-neutral-500">
          Loading analytics…
        </p>
      ) : (
        <div className="space-y-10">
          {/* Key metrics */}
          <OverviewCards events={events} />

          {/* Scroll depth (wide) + Most viewed (narrow) */}
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-12">
            <div className="lg:col-span-8">
              <ScrollDepthCard events={events} />
            </div>
            <div className="lg:col-span-4">
              <MostViewedItems events={events} />
            </div>
          </div>

          {/* Recent activity + system status */}
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-2">
            <RecentActivityFeed events={events} />
            {/* System status bento card */}
            <div className="relative flex min-h-[320px] flex-col justify-between overflow-hidden bg-neutral-100 p-10">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-neutral-400">
                  System Status
                </p>
                <h4
                  className="mt-4 text-5xl font-bold leading-none text-black"
                  style={{ fontFamily: "var(--font-serif, serif)" }}
                >
                  Optimal<br />Performance.
                </h4>
              </div>
              <div className="space-y-6">
                {[
                  { label: "Storage Capacity", pct: 64 },
                  { label: "Compute Load", pct: 12 },
                ].map(({ label, pct }) => (
                  <div key={label} className="space-y-2">
                    <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-neutral-500">
                      <span>{label}</span>
                      <span>{pct}%</span>
                    </div>
                    <div className="relative h-[2px] w-full bg-neutral-300">
                      <div className="absolute left-0 top-0 h-full bg-black" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Additional charts */}
          <CategoryBreakdown events={events} />
          <DailyClicksChart events={events} />
          <AccommodationChart events={events} />
        </div>
      )}

      {/* Footer */}
      <footer className="mt-16 flex items-center justify-between border-t border-neutral-100 pt-8">
        <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-500">
          © {new Date().getFullYear()} StudentKit Institutional Analytics
        </span>
        <div className="flex gap-8">
          {["Privacy Monograph", "Terms of Access"].map((l) => (
            <span
              key={l}
              className="cursor-default text-[10px] font-bold uppercase tracking-widest text-neutral-500 underline decoration-neutral-300 underline-offset-4"
            >
              {l}
            </span>
          ))}
        </div>
      </footer>
    </AdminShell>
  );
}
