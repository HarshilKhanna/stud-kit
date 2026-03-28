"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Package, BarChart2, ArrowLeft, LogOut, X } from "lucide-react";
import { useAdminAuth } from "@/context/AdminAuthContext";

const NAV = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/items", label: "Items", icon: Package },
  { href: "/admin/analytics", label: "Analytics", icon: BarChart2 },
];

interface AdminSidebarProps {
  /** Mobile-only: whether the drawer is open */
  mobileOpen?: boolean;
  /** Called when the user dismisses the sidebar on mobile */
  onClose?: () => void;
}

export function AdminSidebar({ mobileOpen = false, onClose }: AdminSidebarProps) {
  const pathname = usePathname();
  const { logout } = useAdminAuth();

  const sidebarContent = (
    <aside className="flex h-full w-60 flex-shrink-0 flex-col border-r border-neutral-200 bg-white">
      {/* Logo row — includes close button on mobile */}
      <div className="flex items-start justify-between px-5 pt-6 pb-4 border-b border-neutral-100">
        <div>
          <p className="text-sm font-semibold tracking-tight text-neutral-900">UrbanFlatKit</p>
          <p className="text-[11px] text-neutral-400 font-light mt-0.5">Admin</p>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="md:hidden flex h-7 w-7 items-center justify-center rounded-md text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700 -mt-0.5 -mr-1"
            aria-label="Close menu"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 pt-4 space-y-0.5">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              onClick={onClose}
              className={`flex items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors ${
                active
                  ? "border-l-2 border-neutral-900 pl-[10px] font-medium text-neutral-900 bg-neutral-50"
                  : "font-normal text-neutral-500 hover:bg-neutral-50 hover:text-neutral-800"
              }`}
            >
              <Icon className="h-4 w-4 flex-shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Bottom links */}
      <div className="px-3 pb-5 pt-3 border-t border-neutral-100 space-y-0.5">
        <Link
          href="/"
          onClick={onClose}
          className="flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-normal text-neutral-500 transition-colors hover:bg-neutral-50 hover:text-neutral-800"
        >
          <ArrowLeft className="h-4 w-4 flex-shrink-0" />
          Back to browse
        </Link>
        <button
          type="button"
          onClick={() => { logout(); onClose?.(); }}
          className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm font-normal text-neutral-400 transition-colors hover:bg-neutral-50 hover:text-neutral-700"
        >
          <LogOut className="h-4 w-4 flex-shrink-0" />
          Logout
        </button>
      </div>
    </aside>
  );

  return (
    <>
      {/* Desktop — always visible */}
      <div className="hidden md:flex h-screen flex-shrink-0">
        {sidebarContent}
      </div>

      {/* Mobile — slide-in drawer with backdrop */}
      <div
        className={`md:hidden fixed inset-0 z-50 transition-opacity duration-300 ${
          mobileOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
        }`}
      >
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-black/30"
          onClick={onClose}
        />
        {/* Panel */}
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
