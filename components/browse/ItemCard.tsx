"use client";

import Image from "next/image";
import { useState } from "react";
import { motion } from "framer-motion";
import type { Item, Source } from "@/types";
import { isImagePending, PENDING_IMAGE_URL } from "@/lib/imagePending";
import { getItemBuyUrl } from "@/lib/itemBuyUrl";

interface ItemCardProps {
  item: Item;
}

function sourceBadge(source: Source): { label: string; className: string } {
  switch (source) {
    case "bring-from-india":
      return {
        label: "Bring from India",
        className: "bg-orange-100 text-orange-900 border-orange-200/80",
      };
    case "buy-there":
      return {
        label: "Buy there",
        className: "bg-sky-100 text-sky-900 border-sky-200/80",
      };
    default:
      return {
        label: "Either",
        className: "bg-neutral-100 text-neutral-600 border-neutral-200/80",
      };
  }
}

/** Fixed tile + text block heights so every card matches urban-flat-kit grid behaviour. */
export function ItemCard({ item }: ItemCardProps) {
  const specs = item.specs || {};
  const [imageFailed, setImageFailed] = useState(false);
  const buyUrl = getItemBuyUrl(item);

  const meta =
    (item.cardSpecKeys ?? [])
      .slice(0, 2)
      .map((key) => specs[key])
      .filter(Boolean)
      .join(" · ") || undefined;

  const detailLine = [item.brand, meta].filter(Boolean).join(" · ");

  const sb = sourceBadge(item.source);

  return (
    <motion.a
      href={buyUrl}
      target="_blank"
      rel="noopener noreferrer"
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.18, ease: "easeOut" }}
      className="flex h-full min-h-0 w-full flex-col no-underline outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 focus-visible:ring-offset-2"
    >
      <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-xl border border-[--border] bg-[--tile]">
        <div className="relative aspect-square w-full shrink-0 overflow-hidden bg-[#fafafa]">
          {!isImagePending(item.imageUrl) && !imageFailed ? (
            <Image
              src={item.imageUrl}
              alt={item.name}
              fill
              unoptimized
              sizes="(max-width: 640px) 50vw, (max-width: 768px) 25vw, (max-width: 1024px) 20vw, 16vw"
              className="object-contain p-2"
              onError={() => setImageFailed(true)}
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

        <div className="flex min-h-0 flex-1 flex-col gap-1 px-3 py-1.5">
          <div className="min-h-0 space-y-1">
            <p className="line-clamp-2 h-10 text-xs font-semibold leading-5 text-[--text-primary]">
              {item.name}
            </p>

            <div className="flex h-7 shrink-0 items-center justify-between gap-1">
              <span
                className={[
                  "inline-flex min-w-0 max-w-[70%] truncate rounded border px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide",
                  sb.className,
                ].join(" ")}
                title={sb.label}
              >
                {sb.label}
              </span>
              {item.priority === "day-1" ? (
                <span className="inline-flex shrink-0 rounded border border-red-200 bg-red-50 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-red-800">
                  Day 1
                </span>
              ) : (
                <span className="w-0 shrink-0" aria-hidden />
              )}
            </div>

            <p className="line-clamp-2 h-[2.75em] shrink-0 text-[11px] leading-snug text-[--text-secondary]">
              {detailLine || "\u00a0"}
            </p>
          </div>
        </div>
      </div>
    </motion.a>
  );
}
