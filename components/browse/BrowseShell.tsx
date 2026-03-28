"use client";

import { useMemo, useState } from "react";
import { useData } from "@/context/DataContext";
import { Item } from "@/types";
import { ItemGrid } from "./ItemGrid";
import { FilterBar, Category } from "./FilterBar";
import { SortOption } from "./SortBar";
import {
  useAccommodation,
  ACCOMMODATION_OPTIONS,
  AccommodationType,
} from "@/context/AccommodationContext";
import { trackEvent } from "@/lib/analytics";

function flattenItems(tower: ReturnType<typeof useData>["data"]): Item[] {
  return tower.flats.flatMap((flat) =>
    flat.rooms.flatMap((room) => room.items)
  );
}

const CATEGORY_ORDER: Record<string, number> = {
  furniture: 0,
  lighting: 1,
  decor: 2,
  textiles: 3,
  appliances: 4,
};

function primaryDimension(item: Item): number {
  const dim = item.specs?.Dimensions;
  if (!dim) return 0;
  const nums = dim.match(/[\d.]+/g);
  if (!nums || nums.length === 0) return 0;
  return Math.max(...nums.map(Number));
}

function featuredSort(items: Item[]): Item[] {
  return [...items].sort((a, b) => {
    const posA = a.displayPosition ?? null;
    const posB = b.displayPosition ?? null;

    // Pinned items always come first, sorted by position ascending
    if (posA !== null && posB !== null) return posA - posB;
    if (posA !== null) return -1;
    if (posB !== null) return 1;

    // Unpinned: sort by category then dimension descending
    const catA = CATEGORY_ORDER[a.category.toLowerCase()] ?? 99;
    const catB = CATEGORY_ORDER[b.category.toLowerCase()] ?? 99;
    if (catA !== catB) return catA - catB;
    return primaryDimension(b) - primaryDimension(a);
  });
}

function sortItems(items: Item[], sort: SortOption): Item[] {
  switch (sort) {
    case "name-asc":
      return [...items].sort((a, b) => a.name.localeCompare(b.name));
    case "name-desc":
      return [...items].sort((a, b) => b.name.localeCompare(a.name));
    case "brand":
      return [...items].sort((a, b) => a.brand.localeCompare(b.brand));
    case "category":
      return featuredSort(items);
    default:
      return featuredSort(items);
  }
}

export function BrowseShell() {
  const { data } = useData();
  const {
    promptNeeded,
    showPrompt,
    openPrompt,
    select,
    dismiss,
    fitsAccommodation,
  } = useAccommodation();

  const [activeCategories, setActiveCategories] = useState<Category[]>([]);
  const [activeSort, setActiveSort] = useState<SortOption>("featured");

  const allItems = useMemo(() => flattenItems(data), [data]);

  const visibleItems = useMemo(() => {
    const filtered =
      activeCategories.length === 0
        ? allItems
        : allItems.filter((item) =>
            activeCategories.some(
              (cat) => cat.toLowerCase() === item.category.toLowerCase(),
            ),
          );

    const accommodationFiltered = filtered.filter(fitsAccommodation);
    return sortItems(accommodationFiltered, activeSort);
  }, [allItems, activeCategories, activeSort, fitsAccommodation]);

  const animationKey = `${activeCategories.sort().join(",")}-${activeSort}`;

  const handleItemClick = (item: Item) => {
    const hasDimensions = Boolean(item.specs?.Dimensions);

    if (hasDimensions && promptNeeded) {
      openPrompt();
      return;
    }

    if (item.externalUrl && typeof window !== "undefined") {
      window.open(item.externalUrl, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <>
      <FilterBar
        activeCategories={activeCategories}
        onCategoriesChange={setActiveCategories}
        sort={activeSort}
        onSortChange={setActiveSort}
      />

      <section className="mx-auto max-w-[1400px] px-4 pt-4 pb-20">
        <ItemGrid
          items={visibleItems}
          onItemClick={handleItemClick}
          animationKey={animationKey}
        />
      </section>

      {showPrompt && <AccommodationPrompt onSelect={select} onSkip={dismiss} />}
    </>
  );
}

/** Strip redundant words to keep card labels short */
function shortLabel(opt: string): string {
  return opt
    .replace(/ apartment$/i, "")
    .replace(/^Show all items$/i, "Show all");
}

function AccommodationPrompt({
  onSelect,
  onSkip,
}: {
  onSelect: (value: AccommodationType) => void;
  onSkip: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center sm:px-4">
      <div
        className="w-full max-w-full rounded-t-2xl bg-white px-5 pt-4 pb-6 shadow-xl sm:max-w-lg sm:rounded-2xl sm:px-6 sm:pt-6 sm:pb-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drag handle — mobile only */}
        <div className="mb-4 flex justify-center sm:hidden">
          <div className="h-1 w-10 rounded-full bg-neutral-200" />
        </div>

        <h2 className="mb-1 text-sm font-semibold text-neutral-900">
          What&rsquo;s your space like?
        </h2>
        <p className="mb-5 text-xs text-neutral-500">
          We&rsquo;ll show you items that fit your space.
        </p>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {ACCOMMODATION_OPTIONS.map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => {
                try {
                  trackEvent("accommodation_selected", { accommodationType: opt });
                } catch {}
                onSelect(opt);
              }}
              className="min-h-[52px] rounded-xl border border-neutral-200 bg-white px-3 py-3 text-left text-xs font-semibold text-neutral-700 transition-all hover:border-neutral-400 hover:bg-neutral-50 active:scale-[0.98]"
            >
              {shortLabel(opt)}
            </button>
          ))}
        </div>

        <div className="mt-5 flex justify-center">
          <button
            type="button"
            onClick={onSkip}
            className="text-xs text-neutral-400 underline-offset-2 transition-colors hover:text-neutral-600 hover:underline"
          >
            Skip for now
          </button>
        </div>
      </div>
    </div>
  );
}
