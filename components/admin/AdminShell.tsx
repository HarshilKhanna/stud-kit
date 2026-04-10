"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Menu } from "lucide-react";
import { useAdminAuth } from "@/context/AdminAuthContext";
import { AdminSidebar } from "./AdminSidebar";

export function AdminShell({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, authReady } = useAdminAuth();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!authReady) return;
    if (!isAuthenticated) router.replace("/admin/login");
  }, [authReady, isAuthenticated, router]);

  if (!authReady || !isAuthenticated) return null;

  return (
    <div
      className="flex h-screen overflow-hidden bg-[#F9F9F9]"
      style={{ fontFamily: "var(--font-sans-alt), Manrope, sans-serif" }}
    >
      <AdminSidebar mobileOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Mobile top bar */}
        <header className="flex flex-shrink-0 items-center gap-3 border-b border-neutral-100 bg-white px-5 py-3.5 md:hidden">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="flex h-8 w-8 items-center justify-center text-neutral-400 hover:text-neutral-800"
          >
            <Menu className="h-5 w-5" />
          </button>
          <p
            className="text-sm font-bold tracking-tight text-black"
            style={{ fontFamily: "var(--font-serif), serif" }}
          >
            StudentKit{" "}
            <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-neutral-400" style={{ fontFamily: "var(--font-sans-alt), sans-serif" }}>
              Admin
            </span>
          </p>
        </header>

        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-6xl px-6 py-8 md:px-10 md:py-10">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
