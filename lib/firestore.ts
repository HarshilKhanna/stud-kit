/**
 * Type-safe Firestore helpers — all CRUD operations for the `items` collection.
 *
 * Every write is also reflected optimistically in DataContext so the UI feels instant.
 * The actual Firestore call happens asynchronously in the background.
 */

import {
  collection,
  getDocs,
  setDoc,
  doc,
  updateDoc,
  deleteDoc,
  type UpdateData,
} from "firebase/firestore";
import {
  ref as storageRef,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";
import { db, storage } from "./firebase";
import { Item } from "@/types";

const COL = "items";

// Firestore rejects `undefined` values. Strip them recursively from payloads.
function stripUndefined<T>(value: T): T {
  if (Array.isArray(value)) {
    return value
      .map((v) => stripUndefined(v))
      .filter((v) => v !== undefined) as unknown as T;
  }
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      if (v === undefined) continue;
      out[k] = stripUndefined(v);
    }
    return out as T;
  }
  return value;
}

// ─── Read ──────────────────────────────────────────────────────────────────────

/**
 * Fetch every document from the `items` collection and return them as Item[].
 * Sorting (by displayPosition / category) is handled client-side in BrowseShell.
 */
export async function getAllItems(): Promise<Item[]> {
  const snap = await getDocs(collection(db, COL));
  return snap.docs.map((d) => d.data() as Item);
}

// ─── Write ────────────────────────────────────────────────────────────────────

/**
 * Add a new item. Uses item.id as the Firestore document ID so IDs are stable.
 */
export async function addItem(item: Item): Promise<void> {
  await setDoc(doc(db, COL, item.id), stripUndefined(item));
}

/**
 * Partially update an existing item. Only the supplied fields are written.
 */
export async function updateItem(id: string, data: Partial<Item>): Promise<void> {
  await updateDoc(
    doc(db, COL, id),
    stripUndefined(data) as UpdateData<Item>
  );
}

/**
 * Permanently delete an item document.
 * The associated image in Storage is NOT deleted here — call deleteImage() separately.
 */
export async function deleteItem(id: string): Promise<void> {
  await deleteDoc(doc(db, COL, id));
}

// ─── Storage ──────────────────────────────────────────────────────────────────

/**
 * Upload an image file to Storage at `items/{itemId}` and return the download URL.
 * This replaces the base64 approach used in the admin form.
 */
export async function uploadImage(file: File, itemId: string): Promise<string> {
  const fileRef = storageRef(storage, `items/${itemId}`);
  await uploadBytes(fileRef, file);
  return getDownloadURL(fileRef);
}

/**
 * Delete the image for an item from Storage.
 * Call this when an item is deleted or its image is replaced.
 */
export async function deleteImage(itemId: string): Promise<void> {
  const fileRef = storageRef(storage, `items/${itemId}`);
  await deleteObject(fileRef);
}
