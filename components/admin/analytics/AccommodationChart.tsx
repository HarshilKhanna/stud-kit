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

const SHORT: Record<string, string> = {
  "Studio apartment": "Studio",
  "1 BHK apartment": "1 BHK",
  "2 BHK apartment": "2 BHK",
  "3 BHK apartment": "3 BHK",
  "4 BHK apartment": "4 BHK",
  "Duplex apartment": "Duplex",
  "Penthouse": "Penthouse",
  "Independent floor": "Ind. Floor",
  "Row house": "Row House",
  "Townhouse": "Townhouse",
  "Bungalow": "Bungalow",
  "Villa": "Villa",
  "PG / shared accommodation": "PG/Shared",
  "Hostel room": "Hostel",
  "Serviced apartment": "Serviced",
  "Holiday home / Airbnb": "Holiday",
  "Other": "Other",
  "Show all items": "Show All",
};

export function AccommodationChart({ events }: { events: AnalyticsEvent[] }) {
  const accom = events.filter((e) => e.type === "accommodation_selected");
  const data = countBy(accom, (e) => e.payload?.accommodationType).map(
    ({ key, count }) => ({ name: SHORT[key] ?? key, count })
  );

  return (
    <div className={`${CARD_CLS} p-5`}>
      <h2 className="mb-4 text-xs font-semibold uppercase tracking-[0.12em] text-neutral-400">
        Accommodation Selections
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
                  fill="#818cf8"
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
