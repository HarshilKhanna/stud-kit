"use client";

import Image from "next/image";
import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import type { Item } from "@/types";
import {
  getItemImageDisplaySrc,
  isItemImagePipelinePending,
} from "@/lib/itemImageUrl";
import { getItemBuyUrl } from "@/lib/itemBuyUrl";
import { trackEvent } from "@/lib/analytics";

const PRIORITY_BADGE: Record<string, string | null> = {
  "day-1":   "Day 1",
  "week-1":  "Immediate",
  "month-1": null,
  "optional": null,
};

const SOURCE_LABEL: Record<string, string> = {
  "bring-from-india": "Bring from India",
  "buy-there":        "Buy there",
};

export function ItemCard({ item }: { item: Item }) {
  const [imageFailed, setImageFailed] = useState(false);
  const buyUrl          = getItemBuyUrl(item);
  const imgSrc          = getItemImageDisplaySrc(item);
  const pipelinePending = isItemImagePipelinePending(item);
  const badge           = PRIORITY_BADGE[item.priority] ?? null;
  const sourceLabel     = SOURCE_LABEL[item.source] ?? "Either";
  const hoverFired      = useRef(false);

  useEffect(() => {
    setImageFailed(false);
  }, [imgSrc]);

  function handleClick() {
    trackEvent("item_clicked", {
      itemId:   item.id,
      itemName: item.name,
      category: item.category,
    });
  }

  function handleMouseEnter() {
    if (hoverFired.current) return;
    hoverFired.current = true;
    trackEvent("item_hovered", { itemId: item.id, itemName: item.name });
  }

  return (
    <motion.a
      href={buyUrl}
      target="_blank"
      rel="noopener noreferrer"
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.15, ease: "easeOut" }}
      className="group flex w-full flex-col no-underline outline-none focus-visible:ring-2 focus-visible:ring-neutral-400"
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
    >
      {/* Image */}
      <div className="relative aspect-square w-full overflow-hidden bg-[#F9F9F9]">
        {!pipelinePending && imgSrc && !imageFailed ? (
          <Image
            src={imgSrc}
            alt={item.name}
            fill
            unoptimized
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 17vw"
            className="object-contain p-2 transition-transform duration-500 group-hover:scale-105"
            onError={() => setImageFailed(true)}
          />
        ) : pipelinePending ? (
          <div className="flex h-full w-full items-center justify-center text-[10px] uppercase tracking-widest text-neutral-300">
            Processing…
          </div>
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-8 w-8 text-neutral-200"
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

        {badge && (
          <span className="absolute left-0 top-0 bg-black px-2 py-1 text-[8px] font-bold uppercase tracking-[0.18em] text-white">
            {badge}
          </span>
        )}
      </div>

      {/* Text area */}
      <div className="pt-3">
        <div className="flex items-start justify-between gap-1.5">
          <p
            className="line-clamp-2 flex-1 text-[15px] leading-snug text-black"
            style={{ fontFamily: "var(--font-serif), serif" }}
          >
            {item.name}
          </p>
          <span className="mt-0.5 flex-shrink-0 text-sm text-neutral-400 transition-colors group-hover:text-black">
            ↗
          </span>
        </div>

        <div className="mt-1.5 flex flex-wrap items-center gap-x-1.5 gap-y-0.5">
          <span className="text-[9px] font-bold uppercase tracking-[0.14em] text-neutral-700">
            Source: {sourceLabel}
          </span>
          {item.brand && (
            <>
              <span className="text-neutral-300 text-[9px]">·</span>
              <span className="text-[9px] uppercase tracking-[0.12em] text-neutral-400">
                {item.brand}
              </span>
            </>
          )}
        </div>
      </div>
    </motion.a>
  );
}
