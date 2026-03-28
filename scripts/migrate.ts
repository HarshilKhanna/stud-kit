/**
 * scripts/migrate.ts
 *
 * One-time migration: seeds Firestore with every item from defaultData.ts.
 *
 * Run from the project root:
 *   npm run migrate
 *
 * Prerequisites:
 *   • secrets/serviceAccount.json must exist (Firebase Console → Project Settings
 *     → Service Accounts → Generate new private key)
 *   • Firestore rules must allow writes while the script runs (Testing Mode is fine)
 *
 * Safe to re-run — uses setDoc (upsert) so existing documents are overwritten.
 */

import * as admin from "firebase-admin";
import { readFileSync } from "fs";
import { resolve } from "path";
import { DEFAULT_DATA } from "../data/defaultData";
import type { Item } from "../types";

// ─── Firebase Admin init ───────────────────────────────────────────────────────

const serviceAccountPath = resolve(process.cwd(), "secrets/serviceAccount.json");

let serviceAccount: admin.ServiceAccount;
try {
  serviceAccount = JSON.parse(readFileSync(serviceAccountPath, "utf-8"));
} catch {
  console.error(
    "\n❌  Could not read secrets/serviceAccount.json\n" +
      "    Download it from Firebase Console → Project Settings → Service Accounts\n" +
      "    and save it as secrets/serviceAccount.json\n"
  );
  process.exit(1);
}

admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

// ─── Helpers ───────────────────────────────────────────────────────────────────

function flattenItems(): Item[] {
  return DEFAULT_DATA.flats.flatMap((flat) =>
    flat.rooms.flatMap((room) => room.items)
  );
}

// ─── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  const items = flattenItems();
  console.log(`\n🔄  Migrating ${items.length} items to Firestore...\n`);

  // Firestore batches support max 500 writes — chunk to be safe
  const BATCH_SIZE = 400;
  let written = 0;

  for (let i = 0; i < items.length; i += BATCH_SIZE) {
    const batch = db.batch();
    const chunk = items.slice(i, i + BATCH_SIZE);

    for (const item of chunk) {
      const ref = db.collection("items").doc(item.id);
      batch.set(ref, item);
    }

    await batch.commit();
    written += chunk.length;
    console.log(`   ✓  ${written} / ${items.length} written`);
  }

  console.log(`\n✅  Migration complete — ${written} items in Firestore.\n`);
}

main().catch((err) => {
  console.error("\n❌  Migration failed:", err, "\n");
  process.exit(1);
});
