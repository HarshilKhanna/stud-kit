"use client";

import { motion } from "framer-motion";
import type { Item, Priority } from "@/types";
import { ItemCard } from "./ItemCard";

const SECTIONS: { priority: Priority; title: string }[] = [
  { priority: "day-1",    title: "Immediate Needs" },
  { priority: "week-1",   title: "First Week"      },
  { priority: "month-1",  title: "Settle In"       },
  { priority: "optional", title: "Nice to Have"    },
];

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

interface PrioritySectionsProps {
  items: Item[];
  animationKey: string;
}

export function PrioritySections({ items, animationKey }: PrioritySectionsProps) {
  if (items.length === 0) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <p
          className="text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-500"
          style={{ fontFamily: "var(--font-sans-alt), sans-serif" }}
        >
          No items match your filters.
        </p>
      </div>
    );
  }

  return (
    <div key={animationKey} className="flex flex-col gap-16">
      {SECTIONS.map(({ priority, title }) => {
        const sectionItems = items.filter((i) => i.priority === priority);
        if (sectionItems.length === 0) return null;

        return (
          <section key={priority} className="min-w-0">
            {/* Section heading */}
            <div className="mb-8 flex items-baseline justify-between border-b border-neutral-200/60 pb-3">
              <h2
                className="text-[11px] font-bold uppercase tracking-[0.2em] text-neutral-600"
                style={{ fontFamily: "var(--font-sans-alt), sans-serif" }}
              >
                {title}
              </h2>
              <span
                className="text-[10px] font-semibold uppercase tracking-[0.16em] text-neutral-400"
                style={{ fontFamily: "var(--font-sans-alt), sans-serif" }}
              >
                {sectionItems.length} {sectionItems.length === 1 ? "item" : "items"}
              </span>
            </div>

            <motion.div
              className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-4 lg:grid-cols-6"
              variants={container}
              initial="hidden"
              animate="visible"
            >
              {sectionItems.map((item) => (
                <motion.div key={item.id} variants={cardVariant} layout>
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
