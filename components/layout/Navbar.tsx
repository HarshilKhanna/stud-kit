"use client";

import Link from "next/link";
import { useData } from "@/context/DataContext";
import { profileChipLabel } from "@/lib/studentUiMeta";

export function Navbar() {
  const { studentProfile, openProfileModal } = useData();

  return (
    <header
      className="sticky top-0 z-50 flex items-center justify-between bg-[#F9F9F9] px-8 py-5"
      style={{ fontFamily: "var(--font-sans-alt), Manrope, sans-serif" }}
    >
      {/* Logo */}
      <Link
        href="/"
        className="text-sm font-bold tracking-tighter text-black"
        style={{ fontFamily: "var(--font-serif), serif" }}
      >
        STUDENTKIT
      </Link>


      {/* Right side */}
      <div className="flex items-center gap-4">
        {studentProfile && (
          <button
            type="button"
            onClick={() => openProfileModal()}
            className="hidden text-[10px] font-semibold uppercase tracking-[0.14em] text-neutral-400 transition-colors hover:text-black md:block"
          >
            {profileChipLabel(studentProfile)}
          </button>
        )}
        <Link
          href="/admin/login"
          className="text-[11px] font-semibold uppercase tracking-[0.14em] text-neutral-500 transition-colors hover:text-black"
        >
          Admin →
        </Link>
      </div>
    </header>
  );
}
