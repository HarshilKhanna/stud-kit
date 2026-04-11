"use client";

import Link from "next/link";
import { useData } from "@/context/DataContext";
import { profileChipLabel } from "@/lib/studentUiMeta";

export function Navbar() {
  const { studentProfile, openProfileModal } = useData();

  return (
    <header
      className="sticky top-0 z-50 border-b border-black/[0.04] bg-[#F9F9F9]/90 backdrop-blur-sm"
      style={{ fontFamily: "var(--font-sans-alt), Manrope, sans-serif" }}
    >
      <div className="flex w-full items-center justify-between px-4 py-3 sm:px-6 md:px-10 md:py-5">
        {/* Logo */}
        <Link
          href="/"
          className="text-sm font-bold tracking-tighter text-black"
          style={{ fontFamily: "var(--font-serif), serif" }}
        >
          STUDENTKIT
        </Link>

        {/* Right side */}
        <div className="flex items-center gap-3 sm:gap-4">
          {studentProfile && (
            <button
              type="button"
              onClick={() => openProfileModal()}
              className="max-w-[120px] truncate text-[10px] font-semibold uppercase tracking-[0.14em] text-neutral-400 transition-colors hover:text-black sm:max-w-none"
            >
              {profileChipLabel(studentProfile)}
            </button>
          )}
          <Link
            href="/admin/login"
            className="inline-flex min-h-[44px] items-center text-[11px] font-semibold uppercase tracking-[0.14em] text-neutral-500 transition-colors hover:text-black"
          >
            Admin →
          </Link>
        </div>
      </div>
    </header>
  );
}
