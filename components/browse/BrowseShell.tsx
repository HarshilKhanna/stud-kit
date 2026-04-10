"use client";

import { useMemo, useState, useEffect, useRef } from "react";
import { useData } from "@/context/DataContext";
import { Item } from "@/types";
import { ItemGrid } from "./ItemGrid";
import { PrioritySections } from "./PrioritySections";
import {
  FilterBar,
  BrowseCategoryChip,
  SourceFilter,
  FILTER_CATEGORIES,
  itemCategoryMatchesBrowseChips,
} from "./FilterBar";
import { SortOption } from "./SortBar";
import { StudentProfileModal } from "@/components/profile/StudentProfileModal";
import { trackEvent } from "@/lib/analytics";

const CATEGORY_ORDER: Record<string, number> = Object.fromEntries(
  FILTER_CATEGORIES.map((c, i) => [c.toLowerCase(), i]),
);

function primaryDimension(item: Item): number {
  const dim = item.specs?.Dimensions;
  if (!dim) return 0;
  const nums = dim.match(/[\d.]+/g);
  if (!nums || nums.length === 0) return 0;
  return Math.max(...nums.map(Number));
}

function baseCategorySort(items: Item[]): Item[] {
  return [...items].sort((a, b) => {
    const catA = CATEGORY_ORDER[a.category.toLowerCase()] ?? 99;
    const catB = CATEGORY_ORDER[b.category.toLowerCase()] ?? 99;
    if (catA !== catB) return catA - catB;
    return primaryDimension(b) - primaryDimension(a);
  });
}

function featuredSort(items: Item[]): Item[] {
  const positioned: Item[] = [];
  const unpositioned: Item[] = [];
  for (const item of items) {
    if (typeof item.displayPosition === "number" && Number.isFinite(item.displayPosition) && item.displayPosition > 0) {
      positioned.push(item);
    } else {
      unpositioned.push(item);
    }
  }
  const ordered = baseCategorySort(unpositioned);
  const sortedPositioned = [...positioned].sort((a, b) => {
    const pa = a.displayPosition as number;
    const pb = b.displayPosition as number;
    if (pa !== pb) return pa - pb;
    return a.id.localeCompare(b.id);
  });
  for (const item of sortedPositioned) {
    const insertAt = Math.min(Math.max((item.displayPosition as number) - 1, 0), ordered.length);
    ordered.splice(insertAt, 0, item);
  }
  return ordered;
}

function sortItems(items: Item[], sort: SortOption): Item[] {
  switch (sort) {
    case "name-asc":  return [...items].sort((a, b) => a.name.localeCompare(b.name));
    case "name-desc": return [...items].sort((a, b) => b.name.localeCompare(a.name));
    case "brand":     return [...items].sort((a, b) => (a.brand ?? "").localeCompare(b.brand ?? ""));
    default:          return featuredSort(items);
  }
}

function matchesSource(item: Item, sourceFilter: SourceFilter): boolean {
  if (sourceFilter === "all")              return true;
  if (sourceFilter === "bring-from-india") return item.source === "bring-from-india";
  if (sourceFilter === "buy-there")        return item.source === "buy-there";
  return true;
}

function tieBreak(a: Item, b: Item, sort: SortOption): number {
  switch (sort) {
    case "name-asc":  return a.name.localeCompare(b.name);
    case "name-desc": return b.name.localeCompare(a.name);
    case "brand":     return (a.brand ?? "").localeCompare(b.brand ?? "");
    default: {
      const ca = CATEGORY_ORDER[a.category.toLowerCase()] ?? 99;
      const cb = CATEGORY_ORDER[b.category.toLowerCase()] ?? 99;
      if (ca !== cb) return ca - cb;
      return primaryDimension(b) - primaryDimension(a);
    }
  }
}

// ── Scroll depth sentinel — fires once per depth milestone per page visit ──

function useScrollDepth() {
  const fired = useRef(new Set<string>());

  useEffect(() => {
    const MILESTONES = ["25%", "50%", "75%", "100%"] as const;
    fired.current.clear();

    function check() {
      const el = document.documentElement;
      const scrolled = el.scrollTop + el.clientHeight;
      const total    = el.scrollHeight;
      const pct      = total <= 0 ? 0 : (scrolled / total) * 100;

      for (const m of MILESTONES) {
        const threshold = parseInt(m, 10);
        if (pct >= threshold && !fired.current.has(m)) {
          fired.current.add(m);
          trackEvent("scroll_depth", { depth: m });
        }
      }
    }

    window.addEventListener("scroll", check, { passive: true });
    check(); // fire immediately in case page is short
    return () => window.removeEventListener("scroll", check);
  }, []);
}

export function BrowseShell({ projectId }: { projectId?: string }) {
  const { filteredItems, studentProfile, openProfileModal } = useData();
  useScrollDepth();

  const [activeBrowseChips, setActiveBrowseChips] = useState<BrowseCategoryChip[]>([]);
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>("all");
  const [activeSort, setActiveSort] = useState<SortOption>("featured");

  const baseList = useMemo(() => {
    let list = filteredItems;
    if (projectId) list = list.filter((item) => item.projectId === projectId);
    return list;
  }, [filteredItems, projectId]);

  const visibleItems = useMemo(() => {
    let list = baseList;
    if (activeBrowseChips.length > 0) {
      list = list.filter((item) => itemCategoryMatchesBrowseChips(item.category, activeBrowseChips));
    }
    list = list.filter((item) => matchesSource(item, sourceFilter));

    const priorityOrder: Record<string, number> = { "day-1": 0, "week-1": 1, "month-1": 2, optional: 3 };
    if (studentProfile) {
      return [...list].sort((a, b) => {
        const pa = priorityOrder[a.priority] ?? 99;
        const pb = priorityOrder[b.priority] ?? 99;
        if (pa !== pb) return pa - pb;
        return tieBreak(a, b, activeSort);
      });
    }
    return sortItems(list, activeSort);
  }, [baseList, activeBrowseChips, sourceFilter, activeSort, studentProfile]);

  const animationKey = `${activeBrowseChips.slice().sort().join(",")}-${activeSort}-${sourceFilter}-${Boolean(studentProfile)}`;
  const showPriorityLayout = studentProfile != null;

  return (
    <div
      className="min-h-screen bg-[#F9F9F9]"
      style={{ fontFamily: "var(--font-sans-alt), Manrope, sans-serif" }}
    >
      <StudentProfileModal />

      {/* ── Editorial page header ── */}
      <div className="px-8 pb-6 pt-10 md:px-16">
        <div className="flex items-baseline justify-between">
          <h1
            className="text-5xl font-semibold tracking-tighter text-black md:text-6xl"
            style={{ fontFamily: "var(--font-serif), serif" }}
          >
            The Essentials
          </h1>
          <span className="hidden text-[10px] font-semibold uppercase tracking-[0.18em] text-neutral-400 md:block">
            {visibleItems.length} items curated for success
          </span>
        </div>
      </div>

      <FilterBar
        activeBrowseChips={activeBrowseChips}
        onBrowseChipsChange={setActiveBrowseChips}
        sourceFilter={sourceFilter}
        onSourceChange={setSourceFilter}
        sort={activeSort}
        onSortChange={setActiveSort}
      />

      {/* No-profile prompt */}
      {studentProfile == null && (
        <div className="mx-auto max-w-none px-8 pt-6 md:px-16">
          <div className="flex flex-col gap-3 border border-neutral-200 bg-neutral-50 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-neutral-500">
              Set your destination to get a personalised list and timeline.
            </p>
            <button
              type="button"
              onClick={() => openProfileModal()}
              className="flex-shrink-0 rounded-full bg-black px-5 py-2 text-[10px] font-bold uppercase tracking-widest text-white transition-colors hover:bg-neutral-800"
            >
              Set my profile
            </button>
          </div>
        </div>
      )}

      {/* Grid */}
      <section className="px-8 pb-24 pt-8 md:px-16">
        {showPriorityLayout ? (
          <PrioritySections items={visibleItems} animationKey={animationKey} />
        ) : (
          <ItemGrid items={visibleItems} animationKey={animationKey} />
        )}
      </section>
    </div>
  );
}
