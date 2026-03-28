"use client";

import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { BrowseShell } from "@/components/browse/BrowseShell";

export default function BrowsePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main id="browse" className="flex-1">
        <BrowseShell />
      </main>
      <Footer />
    </div>
  );
}
