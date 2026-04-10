import { addItem, getAllItems } from "@/lib/firestore";
import { STUDENT_ITEMS } from "@/data/studentData";

/**
 * Seeds Firestore with the default STUDENT_ITEMS catalogue.
 * Only runs if Firestore is empty (no items found).
 * Returns the number of items seeded (0 if already populated).
 */
export async function seedFirestoreIfEmpty(): Promise<number> {
  const existing = await getAllItems();
  if (existing.length > 0) return 0;

  await Promise.all(STUDENT_ITEMS.map((item) => addItem(item)));
  return STUDENT_ITEMS.length;
}
