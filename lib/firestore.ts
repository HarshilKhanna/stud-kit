/**
 * Type-safe Firestore helpers — all CRUD operations for the `items` collection.
 *
 * Every write is also reflected optimistically in DataContext so the UI feels instant.
 * The actual Firestore call happens asynchronously in the background.
 */

import {
  collection,
  getDocs,
  getDoc,
  onSnapshot,
  setDoc,
  doc,
  updateDoc,
  deleteDoc,
  deleteField,
  query,
  where,
  writeBatch,
  serverTimestamp,
  type UpdateData,
} from "firebase/firestore";
import {
  ref as storageRef,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";
import { db, storage } from "./firebase";
import { Item, Project } from "@/types";
import {
  ALL_REGIONS,
  ALL_ACCOMMODATIONS,
  ALL_BUDGET_TIERS,
} from "@/data/studentData";
import { coerceExternalUrl } from "@/lib/itemBuyUrl";

/** Coerce legacy Firestore documents to the current StudentKit Item shape. */
function withItemDefaults(raw: Partial<Item> & { id: string }): Item {
  const externalUrl = coerceExternalUrl(raw.name ?? "", raw.externalUrl);
  return {
    id: raw.id,
    name: raw.name ?? "",
    category: raw.category ?? "Documents & Admin",
    imageUrl: raw.imageUrl ?? "",
    externalUrl,
    priority: raw.priority ?? "optional",
    source: raw.source ?? "either",
    relevantRegions:
      raw.relevantRegions && raw.relevantRegions.length > 0
        ? raw.relevantRegions
        : [...ALL_REGIONS],
    relevantAccommodations:
      raw.relevantAccommodations && raw.relevantAccommodations.length > 0
        ? raw.relevantAccommodations
        : [...ALL_ACCOMMODATIONS],
    budgetTiers:
      raw.budgetTiers && raw.budgetTiers.length > 0
        ? raw.budgetTiers
        : [...ALL_BUDGET_TIERS],
    brand: raw.brand,
    price: raw.price,
    tip: raw.tip,
    availabilityNote: raw.availabilityNote,
    indianCommunityNote: raw.indianCommunityNote,
    specs: raw.specs,
    cardSpecKeys: raw.cardSpecKeys,
    displayPosition: raw.displayPosition,
    projectId: raw.projectId,
  };
}

const COL = "items";
const PROJECTS_COL = "projects";
const DEFAULT_PROJECT_ADMIN_USERNAME = "admin";
const DEFAULT_PROJECT_ADMIN_PASSWORD = "admin1234";

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

async function resolveProjectDoc(projectId: string) {
  const direct = doc(db, PROJECTS_COL, projectId);
  const directSnap = await getDoc(direct);
  if (directSnap.exists()) {
    return direct;
  }
  const byId = await getDocs(
    query(collection(db, PROJECTS_COL), where("id", "==", projectId))
  );
  if (!byId.empty) {
    return byId.docs[0].ref;
  }
  return null;
}

async function resolveItemDoc(itemId: string, projectId?: string) {
  const direct = doc(db, COL, itemId);
  const directSnap = await getDoc(direct);
  if (
    directSnap.exists() &&
    (projectId == null ||
      (directSnap.data() as { projectId?: unknown }).projectId === projectId)
  ) {
    return direct;
  }
  const byIdSnap = await getDocs(
    query(collection(db, COL), where("id", "==", itemId))
  );
  if (!byIdSnap.empty) {
    if (projectId != null) {
      const inProject = byIdSnap.docs.find(
        (d) => (d.data() as { projectId?: unknown }).projectId === projectId
      );
      if (inProject) return inProject.ref;
    }
    const canonical = byIdSnap.docs.find((d) => d.id === itemId);
    if (canonical) return canonical.ref;
    return byIdSnap.docs[0].ref;
  }
  return null;
}

function mapUniqueItemsFromDocs(
  docs: Array<{ id: string; data: () => Record<string, unknown> }>
): Item[] {
  const byItemId = new Map<string, { docId: string; item: Item }>();

  for (const d of docs) {
    const raw = d.data() as Partial<Item>;
    const effectiveId =
      typeof raw.id === "string" && raw.id.trim().length > 0 ? raw.id : d.id;
    const next = withItemDefaults({ ...raw, id: effectiveId });
    const existing = byItemId.get(effectiveId);

    if (!existing) {
      byItemId.set(effectiveId, { docId: d.id, item: next });
      continue;
    }

    // Prefer canonical doc where Firestore doc ID equals item.id.
    const existingIsCanonical = existing.docId === effectiveId;
    const nextIsCanonical = d.id === effectiveId;
    if (!existingIsCanonical && nextIsCanonical) {
      byItemId.set(effectiveId, { docId: d.id, item: next });
    }
  }

  return Array.from(byItemId.values()).map((v) => v.item);
}

// ─── Read ──────────────────────────────────────────────────────────────────────

/**
 * Fetch every document from the `items` collection and return them as Item[].
 * Sorting (by displayPosition / category) is handled client-side in BrowseShell.
 */
export async function getAllItems(): Promise<Item[]> {
  const snap = await getDocs(collection(db, COL));
  return mapUniqueItemsFromDocs(snap.docs);
}

export async function getProjectItems(projectId: string): Promise<Item[]> {
  const snap = await getDocs(
    query(collection(db, COL), where("projectId", "==", projectId))
  );
  return mapUniqueItemsFromDocs(snap.docs);
}

export function subscribeAllItems(
  onItems: (items: Item[]) => void,
  onError?: (error: Error) => void
): () => void {
  return onSnapshot(
    collection(db, COL),
    (snap) => onItems(mapUniqueItemsFromDocs(snap.docs)),
    (err) => onError?.(err as Error)
  );
}

export function subscribeProjectItems(
  projectId: string,
  onItems: (items: Item[]) => void,
  onError?: (error: Error) => void
): () => void {
  return onSnapshot(
    query(collection(db, COL), where("projectId", "==", projectId)),
    (snap) => onItems(mapUniqueItemsFromDocs(snap.docs)),
    (err) => onError?.(err as Error)
  );
}

function normalizeProjectDate(project: Project): Project {
  const raw = project as unknown as { isActive?: unknown; status?: unknown };
  const normalizedIsActive =
    typeof raw.isActive === "boolean"
      ? raw.isActive
      : String(raw.status ?? "").toLowerCase() === "active";
  const createdAt = project.createdAt as unknown;
  if (createdAt instanceof Date) {
    return {
      ...project,
      isActive: normalizedIsActive,
    };
  }
  if (
    createdAt &&
    typeof createdAt === "object" &&
    "toDate" in (createdAt as Record<string, unknown>) &&
    typeof (createdAt as { toDate?: unknown }).toDate === "function"
  ) {
    return {
      ...project,
      isActive: normalizedIsActive,
      createdAt: (createdAt as { toDate: () => Date }).toDate(),
    };
  }
  return {
    ...project,
    isActive: normalizedIsActive,
    createdAt: new Date(0),
  };
}

export async function getProjects(): Promise<Project[]> {
  const snap = await getDocs(collection(db, PROJECTS_COL));
  return snap.docs.map((d) => normalizeProjectDate(d.data() as Project));
}

export async function getProject(id: string): Promise<Project | null> {
  const ref = await resolveProjectDoc(id);
  if (!ref) return null;
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return normalizeProjectDate(snap.data() as Project);
}

export async function getProjectBySlug(slug: string): Promise<Project | null> {
  const snap = await getDocs(
    query(collection(db, PROJECTS_COL), where("slug", "==", slug))
  );
  if (snap.empty) return null;
  return normalizeProjectDate(snap.docs[0].data() as Project);
}

export async function getActiveProject(): Promise<Project | null> {
  const snap = await getDocs(
    query(collection(db, PROJECTS_COL), where("isActive", "==", true))
  );
  if (!snap.empty) {
    return normalizeProjectDate(snap.docs[0].data() as Project);
  }
  const projects = await getProjects();
  return projects[0] ?? null;
}

export async function createProject(
  project: Omit<Project, "createdAt" | "adminUsername" | "adminPassword" | "isActive">
): Promise<void> {
  await setDoc(
    doc(db, PROJECTS_COL, project.id),
    stripUndefined({
      id: project.id,
      name: project.name,
      slug: project.slug,
      description: project.description,
      isActive: false,
      adminUsername: DEFAULT_PROJECT_ADMIN_USERNAME,
      // TODO: hash before storing in production
      adminPassword: DEFAULT_PROJECT_ADMIN_PASSWORD,
      createdAt: serverTimestamp(),
    })
  );
}

export async function updateProject(
  id: string,
  updates: Partial<Project>
): Promise<void> {
  const ref = await resolveProjectDoc(id);
  if (!ref) {
    throw new Error("Project not found.");
  }
  await updateDoc(
    ref,
    stripUndefined(updates) as UpdateData<Project>
  );
}

export async function deleteProject(id: string): Promise<void> {
  const snap = await getDocs(collection(db, PROJECTS_COL));
  const docs = snap.docs;
  if (docs.length <= 1) {
    throw new Error("At least one project must always exist.");
  }

  const target = docs.find((d) => {
    const data = d.data() as { id?: unknown };
    return d.id === id || data.id === id;
  });
  if (!target) {
    throw new Error("Project not found.");
  }

  const targetData = target.data() as { isActive?: unknown };
  const targetIsActive = targetData.isActive === true;
  const remaining = docs.filter((d) => d.id !== target.id);
  const hasActiveRemaining = remaining.some((d) => (d.data() as { isActive?: unknown }).isActive === true);
  const nextActive = remaining[0] ?? null;

  const batch = writeBatch(db);
  batch.delete(target.ref);

  // Keep exactly one active project after deletion.
  if (targetIsActive || !hasActiveRemaining) {
    for (const d of remaining) {
      batch.update(d.ref, { isActive: nextActive ? d.id === nextActive.id : false });
    }
  }

  await batch.commit();
}

export async function setOnlyActiveProject(projectId: string): Promise<void> {
  const snap = await getDocs(collection(db, PROJECTS_COL));
  const batch = writeBatch(db);
  for (const d of snap.docs) {
    const data = d.data() as { id?: unknown };
    const matches = d.id === projectId || data.id === projectId;
    batch.update(d.ref, { isActive: matches });
  }
  await batch.commit();
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
  const ref = await resolveItemDoc(id, data.projectId);
  if (!ref) {
    throw new Error("Item not found.");
  }
  const payload = stripUndefined(data) as UpdateData<Item>;
  // Clearing position in UI sends `displayPosition: undefined`; explicitly delete the field.
  if (
    Object.prototype.hasOwnProperty.call(data, "displayPosition") &&
    data.displayPosition === undefined
  ) {
    (payload as Record<string, unknown>).displayPosition = deleteField();
  }
  await updateDoc(
    ref,
    payload
  );
}

/**
 * Permanently delete an item document.
 * The associated image in Storage is NOT deleted here — call deleteImage() separately.
 */
export async function deleteItem(id: string): Promise<void> {
  const itemRef = await resolveItemDoc(id);
  if (!itemRef) {
    throw new Error("Item not found.");
  }
  const snap = await getDoc(itemRef);
  const item = snap.exists() ? (snap.data() as Item) : null;

  await deleteDoc(itemRef);

  const imageUrl = item?.imageUrl;
  if (!imageUrl || !imageUrl.startsWith("http")) return;
  try {
    // Firebase SDK accepts download URLs here and resolves them to object refs.
    const fileRef = storageRef(storage, imageUrl);
    await deleteObject(fileRef);
  } catch (err) {
    // Keep document deletion successful even if the storage object cannot be resolved/deleted.
    console.warn("[firestore] item deleted but storage cleanup failed:", err);
  }
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
