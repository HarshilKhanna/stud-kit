"use client";

import { useEffect, useMemo, useState } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { useData } from "@/context/DataContext";
import { seedFirestoreIfEmpty } from "@/lib/admin/seedFirestore";
import { subscribeRecentItems } from "@/lib/firestore";
import type { Item } from "@/types";
import {
  BROWSE_CATEGORY_CHIPS,
  BROWSE_CHIP_TO_ITEM_CATEGORIES,
  shortCategoryLabel,
  type BrowseCategoryChip,
} from "@/components/browse/FilterBar";
import { getItemImageDisplaySrc } from "@/lib/itemImageUrl";

export default function DashboardPage() {
  const { items } = useData();
  const [seeding, setSeeding] = useState(false);
  const [seedMsg, setSeedMsg] = useState<string | null>(null);
  const [recentItems, setRecentItems] = useState<Item[]>([]);

  useEffect(() => {
    const unsub = subscribeRecentItems(setRecentItems);
    return unsub;
  }, []);

  async function handleSeed() {
    setSeeding(true);
    setSeedMsg(null);
    try {
      const count = await seedFirestoreIfEmpty();
      setSeedMsg(
        count > 0
          ? `Seeded ${count} items to Firestore.`
          : "Firestore already has data — nothing seeded.",
      );
    } catch (e) {
      setSeedMsg("Seed failed. Check console.");
      console.error(e);
    } finally {
      setSeeding(false);
    }
  }

  const stats = useMemo(() => {
    const counts = {} as Record<BrowseCategoryChip, number>;
    for (const chip of BROWSE_CATEGORY_CHIPS) {
      const fullCats = BROWSE_CHIP_TO_ITEM_CATEGORIES[chip];
      counts[chip] = items.filter((i) => fullCats.includes(i.category)).length;
    }
    return { total: items.length, counts };
  }, [items]);


  const today = new Date().toLocaleDateString("en-GB", {
    day: "2-digit", month: "short", year: "numeric",
  }).toUpperCase();

  return (
    <AdminShell>
      {/* Header */}
      <header className="mb-6 flex flex-col gap-2 md:mb-8 md:flex-row md:items-baseline md:justify-between">
        <div>
          <h1
            className="font-light leading-none tracking-tight text-black"
            style={{ fontSize: "clamp(1.75rem, 4vw, 3rem)", fontFamily: "var(--font-serif, serif)" }}
          >
            Dashboard
          </h1>
          <p className="mt-2 text-base italic text-neutral-400" style={{ fontFamily: "var(--font-serif, serif)" }}>
            {today}
          </p>
        </div>
        <a
          href="/admin/items"
          className="self-start border border-neutral-200 px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-neutral-600 transition-colors hover:border-black hover:text-black md:self-auto"
        >
          Manage Items
        </a>
      </header>

      {/* Seed banner — only shown when Firestore is empty */}
      {items.length === 0 && (
        <div className="mb-6 flex items-center justify-between border border-neutral-200 bg-white px-6 py-4">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-neutral-600">
              Firestore is empty
            </p>
            <p className="mt-0.5 text-[10px] text-neutral-400">
              Seed the default catalogue to get started.
            </p>
          </div>
          <div className="flex flex-col items-end gap-1">
            <button
              onClick={handleSeed}
              disabled={seeding}
              className="bg-black px-5 py-2.5 text-[10px] font-bold uppercase tracking-[0.2em] text-white transition-colors hover:bg-neutral-800 disabled:opacity-50"
            >
              {seeding ? "Seeding…" : "Seed Catalogue"}
            </button>
            {seedMsg && (
              <p className="text-[10px] text-neutral-500">{seedMsg}</p>
            )}
          </div>
        </div>
      )}

      {/* Compact metrics strip */}
      <div className="mb-8 grid grid-cols-2 divide-x divide-y divide-neutral-100 border border-neutral-200 bg-white sm:grid-cols-3 lg:grid-cols-5 lg:divide-y-0">
        <div className="px-4 py-4 sm:px-6 sm:py-5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-neutral-500">
            Total Items
          </p>
          <p
            className="mt-2 text-3xl font-light text-black"
            style={{ fontFamily: "var(--font-serif, serif)" }}
          >
            {stats.total}
          </p>
        </div>
        {BROWSE_CATEGORY_CHIPS.slice(0, 4).map((chip) => (
          <div key={chip} className="px-4 py-4 sm:px-6 sm:py-5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-neutral-500">
              {chip}
            </p>
            <div className="mt-2 flex items-baseline justify-between gap-2">
              <p
                className="text-3xl font-light text-black"
                style={{ fontFamily: "var(--font-serif, serif)" }}
              >
                {String(stats.counts[chip]).padStart(2, "0")}
              </p>
              <p className="flex-shrink-0 text-[10px] font-semibold uppercase tracking-widest text-neutral-400">
                {stats.total ? Math.round((stats.counts[chip] / stats.total) * 100) : 0}%
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Acquisitions */}
      <section>
        <div className="mb-4 flex items-end justify-between">
          <h3
            className="text-xl font-normal text-black"
            style={{ fontFamily: "var(--font-serif, serif)" }}
          >
            Recent Acquisitions
          </h3>
          <a
            href="/admin/items"
            className="border-b border-black/20 pb-0.5 text-[10px] font-bold uppercase tracking-widest text-neutral-600 transition-colors hover:border-black hover:text-black"
          >
            View All →
          </a>
        </div>

        {/* Desktop table */}
        <div className="hidden overflow-hidden border border-neutral-200 bg-white md:block">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-neutral-100 bg-neutral-50">
                {["Item", "Classification", "Source", ""].map((h) => (
                  <th
                    key={h}
                    className="py-3 pr-4 first:pl-4 text-[10px] font-bold uppercase tracking-[0.18em] text-neutral-500"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {recentItems.map((item) => {
                const imgSrc = getItemImageDisplaySrc(item);
                return (
                  <tr key={item.id} className="group transition-colors hover:bg-neutral-50/50">
                    <td className="py-3 pl-4 pr-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 flex-shrink-0 overflow-hidden bg-[#F9F9F9]">
                          {imgSrc ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={imgSrc}
                              alt={item.name}
                              className="h-full w-full object-contain p-0.5"
                            />
                          ) : (
                            <div className="h-full w-full" />
                          )}
                        </div>
                        <span
                          className="text-sm font-medium text-black"
                          style={{ fontFamily: "var(--font-serif, serif)" }}
                        >
                          {item.name}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 pr-4">
                      <span className="border border-neutral-200 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em] text-neutral-600">
                        {shortCategoryLabel(item.category)}
                      </span>
                    </td>
                    <td className="py-3 pr-4 text-[10px] font-semibold uppercase tracking-widest text-neutral-500">
                      {item.source === "bring-from-india" ? "India" : item.source === "buy-there" ? "Local" : "Either"}
                    </td>
                    <td className="py-3 pr-4 text-right">
                      <a
                        href="/admin/items"
                        className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 transition-colors hover:text-black"
                      >
                        ↗
                      </a>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Mobile card list */}
        <div className="divide-y divide-neutral-100 border border-neutral-200 bg-white md:hidden">
          {recentItems.map((item) => (
            <div key={item.id} className="px-4 py-3">
              <p
                className="text-sm font-medium text-black"
                style={{ fontFamily: "var(--font-serif, serif)" }}
              >
                {item.name}
              </p>
              <p className="mt-0.5 text-[10px] font-bold uppercase tracking-widest text-neutral-500">
                {item.brand ?? "—"}
              </p>
              <span className="mt-2 inline-block border border-neutral-200 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-neutral-600">
                {shortCategoryLabel(item.category)}
              </span>
            </div>
          ))}
        </div>
      </section>
    </AdminShell>
  );
}
