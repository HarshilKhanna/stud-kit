"use client";

import { motion } from "framer-motion";
import type { Item, Priority } from "@/types";
import { ItemCard } from "./ItemCard";

const SECTIONS: { priority: Priority; emoji: string; title: string }[] = [
  { priority: "day-1", emoji: "🔴", title: "Before You Leave" },
  { priority: "week-1", emoji: "🟡", title: "First Week" },
  { priority: "month-1", emoji: "🟢", title: "Settle In" },
  { priority: "optional", emoji: "⚪", title: "Nice to Have" },
];

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

interface PrioritySectionsProps {
  items: Item[];
  animationKey: string;
}

export function PrioritySections({
  items,
  animationKey,
}: PrioritySectionsProps) {
  if (items.length === 0) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <p className="text-sm text-neutral-400">No items match your filters.</p>
      </div>
    );
  }

  return (
    <div key={animationKey} className="flex flex-col gap-10">
      {SECTIONS.map(({ priority, emoji, title }) => {
        const sectionItems = items.filter((i) => i.priority === priority);
        if (sectionItems.length === 0) return null;

        return (
          <section key={priority} className="min-w-0">
            <h2 className="mb-4 px-0 text-base font-bold text-neutral-900">
              {emoji} {title}
              <span className="ml-2 font-semibold text-neutral-400">
                · {sectionItems.length}{" "}
                {sectionItems.length === 1 ? "item" : "items"}
              </span>
            </h2>

            <motion.div
              className="grid grid-cols-2 items-stretch gap-x-4 gap-y-6 sm:grid-cols-4 lg:grid-cols-6"
              variants={container}
              initial="hidden"
              animate="visible"
            >
              {sectionItems.map((item) => (
                <motion.div
                  key={item.id}
                  variants={cardVariant}
                  layout
                  className="flex h-full min-h-0"
                >
                  <ItemCard item={item} />
                </motion.div>
              ))}
            </motion.div>
          </section>
        );
      })}
    </div>
  );
}
