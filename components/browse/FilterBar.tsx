"use client";

import React, { useRef, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronDown,
  Check,
  LayoutGrid,
  SlidersHorizontal,
  X,
  Package,
  MapPin,
} from "lucide-react";
import { type LucideIcon } from "lucide-react";
import { SortOption, SORT_OPTIONS } from "./SortBar";
import { Container } from "@/components/layout/Container";
import type { Source } from "@/types";

/** Canonical `Item.category` values (admin, data, dashboard). */
export const FILTER_CATEGORIES = [
  "Bedding & Sleep",
  "Kitchen & Cooking",
  "Clothing & Weather",
  "Electronics & Adapters",
  "Bathroom & Toiletries",
  "Study & Desk",
  "Food & Groceries (non-perishable Indian staples)",
  "Documents & Admin",
  "Health & Medicine",
  "Comfort & Mental Health",
] as const;

export type Category = (typeof FILTER_CATEGORIES)[number];

/** Short labels for browse filter chips only. */
export const BROWSE_CATEGORY_CHIPS = [
  "Bedding",
  "Kitchen",
  "Clothing",
  "Electronics",
  "Bathroom",
  "Study",
  "Food & Groceries",
  "Documents",
  "Health",
  "Comfort",
] as const;

export type BrowseCategoryChip = (typeof BROWSE_CATEGORY_CHIPS)[number];

/** Maps browse/admin short labels to canonical `Item.category` strings. */
export const BROWSE_CHIP_TO_ITEM_CATEGORIES: Record<
  BrowseCategoryChip,
  readonly string[]
> = {
  Bedding: ["Bedding & Sleep"],
  Kitchen: ["Kitchen & Cooking"],
  Clothing: ["Clothing & Weather"],
  Electronics: ["Electronics & Adapters"],
  Bathroom: ["Bathroom & Toiletries"],
  Study: ["Study & Desk"],
  "Food & Groceries": ["Food & Groceries (non-perishable Indian staples)"],
  Documents: ["Documents & Admin"],
  Health: ["Health & Medicine"],
  Comfort: ["Comfort & Mental Health"],
};

export function itemCategoryMatchesBrowseChips(
  itemCategory: string,
  activeChips: BrowseCategoryChip[],
): boolean {
  if (activeChips.length === 0) return true;
  return activeChips.some((chip) =>
    BROWSE_CHIP_TO_ITEM_CATEGORIES[chip].includes(itemCategory),
  );
}

/** Short dashboard/browse label for a stored category, or the raw value if unknown. */
export function shortCategoryLabel(itemCategory: string): string {
  for (const chip of BROWSE_CATEGORY_CHIPS) {
    if (BROWSE_CHIP_TO_ITEM_CATEGORIES[chip].includes(itemCategory)) {
      return chip;
    }
  }
  return itemCategory;
}

export type SourceFilter = "all" | Source;

const SOURCE_OPTIONS: { id: SourceFilter; label: string; icon: LucideIcon }[] = [
  { id: "all", label: "All sources", icon: LayoutGrid },
  { id: "bring-from-india", label: "Bring from India", icon: Package },
  { id: "buy-there", label: "Buy there", icon: MapPin },
];

const chipBtn = (active: boolean) =>
  [
    "flex flex-shrink-0 items-center rounded-full border px-3 py-1 text-sm font-medium transition-all duration-150 whitespace-nowrap",
    active
      ? "border-neutral-300 bg-white text-neutral-900 shadow-sm"
      : "border-neutral-200 text-neutral-500 hover:border-neutral-300 hover:bg-neutral-100 hover:text-neutral-700",
  ].join(" ");

const sourceChipBtn = (active: boolean) =>
  [
    "flex flex-shrink-0 items-center gap-1.5 rounded-full border px-3 py-1 text-sm font-medium transition-all duration-150 whitespace-nowrap",
    active
      ? "border-neutral-300 bg-white text-neutral-900 shadow-sm"
      : "border-neutral-200 text-neutral-500 hover:border-neutral-300 hover:bg-neutral-100 hover:text-neutral-700",
  ].join(" ");

interface FilterBarProps {
  activeBrowseChips: BrowseCategoryChip[];
  onBrowseChipsChange: (chips: BrowseCategoryChip[]) => void;
  sourceFilter: SourceFilter;
  onSourceChange: (s: SourceFilter) => void;
  sort: SortOption;
  onSortChange: (value: SortOption) => void;
}

function DesktopChips({
  activeBrowseChips,
  onBrowseChipsChange,
  sourceFilter,
  onSourceChange,
}: {
  activeBrowseChips: BrowseCategoryChip[];
  onBrowseChipsChange: (chips: BrowseCategoryChip[]) => void;
  sourceFilter: SourceFilter;
  onSourceChange: (s: SourceFilter) => void;
}) {
  const isAll = activeBrowseChips.length === 0;

  return (
    <div className="hidden min-w-0 flex-1 flex-col gap-2 md:flex">
      <div
        className="-mx-1 flex flex-nowrap items-center gap-1 overflow-x-auto px-1 pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        style={{ WebkitOverflowScrolling: "touch" }}
      >
        <button
          type="button"
          onClick={() => onBrowseChipsChange([])}
          className={chipBtn(isAll)}
        >
          All
        </button>
        {BROWSE_CATEGORY_CHIPS.map((cat) => {
          const active = !isAll && activeBrowseChips.includes(cat);
          return (
            <button
              key={cat}
              type="button"
              onClick={() => onBrowseChipsChange([cat])}
              className={chipBtn(active)}
            >
              {cat}
            </button>
          );
        })}
      </div>

      <div
        className="-mx-1 flex flex-nowrap items-center gap-1 overflow-x-auto border-t border-neutral-200/60 px-1 pt-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        style={{ WebkitOverflowScrolling: "touch" }}
      >
        <span className="flex-shrink-0 pr-1 text-[11px] font-medium uppercase tracking-[0.12em] text-neutral-400">
          Source
        </span>
        {SOURCE_OPTIONS.map((opt) => {
          const active = sourceFilter === opt.id;
          const Icon = opt.icon;
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => onSourceChange(opt.id)}
              className={sourceChipBtn(active)}
            >
              <Icon className="h-3 w-3 flex-shrink-0" />
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function SortDropdown({
  sort,
  onSortChange,
  label = true,
}: {
  sort: SortOption;
  onSortChange: (v: SortOption) => void;
  label?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selectedLabel = SORT_OPTIONS.find((o) => o.value === sort)?.label ?? "Featured";

  useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const h = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, [open]);

  return (
    <div ref={ref} className="relative flex-shrink-0">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1 text-sm select-none text-neutral-500 transition-colors hover:text-neutral-700"
      >
        {label && <span>Sort by:</span>}
        <span className="font-semibold text-neutral-800">{selectedLabel}</span>
        <motion.span
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.18 }}
          className="flex items-center"
        >
          <ChevronDown className="h-3.5 w-3.5 text-neutral-400" />
        </motion.span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.97, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: -4 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="absolute right-0 top-full z-50 mt-2 w-48 overflow-hidden rounded-xl border border-neutral-100 bg-white py-1 shadow-lg"
          >
            {SORT_OPTIONS.map((opt) => {
              const active = sort === opt.value;
              return (
                <button
                  key={opt.value}
                  onClick={() => {
                    onSortChange(opt.value);
                    setOpen(false);
                  }}
                  className="flex w-full items-center justify-between px-4 py-2.5 text-sm text-neutral-700 transition-colors hover:bg-neutral-50"
                >
                  <span className={active ? "font-medium text-neutral-900" : ""}>{opt.label}</span>
                  {active && <Check className="h-3.5 w-3.5 text-neutral-500" />}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function MobileSheet({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, [onClose]);

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-end bg-black/40 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.14 }}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <motion.div
        className="max-h-[85vh] w-full overflow-y-auto rounded-t-2xl bg-white"
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", stiffness: 340, damping: 38 }}
      >
        <div className="flex justify-center pt-3 pb-1">
          <div className="h-1 w-10 rounded-full bg-neutral-200" />
        </div>
        <div className="flex items-center justify-between px-5 py-3">
          <span className="text-base font-semibold text-neutral-900">{title}</span>
          <button
            onClick={onClose}
            className="flex h-11 w-11 items-center justify-center rounded-full bg-neutral-100 text-neutral-500 hover:bg-neutral-200"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="h-px bg-neutral-100" />
        {children}
        <div className="pb-6" />
      </motion.div>
    </motion.div>
  );
}

function MobileFilterSheet({
  activeBrowseChips,
  onBrowseChipsChange,
  sourceFilter,
  onSourceChange,
  onClose,
}: {
  activeBrowseChips: BrowseCategoryChip[];
  onBrowseChipsChange: (chips: BrowseCategoryChip[]) => void;
  sourceFilter: SourceFilter;
  onSourceChange: (s: SourceFilter) => void;
  onClose: () => void;
}) {
  const allSelected = activeBrowseChips.length === 0;

  return (
    <MobileSheet title="Filter" onClose={onClose}>
      <div className="px-5 pt-4 pb-2">
        <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.12em] text-neutral-400">
          Source
        </p>
        {SOURCE_OPTIONS.map((opt) => {
          const checked = sourceFilter === opt.id;
          const Icon = opt.icon;
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => onSourceChange(opt.id)}
              className="flex min-h-[44px] w-full items-center gap-3 py-2"
            >
              <span
                className={[
                  "flex h-5 w-5 flex-shrink-0 items-center justify-center rounded border transition-colors",
                  checked ? "border-neutral-900 bg-neutral-900" : "border-neutral-300",
                ].join(" ")}
              >
                {checked && <Check className="h-3 w-3 text-white" />}
              </span>
              <span className="flex items-center gap-2 text-sm font-medium text-neutral-800">
                <Icon className="h-4 w-4 text-neutral-500" /> {opt.label}
              </span>
            </button>
          );
        })}

        <p className="mb-2 mt-4 text-[11px] font-medium uppercase tracking-[0.12em] text-neutral-400">
          Category
        </p>
        <button
          onClick={() => onBrowseChipsChange([])}
          className="flex min-h-[44px] w-full items-center gap-3 py-2"
        >
          <span
            className={[
              "flex h-5 w-5 items-center justify-center rounded border transition-colors",
              allSelected ? "border-neutral-900 bg-neutral-900" : "border-neutral-300",
            ].join(" ")}
          >
            {allSelected && <Check className="h-3 w-3 text-white" />}
          </span>
          <span className="text-sm font-medium text-neutral-800">All</span>
        </button>

        {BROWSE_CATEGORY_CHIPS.map((cat) => {
          const checked = activeBrowseChips.includes(cat);
          return (
            <button
              key={cat}
              type="button"
              onClick={() => onBrowseChipsChange(checked ? [] : [cat])}
              className="flex min-h-[44px] w-full items-center gap-3 py-2"
            >
              <span
                className={[
                  "flex h-5 w-5 flex-shrink-0 items-center justify-center rounded border transition-colors",
                  checked ? "border-neutral-900 bg-neutral-900" : "border-neutral-300",
                ].join(" ")}
              >
                {checked && <Check className="h-3 w-3 text-white" />}
              </span>
              <span className="min-w-0 text-left text-sm font-medium text-neutral-800">{cat}</span>
            </button>
          );
        })}
      </div>
    </MobileSheet>
  );
}

function MobileSortSheet({
  sort,
  onSortChange,
  onClose,
}: {
  sort: SortOption;
  onSortChange: (v: SortOption) => void;
  onClose: () => void;
}) {
  return (
    <MobileSheet title="Sort by" onClose={onClose}>
      <div className="px-5 pt-4 pb-2">
        {SORT_OPTIONS.map((opt) => {
          const active = sort === opt.value;
          return (
            <button
              key={opt.value}
              onClick={() => {
                onSortChange(opt.value);
                onClose();
              }}
              className="flex min-h-[44px] w-full items-center justify-between py-2 text-sm text-neutral-700"
            >
              <span className={active ? "font-medium text-neutral-900" : ""}>{opt.label}</span>
              {active && <Check className="h-3.5 w-3.5 text-neutral-500" />}
            </button>
          );
        })}
      </div>
    </MobileSheet>
  );
}

export function FilterBar({
  activeBrowseChips,
  onBrowseChipsChange,
  sourceFilter,
  onSourceChange,
  sort,
  onSortChange,
}: FilterBarProps) {
  const [filterOpen, setFilterOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);
  const activeCount =
    activeBrowseChips.length + (sourceFilter !== "all" ? 1 : 0);
  const sortLabel = SORT_OPTIONS.find((o) => o.value === sort)?.label ?? "Featured";

  return (
    <>
      <div className="sticky top-0 z-20 border-b border-neutral-200/70 bg-[#f5f5f3]">
        <Container>
          <div className="flex flex-col gap-2 py-2 md:flex-row md:items-start">
            <DesktopChips
              activeBrowseChips={activeBrowseChips}
              onBrowseChipsChange={onBrowseChipsChange}
              sourceFilter={sourceFilter}
              onSourceChange={onSourceChange}
            />

            <div className="flex flex-1 items-center gap-2 md:hidden">
              <button
                type="button"
                onClick={() => setFilterOpen(true)}
                className="flex min-h-[44px] items-center gap-1.5 rounded-full border border-neutral-200 bg-white px-3.5 py-1.5 text-sm font-medium text-neutral-700 shadow-sm transition-colors hover:bg-neutral-50"
              >
                <SlidersHorizontal className="h-3.5 w-3.5" />
                Filter
                {activeCount > 0 && (
                  <span className="flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-neutral-900 px-1 text-[10px] font-semibold text-white">
                    {activeCount}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setSortOpen(true)}
                className="flex min-h-[44px] items-center gap-1.5 rounded-full border border-neutral-200 bg-white px-3.5 py-1.5 text-sm font-medium text-neutral-700 shadow-sm transition-colors hover:bg-neutral-50"
              >
                <ChevronDown className="h-3.5 w-3.5 text-neutral-400" />
                <span className="font-semibold">{sortLabel}</span>
              </button>
            </div>

            <div className="hidden flex-shrink-0 md:block md:pt-0.5">
              <SortDropdown sort={sort} onSortChange={onSortChange} />
            </div>
          </div>
        </Container>
      </div>

      <AnimatePresence>
        {filterOpen && (
          <MobileFilterSheet
            activeBrowseChips={activeBrowseChips}
            onBrowseChipsChange={onBrowseChipsChange}
            sourceFilter={sourceFilter}
            onSourceChange={onSourceChange}
            onClose={() => setFilterOpen(false)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {sortOpen && (
          <MobileSortSheet
            sort={sort}
            onSortChange={onSortChange}
            onClose={() => setSortOpen(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
}

export { FILTER_CATEGORIES as CATEGORIES };
