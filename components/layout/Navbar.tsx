"use client";

import Link from "next/link";
import { User } from "lucide-react";
import { Container } from "./Container";
import { useData } from "@/context/DataContext";
import { profileChipLabel } from "@/lib/studentUiMeta";

export function Navbar({ title = "StudentKit" }: { title?: string }) {
  const { studentProfile, openProfileModal } = useData();

  return (
    <header className="bg-[#f5f5f3]">
      <Container className="flex items-center py-4">
        <div className="flex min-w-0 flex-1 items-center justify-start gap-3">
          <span className="text-base font-semibold tracking-tight text-neutral-900">
            {title}
          </span>

          {studentProfile && (
            <>
              <button
                type="button"
                onClick={() => openProfileModal()}
                className="hidden max-w-[min(100%,280px)] truncate rounded-full border border-neutral-200 bg-white px-3 py-1 text-left text-[11px] font-medium text-neutral-600 shadow-sm transition-colors hover:border-neutral-300 hover:bg-neutral-50 sm:inline-block"
              >
                {profileChipLabel(studentProfile)}
              </button>
              <button
                type="button"
                onClick={() => openProfileModal()}
                className="max-w-[140px] truncate rounded-full border border-neutral-200 bg-white px-2.5 py-1 text-[10px] font-medium text-neutral-600 shadow-sm sm:hidden"
              >
                {profileChipLabel(studentProfile)}
              </button>
            </>
          )}
        </div>

        <div className="flex flex-shrink-0 items-center gap-2 md:hidden">
          <Link
            href="/admin"
            aria-label="Admin"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-neutral-200 bg-white text-neutral-500 shadow-sm transition-colors hover:border-neutral-300 hover:bg-neutral-50"
          >
            <User className="h-4 w-4" />
          </Link>
        </div>

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
