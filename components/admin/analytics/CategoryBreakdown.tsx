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
      <h2 className="mb-5 text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-400">
        Clicks by Category
      </h2>

      {data.length === 0 ? (
        <p className="py-8 text-center text-[11px] uppercase tracking-[0.1em] text-neutral-500">
          No data yet
        </p>
      ) : (
        <div className="overflow-x-auto">
          <div className="min-w-[320px]">
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={data} margin={{ top: 4, right: 8, left: -16, bottom: 4 }}>
                <CartesianGrid strokeDasharray="2 4" stroke="#f0f0f0" vertical={false} />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 10, fill: "#a3a3a3", fontFamily: "var(--font-sans-alt, sans-serif)" }}
                  axisLine={false}
                  tickLine={false}
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
                  cursor={{ fill: "#f5f5f5" }}
                />
                <Bar
                  dataKey="count"
                  fill="#000000"
                  radius={[0, 0, 0, 0]}
                  isAnimationActive
                  animationDuration={600}
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
