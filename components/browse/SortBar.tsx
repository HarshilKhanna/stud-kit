"use client";

import { ChevronDown } from "lucide-react";

export const SORT_OPTIONS = [
  { value: "featured", label: "Featured" },
  { value: "name-asc", label: "Name A–Z" },
  { value: "name-desc", label: "Name Z–A" },
  { value: "brand", label: "Brand" },
  { value: "category", label: "Category" },
] as const;

export type SortOption = (typeof SORT_OPTIONS)[number]["value"];

interface SortBarProps {
  value: SortOption;
  onChange: (value: SortOption) => void;
  count: number;
}

export function SortBar({ value, onChange, count }: SortBarProps) {
  const selectedLabel =
    SORT_OPTIONS.find((o) => o.value === value)?.label ?? "Featured";

  return (
    <div className="flex items-center justify-between">
      <p className="text-sm text-neutral-400">
        {count} {count === 1 ? "item" : "items"}
      </p>

      <div className="relative">
        <label className="flex cursor-pointer items-center gap-1.5 text-sm text-neutral-500 select-none">
          <span>Sort by:</span>
          <span className="font-semibold text-neutral-800">{selectedLabel}</span>
          <ChevronDown className="h-3.5 w-3.5 text-neutral-500" />
        </label>

        {/* Invisible native select sits on top for accessibility + click handling */}
        <select
          value={value}
          onChange={(e) => onChange(e.target.value as SortOption)}
          aria-label="Sort items"
          className="absolute inset-0 cursor-pointer opacity-0"
        >
          {SORT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
