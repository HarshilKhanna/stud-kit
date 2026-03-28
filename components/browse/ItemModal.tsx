"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { X, ArrowUpRight } from "lucide-react";
import { Item } from "@/types";
import { useData } from "@/context/DataContext";
import { isImagePending, PENDING_IMAGE_URL } from "@/lib/imagePending";

interface ItemModalProps {
  item: Item | null;
  onClose: () => void;
  onSelectItem?: (item: Item) => void;
}

function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 640px)");
    setIsDesktop(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);
  return isDesktop;
}

function flattenItems(data: ReturnType<typeof useData>["data"]): Item[] {
  return data.flats.flatMap((flat) =>
    flat.rooms.flatMap((room) => room.items)
  );
}

function RelatedItemCard({
  item,
  onClick,
}: {
  item: Item;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-[120px] flex-shrink-0 flex-col overflow-hidden rounded-xl border border-neutral-100 bg-white text-left transition-shadow hover:shadow-md sm:min-w-0 sm:w-full"
    >
      <div className="relative aspect-square w-full bg-neutral-50">
        {!isImagePending(item.imageUrl) ? (
          <Image
            src={item.imageUrl}
            alt={item.name}
            fill
            sizes="132px"
            className="object-contain p-2"
          />
        ) : item.imageUrl === PENDING_IMAGE_URL ? (
          <div className="flex h-full w-full items-center justify-center px-1 text-center text-[10px] text-neutral-400">
            Processing…
          </div>
        ) : (
          <div className="flex h-full w-full items-center justify-center text-neutral-200">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-8 w-8"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <path d="M21 15l-5-5L5 21" />
            </svg>
          </div>
        )}
      </div>
      <p className="truncate px-2 py-1.5 text-xs font-medium text-neutral-800">
        {item.name}
      </p>
    </button>
  );
}

export function ItemModal({ item, onClose, onSelectItem }: ItemModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const isDesktop = useIsDesktop();
  const { data } = useData();

  const allItems = useMemo(() => flattenItems(data), [data]);

  const relatedItems = useMemo(() => {
    if (!item) return [];
    const cat = item.category.toLowerCase();
    return allItems
      .filter(
        (i) => i.id !== item.id && i.category.toLowerCase() === cat
      )
      .slice(0, 12);
  }, [allItems, item]);

  /* body scroll lock */
  useEffect(() => {
    if (!item) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [item]);

  /* Escape key */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  const panelVariants = isDesktop
    ? {
        hidden: { opacity: 0, scale: 0.95, y: 0 },
        visible: { opacity: 1, scale: 1, y: 0 },
        exit: { opacity: 0, scale: 0.95, y: 0 },
      }
    : {
        hidden: { opacity: 1, scale: 1, y: "100%" },
        visible: { opacity: 1, scale: 1, y: 0 },
        exit: { opacity: 1, scale: 1, y: "100%" },
      };

  const panelTransition = isDesktop
    ? { type: "spring" as const, stiffness: 340, damping: 32 }
    : { type: "spring" as const, stiffness: 320, damping: 38 };

  const specs = item ? Object.entries(item.specs ?? {}) : [];

  return (
    <AnimatePresence>
      {item && (
        <motion.div
          key="backdrop"
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm sm:items-center sm:p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
          <motion.div
            ref={panelRef}
            key="panel"
            className="relative flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-3xl bg-white sm:max-h-[85vh] sm:max-w-3xl sm:rounded-2xl"
            variants={panelVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={panelTransition}
          >
            {/* Close */}
            <button
              onClick={onClose}
              aria-label="Close"
              className="absolute right-4 top-4 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-neutral-100 text-neutral-500 transition-colors hover:bg-neutral-200 hover:text-neutral-900"
            >
              <X className="h-4 w-4" />
            </button>

            {/* Drag handle */}
            <div className="flex justify-center pt-3 sm:hidden">
              <div className="h-1 w-10 rounded-full bg-neutral-200" />
            </div>

            {/* Body — single scrollable column so related section is reachable */}
            <div className="flex flex-1 flex-col overflow-y-auto sm:flex-row">
              {/* Image */}
              <div className="relative aspect-square w-full flex-shrink-0 bg-neutral-50 sm:w-[44%] sm:min-h-0 sm:flex-shrink-0">
                {!isImagePending(item.imageUrl) ? (
                  <Image
                    src={item.imageUrl}
                    alt={item.name}
                    fill
                    sizes="(max-width: 640px) 100vw, 44vw"
                    className="object-contain p-6"
                    priority
                  />
                ) : item.imageUrl === PENDING_IMAGE_URL ? (
                  <div className="flex h-full w-full items-center justify-center px-4 text-center text-sm text-neutral-400">
                    Processing…
                  </div>
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-neutral-200">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-14 w-14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={1.2}
                    >
                      <rect x="3" y="3" width="18" height="18" rx="2" />
                      <circle cx="8.5" cy="8.5" r="1.5" />
                      <path d="M21 15l-5-5L5 21" />
                    </svg>
                  </div>
                )}
              </div>

              {/* Content + Related — scrollable */}
              <div className="flex min-h-0 flex-1 flex-col sm:overflow-y-auto">
                <div className="flex flex-col gap-5 p-6">
                  <div className="space-y-1">
                    {(item.brand || item.category) && (
                      <p className="text-[11px] font-medium uppercase tracking-widest text-neutral-400">
                        {[item.brand, item.category].filter(Boolean).join(" · ")}
                      </p>
                    )}
                    <h2 className="text-xl font-semibold leading-snug text-neutral-900">
                      {item.name}
                    </h2>
                  </div>

                  {specs.length > 0 && (
                    <div>
                      <h3 className="mb-2.5 text-[11px] font-semibold uppercase tracking-widest text-neutral-400">
                        Specifications
                      </h3>
                      <table className="w-full text-sm">
                        <tbody>
                          {specs.map(([key, val], i) => (
                            <tr
                              key={key}
                              className={i !== specs.length - 1 ? "border-b border-neutral-100" : ""}
                            >
                              <td className="w-2/5 py-2 pr-4 font-medium text-neutral-500">{key}</td>
                              <td className="py-2 text-neutral-800">{val}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {item.externalUrl && (
                    <div className="pt-2">
                      <a
                        href={item.externalUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 rounded-full bg-neutral-900 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-neutral-700"
                      >
                        Find this item
                        <ArrowUpRight className="h-3.5 w-3.5" />
                      </a>
                    </div>
                  )}

                  {/* Related — same category */}
                  {relatedItems.length > 0 && (
                    <div className="border-t border-neutral-100 pt-6">
                      <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-neutral-400">
                        More in {item.category}
                      </h3>
                      <div className="-mx-1 flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:mx-0 sm:grid sm:grid-cols-3 sm:gap-3 sm:overflow-visible">
                        {relatedItems.map((related) => (
                          <RelatedItemCard
                            key={related.id}
                            item={related}
                            onClick={() => onSelectItem?.(related)}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
