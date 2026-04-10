"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutGrid, Package, BarChart2, ArrowLeft, LogOut, X } from "lucide-react";
import { useAdminAuth } from "@/context/AdminAuthContext";

const NAV = [
  { href: "/admin/dashboard",       label: "Dashboard",   icon: LayoutGrid },
  { href: "/admin/items",           label: "Items",       icon: Package    },
  { href: "/admin/analytics",       label: "Analytics",   icon: BarChart2  },
];

interface AdminSidebarProps {
  mobileOpen?: boolean;
  onClose?: () => void;
}

export function AdminSidebar({ mobileOpen = false, onClose }: AdminSidebarProps) {
  const pathname = usePathname();
  const { logout } = useAdminAuth();

  const sidebarContent = (
    <aside
      className="flex h-full w-48 flex-shrink-0 flex-col border-r border-neutral-100 bg-white"
      style={{ fontFamily: "var(--font-sans-alt), Manrope, sans-serif" }}
    >
      {/* Brand */}
      <div className="flex items-start justify-between border-b border-neutral-100 px-5 pb-5 pt-6">
        <div>
          <p
            className="text-sm font-bold tracking-tight text-black"
            style={{ fontFamily: "var(--font-serif), serif" }}
          >
            StudentKit
          </p>
          <p className="mt-0.5 text-[9px] font-semibold uppercase tracking-[0.2em] text-neutral-400">
            Academic Monograph
          </p>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="md:hidden -mr-1 -mt-0.5 flex h-7 w-7 items-center justify-center text-neutral-400 hover:text-neutral-700"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 pt-1">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              onClick={onClose}
              className={[
                "flex items-center gap-3 px-3 py-2.5 transition-colors",
                active
                  ? "border-l-2 border-black pl-[10px] text-black"
                  : "text-neutral-600 hover:text-black",
              ].join(" ")}
            >
              <Icon className="h-3.5 w-3.5 flex-shrink-0" />
              <span
                className={[
                  "text-[11px] uppercase tracking-[0.16em]",
                  active ? "font-bold" : "font-semibold",
                ].join(" ")}
              >
                {label}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* Bottom actions */}
      <div className="border-t border-neutral-100 px-3 pb-6 pt-3">
        <Link
          href="/browse"
          onClick={onClose}
          className="flex items-center gap-3 px-3 py-2.5 text-neutral-600 transition-colors hover:text-black"
        >
          <ArrowLeft className="h-3.5 w-3.5 flex-shrink-0" />
          <span className="text-[11px] font-semibold uppercase tracking-[0.16em]">
            Back to browse
          </span>
        </Link>
        <button
          type="button"
          onClick={() => { logout(); onClose?.(); }}
          className="flex w-full items-center gap-3 px-3 py-2.5 text-neutral-400 transition-colors hover:text-neutral-800"
        >
          <LogOut className="h-3.5 w-3.5 flex-shrink-0" />
          <span className="text-[11px] font-semibold uppercase tracking-[0.16em]">
            Logout
          </span>
        </button>
      </div>
    </aside>
  );

  return (
    <>
      {/* Desktop */}
      <div className="hidden h-screen flex-shrink-0 md:flex">{sidebarContent}</div>

      {/* Mobile drawer */}
      <div
        className={`md:hidden fixed inset-0 z-50 transition-opacity duration-300 ${
          mobileOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
        }`}
      >
        <div className="absolute inset-0 bg-black/30" onClick={onClose} />
        <div
          className={`absolute left-0 top-0 h-full transition-transform duration-300 ease-out ${
            mobileOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          {sidebarContent}
        </div>
      </div>
    </>
  );
}
