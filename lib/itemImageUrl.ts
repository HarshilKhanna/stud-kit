import type { Item } from "@/types";
import { PENDING_IMAGE_URL } from "@/lib/imagePending";

const ALT_IMAGE_KEYS = ["image_url", "Image URL", "imageURL"] as const;

/**
 * Single place to resolve the stored image address from an item row (handles
 * Firestore / spreadsheet field-name variants).
 */
export function normalizeItemImageUrl(
  raw: Partial<Item> | (Partial<Item> & Record<string, unknown>),
): string {
  const row = raw as Partial<Item> & Record<string, unknown>;
  const primary = typeof row.imageUrl === "string" ? row.imageUrl.trim() : "";
  if (primary === PENDING_IMAGE_URL) return PENDING_IMAGE_URL;
  if (primary) return primary;
  for (const k of ALT_IMAGE_KEYS) {
    const v = row[k];
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  return "";
}

/** True while the admin pipeline still has a file to process. */
export function isItemImagePipelinePending(item: Item): boolean {
  return item.imageUrl?.trim() === PENDING_IMAGE_URL;
}

/** Safe `src` for catalogue thumbnails (never the pending sentinel). */
export function getItemImageDisplaySrc(item: Item): string {
  if (isItemImagePipelinePending(item)) return "";
  const n = normalizeItemImageUrl(item);
  if (n === PENDING_IMAGE_URL) return "";
  return n;
}
