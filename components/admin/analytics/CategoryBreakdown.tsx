"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { AnalyticsEvent, countBy, CARD_CLS } from "./helpers";

export function CategoryBreakdown({ events }: { events: AnalyticsEvent[] }) {
  const clicks = events.filter((e) => e.type === "item_clicked");
  const data = countBy(clicks, (e) => e.payload?.category).map(
    ({ key, count }) => ({ name: key, count })
  );

  return (
    <div className={`${CARD_CLS} p-5`}>
      <h2 className="mb-4 text-xs font-semibold uppercase tracking-[0.12em] text-neutral-400">
        Clicks by Category
      </h2>

      {data.length === 0 ? (
        <p className="py-8 text-center text-sm text-neutral-400">No data yet</p>
      ) : (
        <div className="overflow-x-auto">
          <div className="min-w-[320px]">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={data} margin={{ top: 4, right: 8, left: -16, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 11, fill: "#a3a3a3" }}
                  axisLine={false}
                  tickLine={false}
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
                  cursor={{ fill: "#f5f5f5" }}
                />
                <Bar
                  dataKey="count"
                  fill="#34d399"
                  radius={[4, 4, 0, 0]}
                  isAnimationActive
                  animationDuration={800}
                  animationEasing="ease-out"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
