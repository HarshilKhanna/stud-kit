"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  ReactNode,
} from "react";

const STORAGE_KEY = "urbanflatkit_accommodation";

const ACCOMMODATION_TIER: Record<string, number> = {
  "PG / shared accommodation": 1,
  "Hostel room": 1,
  "Studio apartment": 1,
  "1 BHK apartment": 2,
  "Serviced apartment": 2,
  "Holiday home / Airbnb": 2,
  "2 BHK apartment": 3,
  "Independent floor": 3,
  "Row house": 3,
  "3 BHK apartment": 4,
  "Townhouse": 4,
  "Duplex apartment": 4,
  "4 BHK apartment": 5,
  "Penthouse": 5,
  "Bungalow": 5,
  "Villa": 5,
  Other: 3,
};

export const ACCOMMODATION_OPTIONS = [
  "Studio apartment",
  "1 BHK apartment",
  "2 BHK apartment",
  "3 BHK apartment",
  "4 BHK apartment",
  "Duplex apartment",
  "Penthouse",
  "Independent floor",
  "Row house",
  "Townhouse",
  "Bungalow",
  "Villa",
  "PG / shared accommodation",
  "Hostel room",
  "Serviced apartment",
  "Holiday home / Airbnb",
  "Other",
  "Show all items",
] as const;

export type AccommodationType = (typeof ACCOMMODATION_OPTIONS)[number];

interface AccommodationContextValue {
  accommodation: string | null;
  tier: number | null;
  promptNeeded: boolean;
  showPrompt: boolean;
  openPrompt: () => void;
  select: (value: AccommodationType) => void;
  dismiss: () => void;
  clear: () => void;
  fitsAccommodation: (item: {
    category: string;
    specs?: Record<string, string>;
  }) => boolean;
}

const AccommodationContext = createContext<AccommodationContextValue | null>(
  null,
);

function parseLargestDimension(dimStr: string): number | null {
  const nums = dimStr.match(/[\d.]+/g);
  if (!nums || nums.length === 0) return null;
  return Math.max(...nums.map(Number));
}

function tierRequiredForSize(cm: number): number {
  if (cm < 80) return 1;
  if (cm < 150) return 2;
  if (cm < 220) return 3;
  if (cm < 280) return 4;
  return 5;
}

export function AccommodationProvider({ children }: { children: ReactNode }) {
  const [accommodation, setAccommodation] = useState<string | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);

  // Rehydrate from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setAccommodation(saved);
    } catch {}
  }, []);

  const promptNeeded = accommodation === null;

  const openPrompt = useCallback(() => {
    if (accommodation === null) setShowPrompt(true);
  }, [accommodation]);

  const select = useCallback((value: AccommodationType) => {
    const stored = value === "Show all items" ? "all" : value;
    setAccommodation(stored);
    setShowPrompt(false);
    try { localStorage.setItem(STORAGE_KEY, stored); } catch {}
  }, []);

  const dismiss = useCallback(() => {
    setAccommodation("skipped");
    setShowPrompt(false);
    try { localStorage.setItem(STORAGE_KEY, "skipped"); } catch {}
  }, []);

  const clear = useCallback(() => {
    // User explicitly cleared the current accommodation badge.
    // Treat this the same as "Skip for now": remove the filter and
    // remember that we shouldn't prompt again in this browser.
    setAccommodation("skipped");
    setShowPrompt(false);
    try { localStorage.setItem(STORAGE_KEY, "skipped"); } catch {}
  }, []);

  const tier =
    accommodation === null || accommodation === "all" || accommodation === "skipped"
      ? null
      : ACCOMMODATION_TIER[accommodation] ?? 3;

  const fitsAccommodation = useCallback(
    (item: { category: string; specs?: Record<string, string> }) => {
      if (accommodation === null || accommodation === "all" || accommodation === "skipped") return true;

      const cat = item.category.toLowerCase();
      if (cat !== "furniture" && cat !== "appliances") return true;

      const dimStr = item.specs?.Dimensions;
      if (!dimStr) return true;

      const largest = parseLargestDimension(dimStr);
      if (largest === null) return true;

      const required = tierRequiredForSize(largest);
      const userTier = ACCOMMODATION_TIER[accommodation] ?? 3;
      return userTier >= required;
    },
    [accommodation],
  );

  return (
    <AccommodationContext.Provider
      value={{
        accommodation,
        tier,
        promptNeeded,
        showPrompt,
        openPrompt,
        select,
        dismiss,
        clear,
        fitsAccommodation,
      }}
    >
      {children}
    </AccommodationContext.Provider>
  );
}

export function useAccommodation(): AccommodationContextValue {
  const ctx = useContext(AccommodationContext);
  if (!ctx)
    throw new Error(
      "useAccommodation must be used inside <AccommodationProvider>",
    );
  return ctx;
}
