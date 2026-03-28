"use client";

import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Item } from "@/types";
import { ItemCard } from "./ItemCard";
import { trackEvent } from "@/lib/analytics";

const container = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.04, delayChildren: 0.04 },
  },
};

const cardVariant = {
  hidden: { opacity: 0, y: 18 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring" as const, stiffness: 260, damping: 24 },
  },
};

interface ItemGridProps {
  items: Item[];
  onItemClick: (item: Item) => void;
  animationKey: string;
}

const DEPTHS = ["25%", "50%", "75%", "100%"] as const;
type Depth = (typeof DEPTHS)[number];

function useScrollDepth(gridRef: React.RefObject<HTMLDivElement | null>) {
  const fired = useRef<Set<Depth>>(new Set());

  useEffect(() => {
    const grid = gridRef.current;
    if (!grid) return;

    // Place 4 invisible sentinels at 25/50/75/100% of the grid height
    const sentinels: HTMLElement[] = DEPTHS.map((depth) => {
      const el = document.createElement("div");
      el.style.cssText =
        "position:absolute;left:0;width:1px;height:1px;pointer-events:none;";
      el.style.top = depth;
      el.setAttribute("aria-hidden", "true");
      return el;
    });

    // Grid must be position:relative for absolute children to work
    const prevPosition = grid.style.position;
    if (!prevPosition || prevPosition === "static") {
      grid.style.position = "relative";
    }
    sentinels.forEach((s) => grid.appendChild(s));

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const idx = sentinels.indexOf(entry.target as HTMLElement);
          if (idx === -1) continue;
          const depth = DEPTHS[idx];
          if (fired.current.has(depth)) continue;
          fired.current.add(depth);
          try {
            trackEvent("scroll_depth", { depth });
          } catch {}
        }
      },
      { threshold: 0 }
    );

    sentinels.forEach((s) => observer.observe(s));

    return () => {
      observer.disconnect();
      sentinels.forEach((s) => s.remove());
      if (!prevPosition || prevPosition === "static") {
        grid.style.position = prevPosition ?? "";
      }
    };
  // Re-run when the grid re-mounts (animationKey change resets the key)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}

export function ItemGrid({ items, onItemClick, animationKey }: ItemGridProps) {
  const gridRef = useRef<HTMLDivElement>(null);
  useScrollDepth(gridRef);

  if (items.length === 0) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <p className="text-sm text-neutral-400">No items in this category.</p>
      </div>
    );
  }

  return (
    <motion.div
      ref={gridRef}
      key={animationKey}
      className="grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-4 lg:grid-cols-6"
      variants={container}
      initial="hidden"
      animate="visible"
    >
      <AnimatePresence>
        {items.map((item) => (
          <motion.div key={item.id} variants={cardVariant} layout className="h-full">
            <ItemCard item={item} onClick={() => onItemClick(item)} />
          </motion.div>
        ))}
      </AnimatePresence>
    </motion.div>
  );
}
