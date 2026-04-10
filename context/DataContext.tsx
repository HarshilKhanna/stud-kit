"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
  useCallback,
  ReactNode,
} from "react";
import type { Item, Tower, StudentProfile } from "@/types";
import {
  addItem as fsAddItem,
  updateItem as fsUpdateItem,
  deleteItem as fsDeleteItem,
  subscribeAllItems,
} from "@/lib/firestore";

const PROFILE_KEY = "studentkit_profile_v1";

const PRIORITY_ORDER: Record<string, number> = {
  "day-1": 0,
  "week-1": 1,
  "month-1": 2,
  optional: 3,
};

export interface DataContextValue {
  data: Tower;
  /** Full catalogue (flattened), sorted by priority then name */
  items: Item[];
  /** Profile-filtered + sorted */
  filteredItems: Item[];
  loading: boolean;
  hydrated: boolean;
  studentProfile: StudentProfile | null;
  setStudentProfile: (p: StudentProfile | null) => void;
  profileModalOpen: boolean;
  openProfileModal: () => void;
  closeProfileModal: () => void;
  addItem: (item: Item) => void;
  updateItem: (id: string, patch: Partial<Item>) => void;
  deleteItem: (id: string) => void;
}

const DataContext = createContext<DataContextValue | null>(null);

function toTower(items: Item[]): Tower {
  return { flats: [{ rooms: [{ items }] }] };
}

export function flattenTower(tower: Tower): Item[] {
  return tower.flats.flatMap((f) => f.rooms.flatMap((r) => r.items));
}

function matchesProfile(item: Item, p: StudentProfile): boolean {
  return (
    item.relevantRegions.includes(p.region) &&
    item.relevantAccommodations.includes(p.accommodation) &&
    item.budgetTiers.includes(p.budget)
  );
}

function sortByPriorityThenName(items: Item[]): Item[] {
  return [...items].sort((a, b) => {
    const pa = PRIORITY_ORDER[a.priority] ?? 99;
    const pb = PRIORITY_ORDER[b.priority] ?? 99;
    if (pa !== pb) return pa - pb;
    return a.name.localeCompare(b.name);
  });
}

function safeParseProfile(raw: string | null): StudentProfile | null {
  if (!raw) return null;
  try {
    const o = JSON.parse(raw) as Partial<StudentProfile>;
    if (
      typeof o.region === "string" &&
      typeof o.accommodation === "string" &&
      typeof o.arrivalTiming === "string" &&
      typeof o.budget === "string"
    ) {
      return o as StudentProfile;
    }
  } catch {
    /* ignore */
  }
  return null;
}

export function DataProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<Tower>(toTower([]));
  const [loading, setLoading] = useState(true);
  const [hydrated, setHydrated] = useState(false);
  const [studentProfile, setStudentProfileState] = useState<StudentProfile | null>(null);
  const [profileModalOpen, setProfileModalOpen] = useState(false);

  // Real-time Firestore subscription
  useEffect(() => {
    const unsubscribe = subscribeAllItems(
      (items) => {
        setData(toTower(items));
        setLoading(false);
        setHydrated(true);
      },
      (err) => {
        console.error("[DataContext] Firestore subscription error:", err);
        setLoading(false);
        setHydrated(true);
      },
    );
    return unsubscribe;
  }, []);

  // Student profile persisted in localStorage only
  useEffect(() => {
    if (typeof window === "undefined") return;
    setStudentProfileState(safeParseProfile(localStorage.getItem(PROFILE_KEY)));
  }, []);

  const setStudentProfile = useCallback((p: StudentProfile | null) => {
    setStudentProfileState(p);
    try {
      if (p) localStorage.setItem(PROFILE_KEY, JSON.stringify(p));
      else localStorage.removeItem(PROFILE_KEY);
    } catch (e) {
      console.error("StudentKit profile persist failed:", e);
    }
  }, []);

  const openProfileModal = useCallback(() => setProfileModalOpen(true), []);
  const closeProfileModal = useCallback(() => setProfileModalOpen(false), []);

  const items = useMemo(
    () => sortByPriorityThenName(flattenTower(data)),
    [data],
  );

  const filteredItems = useMemo(() => {
    const flat = flattenTower(data);
    const base =
      studentProfile === null
        ? flat
        : flat.filter((i) => matchesProfile(i, studentProfile));
    return sortByPriorityThenName(base);
  }, [data, studentProfile]);

  const addItem = useCallback((item: Item) => {
    setData((prev) => toTower([...flattenTower(prev), item]));
    fsAddItem(item).catch((e) => console.error("[DataContext] addItem failed:", e));
  }, []);

  const updateItem = useCallback((id: string, patch: Partial<Item>) => {
    setData((prev) =>
      toTower(
        flattenTower(prev).map((item) =>
          item.id === id ? { ...item, ...patch } : item,
        ),
      ),
    );
    fsUpdateItem(id, patch).catch((e) =>
      console.error("[DataContext] updateItem failed:", e),
    );
  }, []);

  const deleteItem = useCallback((id: string) => {
    setData((prev) =>
      toTower(flattenTower(prev).filter((item) => item.id !== id)),
    );
    fsDeleteItem(id).catch((e) =>
      console.error("[DataContext] deleteItem failed:", e),
    );
  }, []);

  const value = useMemo<DataContextValue>(
    () => ({
      data,
      items,
      filteredItems,
      loading,
      hydrated,
      studentProfile,
      setStudentProfile,
      profileModalOpen,
      openProfileModal,
      closeProfileModal,
      addItem,
      updateItem,
      deleteItem,
    }),
    [
      data,
      items,
      filteredItems,
      loading,
      hydrated,
      studentProfile,
      setStudentProfile,
      profileModalOpen,
      openProfileModal,
      closeProfileModal,
      addItem,
      updateItem,
      deleteItem,
    ],
  );

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData(): DataContextValue {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error("useData must be used inside <DataProvider>");
  return ctx;
}
