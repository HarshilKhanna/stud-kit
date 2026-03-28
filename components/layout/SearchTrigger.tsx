"use client";

import {
  useState,
  useEffect,
  useRef,
  useMemo,
  KeyboardEvent,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, X } from "lucide-react";
import { useData } from "@/context/DataContext";
import { useSearch } from "@/context/SearchContext";
import { Item } from "@/types";

/* ─── flatten helper ─────────────────────────────────────────────────────── */
function getAllItems(data: ReturnType<typeof useData>["data"]): Item[] {
  return data.flats.flatMap((flat) => flat.rooms.flatMap((room) => room.items));
}

/* ─── SearchModal ────────────────────────────────────────────────────────── */
function SearchModal({ onClose }: { onClose: () => void }) {
  const { data } = useData();
  const { setSearchQuery } = useSearch();
  const [query, setQuery] = useState("");
  const [cursor, setCursor] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const allItems = useMemo(() => getAllItems(data), [data]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return allItems.filter(
      (item) =>
        item.name.toLowerCase().includes(q) ||
        (item.brand ?? "").toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q)
    );
  }, [allItems, query]);

  /* reset cursor when results change */
  useEffect(() => setCursor(0), [results]);

  /* auto-focus input */
  useEffect(() => { inputRef.current?.focus(); }, []);

  /* scroll highlighted result into view */
  useEffect(() => {
    const el = listRef.current?.children[cursor] as HTMLElement | undefined;
    el?.scrollIntoView({ block: "nearest" });
  }, [cursor]);

  /* scroll lock */
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);

  /* push query into grid whenever it changes */
  useEffect(() => {
    setSearchQuery(query.trim());
    return () => setSearchQuery(""); // clear when modal closes
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  const handleSelect = () => {
    onClose();
  };

  const handleKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (!results.length) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setCursor((c) => Math.min(c + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setCursor((c) => Math.max(c - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (results[cursor]) handleSelect();
    }
  };

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 pt-[12vh] backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18 }}
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        className="mx-4 w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl"
        initial={{ opacity: 0, y: -24 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -16 }}
        transition={{ type: "spring", stiffness: 400, damping: 35 }}
        onMouseDown={(e) => e.stopPropagation()}
      >
        {/* Input row */}
        <div className="flex items-center gap-3 px-4 py-3.5">
          <Search className="h-4 w-4 flex-shrink-0 text-neutral-400" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Search items, brands, categories…"
            className="flex-1 bg-transparent text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="flex-shrink-0 text-xs font-medium uppercase tracking-wide text-neutral-400 hover:text-neutral-700"
            >
              Clear
            </button>
          )}
          <button
            onClick={onClose}
            className="flex-shrink-0 text-neutral-400 hover:text-neutral-700"
            aria-label="Close search"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Results */}
        <AnimatePresence initial={false}>
          {results.length > 0 && (
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: "auto" }}
              exit={{ height: 0 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
              className="overflow-hidden"
            >
              <div className="h-px bg-neutral-100" />
              <ul ref={listRef} className="max-h-[400px] overflow-y-auto py-1">
                {results.map((item, i) => (
                  <li key={item.id}>
                    <button
                      onMouseEnter={() => setCursor(i)}
                      onClick={() => handleSelect()}
                      className={[
                        "flex w-full items-center gap-3 px-4 py-3 text-left transition-colors",
                        i === cursor ? "bg-neutral-50" : "hover:bg-neutral-50",
                      ].join(" ")}
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-neutral-900">{item.name}</p>
                        <p className="mt-0.5 text-xs text-neutral-400">
                          {[item.brand, item.category].filter(Boolean).join(" · ")}
                        </p>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            </motion.div>
          )}

          {query.trim() && results.length === 0 && (
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: "auto" }}
              exit={{ height: 0 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
              className="overflow-hidden"
            >
              <div className="h-px bg-neutral-100" />
              <p className="px-4 py-6 text-center text-sm text-neutral-400">
                No results for &ldquo;{query.trim()}&rdquo;
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}

/* ─── SearchTrigger (button + modal) ─────────────────────────────────────── */
interface SearchTriggerProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  hideButton?: boolean;
}

export function SearchTrigger({ open: controlledOpen, onOpenChange, hideButton }: SearchTriggerProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = controlledOpen !== undefined && onOpenChange !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = isControlled ? onOpenChange : setInternalOpen;

  /* Keyboard shortcut: Cmd+K or Ctrl+K */
  useEffect(() => {
    const handler = (e: globalThis.KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen(!open);
      }
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, setOpen]);

  return (
    <>
      {!hideButton && (
        <button
          onClick={() => setOpen(true)}
          aria-label="Search"
          className="flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-sm text-neutral-400 shadow-sm transition-colors hover:border-neutral-300 hover:text-neutral-600"
        >
          <Search className="h-3.5 w-3.5" />
          <span className="hidden text-xs sm:inline">Search</span>
          <kbd className="hidden rounded bg-neutral-100 px-1 py-0.5 text-[10px] text-neutral-400 sm:inline">
            ⌘K
          </kbd>
        </button>
      )}

      <AnimatePresence>
        {open && <SearchModal onClose={() => setOpen(false)} />}
      </AnimatePresence>
    </>
  );
}
