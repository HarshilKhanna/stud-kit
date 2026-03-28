"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Item } from "@/types";
import { ItemCard } from "./ItemCard";

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
  animationKey: string;
}

export function ItemGrid({ items, animationKey }: ItemGridProps) {
  if (items.length === 0) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <p className="text-sm text-neutral-400">No items in this category.</p>
      </div>
    );
  }

  return (
    <motion.div
      key={animationKey}
      className="grid grid-cols-2 items-stretch gap-x-4 gap-y-6 sm:grid-cols-4 lg:grid-cols-6"
      variants={container}
      initial="hidden"
      animate="visible"
    >
      <AnimatePresence>
        {items.map((item) => (
          <motion.div
            key={item.id}
            variants={cardVariant}
            layout
            className="flex h-full min-h-0"
          >
            <ItemCard item={item} />
          </motion.div>
        ))}
      </AnimatePresence>
    </motion.div>
  );
}
