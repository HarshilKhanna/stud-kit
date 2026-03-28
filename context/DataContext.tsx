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
import { DEFAULT_STUDENT_TOWER } from "@/data/studentData";
import { coerceExternalUrl } from "@/lib/itemBuyUrl";
import { ProjectContext } from "@/context/ProjectContext";

const PROFILE_KEY = "studentkit_profile_v1";
const CATALOG_KEY = "studentkit_catalog_v1";

const PRIORITY_ORDER: Record<string, number> = {
  "day-1": 0,
  "week-1": 1,
  "month-1": 2,
  optional: 3,
};

export interface DataContextValue {
  data: Tower;
  /** Full catalogue (flattened), sorted by priority then name — for admin */
  items: Item[];
  /** Profile-filtered + sorted — for browse when profile set; all items when profile null */
  filteredItems: Item[];
  /** True until browser storage has been read */
  loading: boolean;
  /** Storage and UI ready — safe to auto-open onboarding */
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
  const projectCtx = useContext(ProjectContext);
  const isAdminScoped = Boolean(projectCtx);

  const [data, setData] = useState<Tower>(() =>
    isAdminScoped ? toTower([]) : DEFAULT_STUDENT_TOWER,
  );
  const [loading, setLoading] = useState(true);
  const [hydrated, setHydrated] = useState(false);
  const [studentProfile, setStudentProfileState] = useState<StudentProfile | null>(
    null,
  );
  const [profileModalOpen, setProfileModalOpen] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      const catRaw = localStorage.getItem(CATALOG_KEY);
      if (catRaw) {
        const parsed = JSON.parse(catRaw) as Item[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          const normalized: Item[] = parsed.map((row) => ({
            ...row,
            externalUrl: coerceExternalUrl(row.name, row.externalUrl),
          }));
          setData(toTower(normalized));
        } else if (!isAdminScoped) {
          setData(DEFAULT_STUDENT_TOWER);
        }
      } else if (isAdminScoped) {
        setData(DEFAULT_STUDENT_TOWER);
      }

      setStudentProfileState(safeParseProfile(localStorage.getItem(PROFILE_KEY)));
    } catch (e) {
      console.error("StudentKit storage hydrate failed:", e);
      if (isAdminScoped) setData(DEFAULT_STUDENT_TOWER);
    }

    setHydrated(true);
    setLoading(false);
  }, [isAdminScoped]);

  const persistCatalog = useCallback((tower: Tower) => {
    try {
      localStorage.setItem(CATALOG_KEY, JSON.stringify(flattenTower(tower)));
    } catch (e) {
      console.error("StudentKit catalog persist failed:", e);
    }
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

  const addItem = useCallback(
    (item: Item) => {
      setData((prev) => {
        const next = toTower([...flattenTower(prev), item]);
        persistCatalog(next);
        return next;
      });
    },
    [persistCatalog],
  );

  const updateItem = useCallback(
    (id: string, patch: Partial<Item>) => {
      setData((prev) => {
        const next = toTower(
          flattenTower(prev).map((item) =>
            item.id === id ? { ...item, ...patch } : item,
          ),
        );
        persistCatalog(next);
        return next;
      });
    },
    [persistCatalog],
  );

  const deleteItem = useCallback(
    (id: string) => {
      setData((prev) => {
        const next = toTower(
          flattenTower(prev).filter((item) => item.id !== id),
        );
        persistCatalog(next);
        return next;
      });
    },
    [persistCatalog],
  );

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

  return (
    <DataContext.Provider value={value}>{children}</DataContext.Provider>
  );
}

export function useData(): DataContextValue {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error("useData must be used inside <DataProvider>");
  return ctx;
}
