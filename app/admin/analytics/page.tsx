"use client";

import { useEffect, useState } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { subscribeAllEvents } from "@/lib/analytics";
import type { AnalyticsEvent } from "@/lib/analytics";
import { OverviewCards }   from "@/components/admin/analytics/OverviewCards";
import { ScrollDepthCard } from "@/components/admin/analytics/ScrollDepthCard";
import { MostViewedItems } from "@/components/admin/analytics/MostViewedItems";
import { DailyClicksChart } from "@/components/admin/analytics/DailyClicksChart";
import { RecentActivityFeed } from "@/components/admin/analytics/RecentActivityFeed";

export default function AnalyticsPage() {
  const [events, setEvents]     = useState<AnalyticsEvent[]>([]);
  const [loading, setLoading]   = useState(true);
  const [syncedAt, setSyncedAt] = useState("");

  useEffect(() => {
    const unsub = subscribeAllEvents(
      (incoming) => {
        setEvents(incoming);
        setLoading(false);
        setSyncedAt(
          new Date().toLocaleString("en-GB", {
            day: "2-digit", month: "short", year: "numeric",
            hour: "2-digit", minute: "2-digit",
          }).toUpperCase(),
        );
      },
      (err) => {
        console.error("Analytics subscription failed:", err);
        setLoading(false);
      },
    );
    return unsub;
  }, []);

  return (
    <AdminShell>
      {/* Header */}
      <div className="mb-8 flex items-baseline justify-between border-b border-neutral-100 pb-6">
        <div>
          <h1
            className="text-5xl font-light leading-none tracking-tight text-black"
            style={{ fontFamily: "var(--font-serif, serif)" }}
          >
            Analytics
          </h1>
          <p className="mt-2 text-base italic text-neutral-400" style={{ fontFamily: "var(--font-serif, serif)" }}>
            Real-time engagement data.
          </p>
        </div>
        <div className="text-right">
          <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-neutral-400">
            Live · Updated
          </p>
          <p className="mt-1 text-xs font-bold text-neutral-700">{syncedAt || "—"}</p>
        </div>
      </div>

      {loading ? (
        <p className="py-24 text-center text-[11px] uppercase tracking-widest text-neutral-500">
          Loading analytics…
        </p>
      ) : (
        <div className="space-y-6">
          {/* Row 1 — compact overview stats */}
          <OverviewCards events={events} />

          {/* Row 2 — daily clicks trend */}
          <DailyClicksChart events={events} />

          {/* Row 3 — scroll depth (spans full width) */}
          <ScrollDepthCard events={events} />

          {/* Row 4 — most clicked (left) + recent activity (right) */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <MostViewedItems events={events} />
            <RecentActivityFeed events={events} />
          </div>
        </div>
      )}

      <footer className="mt-10 border-t border-neutral-100 pt-5">
        <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">
          © {new Date().getFullYear()} StudentKit Analytics
        </span>
      </footer>
    </AdminShell>
  );
}
