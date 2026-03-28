"use client";

import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
// import { Hero } from "@/components/ui/animated-hero";
import { BrowseShell } from "@/components/browse/BrowseShell";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      {/* Hero temporarily disabled; will be added back later */}
      {/* <Hero /> */}
      <main id="browse" className="flex-1">
        <BrowseShell />
      </main>
      <Footer />
    </div>
  );
}
