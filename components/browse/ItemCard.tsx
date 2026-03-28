"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Item } from "@/types";
import { trackEvent } from "@/lib/analytics";
import { isImagePending, PENDING_IMAGE_URL } from "@/lib/imagePending";

interface ItemCardProps {
  item: Item;
  onClick?: () => void;
}

export function ItemCard({ item, onClick }: ItemCardProps) {
  const specs = item.specs || {};

  const [hoverEnabled, setHoverEnabled] = useState(false);
  const hoverTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const mq = window.matchMedia("(hover: hover) and (pointer: fine)");
    const update = () => setHoverEnabled(mq.matches);

    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  // Read exactly what cardSpecKeys says — max 2 values joined
  const meta = (item.cardSpecKeys ?? [])
    .slice(0, 2)
    .map((key) => specs[key])
    .filter(Boolean)
    .join(" · ") || undefined;

  const handleMouseEnter = () => {
    hoverTimer.current = setTimeout(() => {
      try {
        trackEvent("item_hovered", {
          itemId: item.id,
          itemName: item.name,
          category: item.category,
        });
      } catch {}
    }, 500);
  };

  const handleMouseLeave = () => {
    if (hoverTimer.current) {
      clearTimeout(hoverTimer.current);
      hoverTimer.current = null;
    }
  };

  const handleClick = () => {
    try {
      trackEvent("item_clicked", {
        itemId: item.id,
        itemName: item.name,
        category: item.category,
      });
    } catch {}
    onClick?.();
  };

  return (
    <motion.div
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      whileHover={hoverEnabled ? { scale: 1.02 } : undefined}
      whileTap={hoverEnabled ? { scale: 0.98 } : undefined}
      transition={{ duration: 0.18, ease: "easeOut" }}
      className="group cursor-pointer"
    >
      <div className="flex flex-col overflow-hidden rounded-xl border border-[--border] bg-[--tile]">

        {/* Image — perfect square tile */}
        <div className="relative aspect-square w-full overflow-hidden">
          {!isImagePending(item.imageUrl) ? (
            <Image
              src={item.imageUrl}
              alt={item.name}
              fill
              sizes="(max-width: 768px) 50vw, (max-width: 1024px) 34vw, 25vw"
              className="object-contain p-2"
            />
          ) : item.imageUrl === PENDING_IMAGE_URL ? (
            <div className="flex h-full w-full items-center justify-center px-2 text-center text-xs text-neutral-400">
              Processing…
            </div>
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-10 w-10 text-neutral-200"
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

        {/* Meta */}
        <div className="flex flex-1 flex-col gap-1 px-3 py-1.5">
          <div className="space-y-0.5">
            {/* Line 1: item name */}
            <p className="truncate text-xs md:text-sm font-semibold text-[--text-primary]">
              {item.name}
            </p>

            {/* Line 2: brand + compact metadata (if any) */}
            {/* min-h-[2.75em] = 2 × leading-snug (1.375) — reserves two lines on every card */}
            <p className="line-clamp-2 min-h-[2.75em] leading-snug text-[11px] md:text-xs text-[--text-secondary]">
              {[item.brand, meta].filter(Boolean).join(" · ")}
            </p>
          </div>
        </div>

      </div>
    </motion.div>
  );
}
