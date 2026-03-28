"use client";

import Link from "next/link";
import { User, X } from "lucide-react";
import { Container } from "./Container";
import { useAccommodation } from "@/context/AccommodationContext";

export function Navbar() {
  const { accommodation, clear } = useAccommodation();

  const label =
    accommodation && accommodation !== "all" && accommodation !== "skipped"
      ? accommodation
      : null;

  return (
    <header className="bg-[#f5f5f3]">
      <Container className="flex items-center py-4">
        {/* Left: title + accommodation indicator */}
        <div className="flex flex-1 items-center justify-start gap-3 min-w-0">
          <span className="font-semibold text-base tracking-tight text-neutral-900">
            UrbanFlatKit
          </span>

          {label && (
            <span className="hidden items-center gap-1.5 text-[11px] text-neutral-400 sm:flex">
              Showing for{" "}
              <span className="font-medium text-neutral-600">{label}</span>
              <button
                type="button"
                onClick={clear}
                className="ml-0.5 inline-flex h-4 w-4 items-center justify-center rounded-full text-neutral-400 transition-colors hover:bg-neutral-200 hover:text-neutral-600"
                aria-label="Clear accommodation filter"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          )}
        </div>

        {/* Mobile: accommodation badge + admin icon */}
        <div className="flex flex-shrink-0 items-center gap-2 md:hidden">
          {label && (
            <button
              type="button"
              onClick={clear}
              className="flex items-center gap-1 rounded-full border border-neutral-200 bg-white px-2.5 py-1 text-[10px] text-neutral-500 shadow-sm"
            >
              {label}
              <X className="h-3 w-3" />
            </button>
          )}
          <Link
            href="/admin"
            aria-label="Admin"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-neutral-200 bg-white text-neutral-500 shadow-sm transition-colors hover:border-neutral-300 hover:bg-neutral-50"
          >
            <User className="h-4 w-4" />
          </Link>
        </div>

        {/* Desktop/tablet: admin button */}
        <div className="hidden min-w-0 flex-1 items-center justify-end md:flex">
          <Link
            href="/admin"
            className="inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-xs font-medium text-neutral-600 shadow-sm transition-colors hover:border-neutral-300 hover:bg-neutral-50"
          >
            <User className="h-3.5 w-3.5" />
            <span className="hidden lg:inline">Admin</span>
          </Link>
        </div>
      </Container>
    </header>
  );
}
