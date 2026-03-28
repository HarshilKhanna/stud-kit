"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Dot,
} from "recharts";
import { AnalyticsEvent, fmtDate, CARD_CLS } from "./helpers";

export function DailyClicksChart({ events }: { events: AnalyticsEvent[] }) {
  const clicks = events.filter((e) => e.type === "item_clicked");

  // Build last-30-days buckets
  const now = new Date();
  const buckets: Record<string, number> = {};
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    buckets[fmtDate(d)] = 0;
  }

  for (const e of clicks) {
    if (!e.timestamp) continue;
    const d = new Date(e.timestamp.seconds * 1000);
    const key = fmtDate(d);
    if (key in buckets) buckets[key]++;
  }

  const data = Object.entries(buckets).map(([date, count]) => ({ date, count }));
  const hasEnoughData = data.filter((d) => d.count > 0).length >= 2;

  return (
    <div className={`${CARD_CLS} p-5`}>
      <h2 className="mb-4 text-xs font-semibold uppercase tracking-[0.12em] text-neutral-400">
        Daily Clicks (last 30 days)
      </h2>

      {!hasEnoughData ? (
        <p className="py-8 text-center text-sm text-neutral-400">
          Not enough data yet — check back after a few days of traffic.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <div className="min-w-[320px]">
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={data} margin={{ top: 4, right: 8, left: -16, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 10, fill: "#a3a3a3" }}
                  axisLine={false}
                  tickLine={false}
                  interval={4}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "#a3a3a3" }}
                  axisLine={false}
                  tickLine={false}
                  allowDecimals={false}
                />
                <Tooltip
                  contentStyle={{
                    fontSize: 12,
                    borderRadius: 8,
                    border: "1px solid #e5e5e5",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                  }}
                  cursor={{ stroke: "#e5e5e5" }}
                />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke="#60a5fa"
                  strokeWidth={2}
                  dot={<Dot r={3} fill="#60a5fa" strokeWidth={0} />}
                  activeDot={{ r: 5 }}
                  isAnimationActive
                  animationDuration={800}
                  animationEasing="ease-out"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
