import {
  collection,
  addDoc,
  getDocs,
  onSnapshot,
  query,
  orderBy,
  limit,
  serverTimestamp,
  type QuerySnapshot,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

/**
 * Cap reads so the admin dashboard stays fast as the collection grows.
 * Firestore rejects `limit()` above 10_000 per query (hard server max).
 */
const MAX_EVENTS_FOR_DASHBOARD = 10_000;

export interface AnalyticsEvent {
  id: string;
  type: string;
  payload: Record<string, string>;
  timestamp: { seconds: number; nanoseconds: number } | null;
}

const COL = "analytics";

function mapSnap(snap: QuerySnapshot): AnalyticsEvent[] {
  return snap.docs.map((d) => ({
    id: d.id,
    ...(d.data() as Omit<AnalyticsEvent, "id">),
  }));
}

/**
 * Fire-and-forget analytics write. Never throws or blocks the UI.
 */
export function trackEvent(
  type: string,
  payload: Record<string, string>
): void {
  addDoc(collection(db, COL), {
    type,
    payload,
    timestamp: serverTimestamp(),
  }).catch((err) => {
    console.debug("[analytics] write failed:", err);
  });
}

/**
 * Fetch all analytics events for the admin panel (one-shot).
 */
export async function getAllEvents(): Promise<AnalyticsEvent[]> {
  const snap = await getDocs(
    query(collection(db, COL), orderBy("timestamp", "desc"), limit(MAX_EVENTS_FOR_DASHBOARD))
  );
  return mapSnap(snap);
}

/**
 * Real-time subscription to analytics events, newest-first.
 * Returns an unsubscribe function.
 */
export function subscribeAllEvents(
  onEvents: (events: AnalyticsEvent[]) => void,
  onError?: (err: Error) => void,
): () => void {
  return onSnapshot(
    query(collection(db, COL), orderBy("timestamp", "desc"), limit(MAX_EVENTS_FOR_DASHBOARD)),
    (snap) => onEvents(mapSnap(snap)),
    (err) => onError?.(err as Error),
  );
}
