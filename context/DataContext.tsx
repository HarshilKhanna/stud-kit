"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import type { Item, Tower } from "@/types";
import { DEFAULT_DATA } from "@/data/defaultData";
import {
  getAllItems,
  addItem as fsAdd,
  updateItem as fsUpdate,
  deleteItem as fsDelete,
} from "@/lib/firestore";

interface DataContextValue {
  data: Tower;
  /** True while the initial Firestore fetch is in flight */
  loading: boolean;
  addItem: (item: Item) => void;
  updateItem: (id: string, patch: Partial<Item>) => void;
  deleteItem: (id: string) => void;
}

const DataContext = createContext<DataContextValue | null>(null);

/** Wrap a flat Item[] into the Tower shape that all existing components expect. */
function toTower(items: Item[]): Tower {
  return { flats: [{ rooms: [{ items }] }] };
}

/** Pull every item out of the nested Tower into a flat array. */
function flattenTower(tower: Tower): Item[] {
  return tower.flats.flatMap((f) => f.rooms.flatMap((r) => r.items));
}

export function DataProvider({ children }: { children: ReactNode }) {
  // Start from the bundled default so the page renders immediately (no blank flash)
  const [data, setData] = useState<Tower>(DEFAULT_DATA);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAllItems()
      .then((items) => {
        if (items.length > 0) {
          // Firestore has data — use it
          setData(toTower(items));
        }
        // If collection is empty (not yet migrated) keep DEFAULT_DATA visible
      })
      .catch((err) => {
        console.error("Firestore fetch failed — showing local data:", err);
      })
      .finally(() => setLoading(false));
  }, []);

  // ─── Mutations — optimistic local update then async Firestore sync ───────

  const addItem: DataContextValue["addItem"] = (item) => {
    setData((prev) => toTower([...flattenTower(prev), item]));
    fsAdd(item).catch((err) =>
      console.error("Firestore addItem failed:", err)
    );
  };

  const updateItem: DataContextValue["updateItem"] = (id, patch) => {
    setData((prev) =>
      toTower(
        flattenTower(prev).map((item) =>
          item.id === id ? { ...item, ...patch } : item
        )
      )
    );
    fsUpdate(id, patch).catch((err) =>
      console.error("Firestore updateItem failed:", err)
    );
  };

  const deleteItem: DataContextValue["deleteItem"] = (id) => {
    setData((prev) =>
      toTower(flattenTower(prev).filter((item) => item.id !== id))
    );
    fsDelete(id).catch((err) =>
      console.error("Firestore deleteItem failed:", err)
    );
  };

  return (
    <DataContext.Provider value={{ data, loading, addItem, updateItem, deleteItem }}>
      {children}
    </DataContext.Provider>
  );
}

export function useData(): DataContextValue {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error("useData must be used inside <DataProvider>");
  return ctx;
}
