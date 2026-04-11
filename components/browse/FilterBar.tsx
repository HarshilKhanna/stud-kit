"use client";

import React, { useRef, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Check, SlidersHorizontal, X } from "lucide-react";
import { SortOption, SORT_OPTIONS } from "./SortBar";
import type { Source } from "@/types";

/* ─── Data ───────────────────────────────────────────── */
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

export const BROWSE_CHIP_TO_ITEM_CATEGORIES: Record<
  BrowseCategoryChip,
  readonly string[]
> = {
  Bedding:            ["Bedding & Sleep"],
  Kitchen:            ["Kitchen & Cooking"],
  Clothing:           ["Clothing & Weather"],
  Electronics:        ["Electronics & Adapters"],
  Bathroom:           ["Bathroom & Toiletries"],
  Study:              ["Study & Desk"],
  "Food & Groceries": ["Food & Groceries (non-perishable Indian staples)"],
  Documents:          ["Documents & Admin"],
  Health:             ["Health & Medicine"],
  Comfort:            ["Comfort & Mental Health"],
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

export function shortCategoryLabel(itemCategory: string): string {
  for (const chip of BROWSE_CATEGORY_CHIPS) {
    if (BROWSE_CHIP_TO_ITEM_CATEGORIES[chip].includes(itemCategory)) return chip;
  }
  return itemCategory;
}

export type SourceFilter = "all" | Source;

const SOURCE_OPTIONS: { id: SourceFilter; label: string }[] = [
  { id: "all",              label: "All" },
  { id: "bring-from-india", label: "India" },
  { id: "buy-there",        label: "Local" },
];

/* ─── Props ──────────────────────────────────────────── */
interface FilterBarProps {
  activeBrowseChips: BrowseCategoryChip[];
  onBrowseChipsChange: (chips: BrowseCategoryChip[]) => void;
  sourceFilter: SourceFilter;
  onSourceChange: (s: SourceFilter) => void;
  sort: SortOption;
  onSortChange: (value: SortOption) => void;
  itemCount?: number;
}

/* ─── Sort dropdown ──────────────────────────────────── */
function SortDropdown({
  sort,
  onSortChange,
}: {
  sort: SortOption;
  onSortChange: (v: SortOption) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const label = SORT_OPTIONS.find((o) => o.value === sort)?.label ?? "Featured";

  useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [open]);

  return (
    <div ref={ref} className="relative flex-shrink-0">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-neutral-400 transition-colors hover:text-black select-none"
        style={{ fontFamily: "var(--font-sans-alt), sans-serif" }}
      >
        <span>Sort: {label}</span>
        <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.18 }} className="flex">
          <ChevronDown className="h-3 w-3" />
        </motion.span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full z-50 mt-2 w-44 overflow-hidden border border-neutral-100 bg-white py-1 shadow-lg"
          >
            {SORT_OPTIONS.map((opt) => {
              const active = sort === opt.value;
              return (
                <button
                  key={opt.value}
                  onClick={() => { onSortChange(opt.value); setOpen(false); }}
                  className="flex w-full items-center justify-between px-4 py-2.5 text-[11px] text-neutral-700 hover:bg-neutral-50"
                >
                  <span className={active ? "font-semibold text-black" : ""}>{opt.label}</span>
                  {active && <Check className="h-3 w-3 text-neutral-500" />}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─── Mobile sheet ───────────────────────────────────── */
function MobileSheet({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-end bg-black/40 backdrop-blur-sm"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      transition={{ duration: 0.14 }}
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        className="max-h-[85vh] w-full overflow-y-auto rounded-t-2xl bg-white"
        initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
        transition={{ type: "spring", stiffness: 340, damping: 38 }}
      >
        <div className="flex justify-center pt-3 pb-1">
          <div className="h-1 w-10 rounded-full bg-neutral-200" />
        </div>
        <div className="flex items-center justify-between px-5 py-3">
          <span className="text-base font-semibold text-neutral-900">{title}</span>
          <button onClick={onClose} className="flex h-11 w-11 items-center justify-center rounded-full bg-neutral-100 text-neutral-500 hover:bg-neutral-200">
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

/* ─── Mobile filter sheet ────────────────────────────── */
function MobileFilterSheet({
  activeBrowseChips, onBrowseChipsChange,
  sourceFilter, onSourceChange,
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
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-neutral-400">Source</p>
        {SOURCE_OPTIONS.map((opt) => {
          const checked = sourceFilter === opt.id;
          return (
            <button key={opt.id} type="button" onClick={() => onSourceChange(opt.id)}
              className="flex min-h-[44px] w-full items-center gap-3 py-2">
              <span className={["flex h-5 w-5 flex-shrink-0 items-center justify-center rounded border transition-colors", checked ? "border-black bg-black" : "border-neutral-300"].join(" ")}>
                {checked && <Check className="h-3 w-3 text-white" />}
              </span>
              <span className="text-sm font-medium text-neutral-800">{opt.label}</span>
            </button>
          );
        })}

        <p className="mb-2 mt-4 text-[11px] font-semibold uppercase tracking-[0.14em] text-neutral-400">Category</p>
        <button onClick={() => onBrowseChipsChange([])} className="flex min-h-[44px] w-full items-center gap-3 py-2">
          <span className={["flex h-5 w-5 items-center justify-center rounded border transition-colors", allSelected ? "border-black bg-black" : "border-neutral-300"].join(" ")}>
            {allSelected && <Check className="h-3 w-3 text-white" />}
          </span>
          <span className="text-sm font-medium text-neutral-800">All</span>
        </button>
        {BROWSE_CATEGORY_CHIPS.map((cat) => {
          const checked = activeBrowseChips.includes(cat);
          return (
            <button key={cat} type="button" onClick={() => onBrowseChipsChange(checked ? [] : [cat])}
              className="flex min-h-[44px] w-full items-center gap-3 py-2">
              <span className={["flex h-5 w-5 flex-shrink-0 items-center justify-center rounded border transition-colors", checked ? "border-black bg-black" : "border-neutral-300"].join(" ")}>
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

/* ─── Mobile sort sheet ──────────────────────────────── */
function MobileSortSheet({ sort, onSortChange, onClose }: { sort: SortOption; onSortChange: (v: SortOption) => void; onClose: () => void; }) {
  return (
    <MobileSheet title="Sort by" onClose={onClose}>
      <div className="px-5 pt-4 pb-2">
        {SORT_OPTIONS.map((opt) => {
          const active = sort === opt.value;
          return (
            <button key={opt.value} onClick={() => { onSortChange(opt.value); onClose(); }}
              className="flex min-h-[44px] w-full items-center justify-between py-2 text-sm text-neutral-700">
              <span className={active ? "font-semibold text-black" : ""}>{opt.label}</span>
              {active && <Check className="h-3.5 w-3.5 text-neutral-500" />}
            </button>
          );
        })}
      </div>
    </MobileSheet>
  );
}

/* ─── Main FilterBar ─────────────────────────────────── */
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
  const activeCount = activeBrowseChips.length + (sourceFilter !== "all" ? 1 : 0);
  const isAllChips = activeBrowseChips.length === 0;

  const tabClass = (active: boolean) =>
    [
      "flex-shrink-0 pb-2 text-[11px] font-semibold uppercase tracking-[0.14em] transition-colors whitespace-nowrap",
      active
        ? "border-b border-black text-black"
        : "text-neutral-600 hover:text-neutral-800",
    ].join(" ");

  const sourceTabClass = (active: boolean) =>
    [
      "flex-shrink-0 text-[10px] font-semibold uppercase tracking-[0.14em] transition-colors",
      active ? "text-black" : "text-neutral-600 hover:text-neutral-800",
    ].join(" ");

  return (
    <>
      <div
        className="sticky top-[54px] z-20 border-b border-neutral-200/60 bg-[#F9F9F9] sm:top-[56px] md:top-[62px]"
        style={{ fontFamily: "var(--font-sans-alt), sans-serif" }}
      >
        {/* ── Desktop ── */}
        <div className="hidden px-5 md:block md:px-8">
          <div className="flex items-end gap-6 pt-4 pb-0">
            {/* Category tabs */}
            <div
              className="flex min-w-0 flex-1 items-end gap-6 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
              style={{ WebkitOverflowScrolling: "touch" }}
            >
              <button type="button" onClick={() => onBrowseChipsChange([])} className={tabClass(isAllChips)}>
                All Items
              </button>
              {BROWSE_CATEGORY_CHIPS.map((cat) => {
                const active = !isAllChips && activeBrowseChips.includes(cat);
                return (
                  <button key={cat} type="button" onClick={() => onBrowseChipsChange([cat])} className={tabClass(active)}>
                    {cat}
                  </button>
                );
              })}
            </div>

            {/* Source filter + sort — right side */}
            <div className="flex flex-shrink-0 items-center gap-4 pb-2">
              <div className="flex items-center gap-2">
                <span className="text-[9px] font-semibold uppercase tracking-[0.16em] text-neutral-500">
                  Source:
                </span>
                {SOURCE_OPTIONS.map((opt, i) => (
                  <React.Fragment key={opt.id}>
                    {i > 0 && <span className="text-neutral-200 text-[10px]">·</span>}
                    <button type="button" onClick={() => onSourceChange(opt.id)} className={sourceTabClass(sourceFilter === opt.id)}>
                      {opt.label}
                    </button>
                  </React.Fragment>
                ))}
              </div>
              <div className="h-3 w-px bg-neutral-200" />
              <SortDropdown sort={sort} onSortChange={onSortChange} />
            </div>
          </div>
        </div>

        {/* ── Mobile ── */}
        <div className="flex items-center gap-2 px-5 py-3 md:hidden">
          <button
            type="button"
            onClick={() => setFilterOpen(true)}
            className="flex min-h-[40px] items-center gap-1.5 rounded-full border border-neutral-200 bg-white px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-neutral-600 shadow-sm"
          >
            <SlidersHorizontal className="h-3 w-3" />
            Filter
            {activeCount > 0 && (
              <span className="flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-black px-1 text-[9px] font-bold text-white">
                {activeCount}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => setSortOpen(true)}
            className="flex min-h-[40px] items-center gap-1.5 rounded-full border border-neutral-200 bg-white px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-neutral-600 shadow-sm"
          >
            <ChevronDown className="h-3 w-3 text-neutral-400" />
            {SORT_OPTIONS.find((o) => o.value === sort)?.label ?? "Sort"}
          </button>
        </div>
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
          <MobileSortSheet sort={sort} onSortChange={onSortChange} onClose={() => setSortOpen(false)} />
        )}
      </AnimatePresence>
    </>
  );
}

export { FILTER_CATEGORIES as CATEGORIES };
