"use client";

import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { BrowseShell } from "@/components/browse/BrowseShell";

export default function BrowsePage() {
  return (
    <div className="flex min-h-screen flex-col bg-[#F9F9F9]">
      <Navbar />
      <main className="flex-1">
        <BrowseShell />
      </main>
      <Footer />
    </div>
  );
}
