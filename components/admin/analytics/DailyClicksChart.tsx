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
      <h2 className="mb-5 text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-400">
        Daily Clicks — Last 30 Days
      </h2>

      {!hasEnoughData ? (
        <p className="py-8 text-center text-[11px] uppercase tracking-[0.1em] text-neutral-500">
          Not enough data yet — check back after a few days of traffic.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <div className="min-w-[320px]">
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={data} margin={{ top: 4, right: 8, left: -16, bottom: 4 }}>
                <CartesianGrid strokeDasharray="2 4" stroke="#f0f0f0" vertical={false} />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 10, fill: "#a3a3a3", fontFamily: "var(--font-sans-alt, sans-serif)" }}
                  axisLine={false}
                  tickLine={false}
                  interval={4}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: "#a3a3a3", fontFamily: "var(--font-sans-alt, sans-serif)" }}
                  axisLine={false}
                  tickLine={false}
                  allowDecimals={false}
                />
                <Tooltip
                  contentStyle={{
                    fontSize: 11,
                    borderRadius: 0,
                    border: "1px solid #e5e5e5",
                    boxShadow: "none",
                    fontFamily: "var(--font-sans-alt, sans-serif)",
                  }}
                  cursor={{ stroke: "#e5e5e5" }}
                />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke="#000000"
                  strokeWidth={1.5}
                  dot={<Dot r={2} fill="#000000" strokeWidth={0} />}
                  activeDot={{ r: 4, fill: "#000000" }}
                  isAnimationActive
                  animationDuration={600}
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
