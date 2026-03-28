import { collection, addDoc, serverTimestamp } from "firebase/firestore";
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
 * Fetch all analytics events for the admin panel.
 * Returns documents sorted newest-first.
 */
export async function getAllEvents(): Promise<AnalyticsEvent[]> {
  const { getDocs, query, orderBy, limit } = await import("firebase/firestore");
  const snap = await getDocs(
    query(
      collection(db, COL),
      orderBy("timestamp", "desc"),
      limit(MAX_EVENTS_FOR_DASHBOARD),
    ),
  );
  return snap.docs.map((d) => ({
    id: d.id,
    ...(d.data() as Omit<AnalyticsEvent, "id">),
  }));
}
