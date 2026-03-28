"use client";

import { useMemo } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { useData } from "@/context/DataContext";
import { Item } from "@/types";

function flattenItems(data: ReturnType<typeof useData>["data"]): Item[] {
  return data.flats.flatMap((flat) => flat.rooms.flatMap((room) => room.items));
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-neutral-200 bg-white px-5 py-4 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
      <p className="text-3xl font-semibold text-neutral-900">{value}</p>
      <p className="mt-1 text-xs font-light text-neutral-400">{label}</p>
    </div>
  );
}

const STAT_CATEGORIES = ["Furniture", "Lighting", "Decor", "Textiles", "Appliances"] as const;

export default function DashboardPage() {
  const { data } = useData();
  const allItems = useMemo(() => flattenItems(data), [data]);

  const stats = useMemo(() => {
    const counts = {} as Record<typeof STAT_CATEGORIES[number], number>;
    for (const cat of STAT_CATEGORIES) {
      counts[cat] = allItems.filter((i) => i.category.toLowerCase() === cat.toLowerCase()).length;
    }
    return { total: allItems.length, ...counts };
  }, [allItems]);

  return (
    <AdminShell>
      <div className="mb-6">
        <h1 className="text-base font-medium text-neutral-900">Dashboard</h1>
        <p className="mt-0.5 text-xs font-light text-neutral-400">
          Read-only overview of the current catalogue. Changes persist until the next refresh.
        </p>
      </div>

      {/* Stat cards — 2 cols mobile, 3 cols tablet, 6 cols desktop */}
      <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <StatCard label="Total items" value={stats.total} />
        {STAT_CATEGORIES.map((cat) => (
          <StatCard key={cat} label={cat} value={stats[cat] ?? 0} />
        ))}
      </div>

      {/* Desktop / tablet: full table */}
      <div className="hidden md:block rounded-lg border border-neutral-200 bg-white overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-neutral-100 bg-neutral-50">
              {["Position", "Name", "Brand", "Category", "Specs"].map((h) => (
                <th
                  key={h}
                  className="px-4 py-2.5 text-left text-[10px] font-medium uppercase tracking-[0.14em] text-neutral-400"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {allItems.map((item) => (
              <tr key={item.id} className="border-b border-neutral-50 last:border-0 hover:bg-neutral-50/60">
                <td className="px-4 py-2.5 text-xs text-neutral-400">
                  {item.displayPosition ?? <span className="text-neutral-300">Auto</span>}
                </td>
                <td className="px-4 py-2.5 text-xs font-medium text-neutral-800">{item.name}</td>
                <td className="px-4 py-2.5 text-xs text-neutral-500">{item.brand}</td>
                <td className="px-4 py-2.5 text-xs text-neutral-500">{item.category}</td>
                <td className="px-4 py-2.5 text-xs text-neutral-500">
                  {Object.keys(item.specs || {}).length}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile: card list */}
      <div className="md:hidden space-y-2">
        {allItems.map((item) => (
          <div
            key={item.id}
            className="rounded-lg border border-neutral-200 bg-white px-4 py-3 shadow-[0_1px_2px_rgba(0,0,0,0.04)]"
          >
            <p className="text-sm font-medium text-neutral-900">{item.name}</p>
            <p className="mt-0.5 text-xs text-neutral-500">{item.brand}</p>
            <div className="mt-2 flex items-center gap-3">
              <span className="rounded-full border border-neutral-200 px-2 py-0.5 text-[11px] text-neutral-500">
                {item.category}
              </span>
              <span className="text-[11px] text-neutral-400">
                {Object.keys(item.specs || {}).length} specs
              </span>
            </div>
          </div>
        ))}
      </div>
    </AdminShell>
  );
}
