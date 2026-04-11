"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Item } from "@/types";
import { ItemCard } from "./ItemCard";

const container = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.035, delayChildren: 0.02 } },
};

const cardVariant = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring" as const, stiffness: 280, damping: 26 },
  },
};

interface ItemGridProps {
  items: Item[];
  animationKey: string;
}

export function ItemGrid({ items, animationKey }: ItemGridProps) {
  if (items.length === 0) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <p
          className="text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-500"
          style={{ fontFamily: "var(--font-sans-alt), sans-serif" }}
        >
          No items in this category.
        </p>
      </div>
    );
  }

  return (
    <motion.div
      key={animationKey}
      className="grid grid-cols-2 gap-x-3 gap-y-6 sm:grid-cols-3 sm:gap-x-4 sm:gap-y-8 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6"
      variants={container}
      initial="hidden"
      animate="visible"
    >
      <AnimatePresence>
        {items.map((item) => (
          <motion.div key={item.id} variants={cardVariant} layout>
            <ItemCard item={item} />
          </motion.div>
        ))}
      </AnimatePresence>
    </motion.div>
  );
}
