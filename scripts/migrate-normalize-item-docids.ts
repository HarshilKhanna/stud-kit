/**
 * scripts/migrate-normalize-item-docids.ts
 *
 * Ensures every item's Firestore document ID matches its `item.id` field.
 * Items where the doc ID differs from item.id are re-created under the correct
 * doc ID and the old document is deleted.
 *
 * Run from the project root:
 *   npm run migrate:normalize-item-docids
 *
 * Prerequisites:
 *   • secrets/serviceAccount.json must exist
 *
 * Safe to re-run — only touches docs where doc ID ≠ item.id.
 */

import * as admin from "firebase-admin";
import { readFileSync } from "fs";
import { resolve } from "path";

// ─── Firebase Admin init ───────────────────────────────────────────────────────

const serviceAccountPath = resolve(process.cwd(), "secrets/serviceAccount.json");

let serviceAccount: admin.ServiceAccount;
try {
  serviceAccount = JSON.parse(readFileSync(serviceAccountPath, "utf-8"));
} catch {
  console.error(
    "\n❌  Could not read secrets/serviceAccount.json\n" +
      "    Download it from Firebase Console → Project Settings → Service Accounts\n"
  );
  process.exit(1);
}

admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

const BATCH_SIZE = 400;

// ─── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log("\n🔄  Normalizing item document IDs...\n");

  const snap = await db.collection("items").get();
  const mismatched = snap.docs.filter((d) => {
    const data = d.data() as { id?: string };
    return typeof data.id === "string" && data.id.trim() !== "" && data.id !== d.id;
  });

  if (mismatched.length === 0) {
    console.log("   ℹ  All item doc IDs are already normalized — nothing to do.\n");
    console.log("✅  Done.\n");
    return;
  }

  console.log(`   Found ${mismatched.length} item(s) with mismatched doc IDs.\n`);

  let fixed = 0;
  // Process in chunks — each chunk does 2 ops per item (set + delete)
  const chunkSize = Math.floor(BATCH_SIZE / 2);
  for (let i = 0; i < mismatched.length; i += chunkSize) {
    const batch = db.batch();
    const chunk = mismatched.slice(i, i + chunkSize);

    for (const d of chunk) {
      const data = d.data() as { id: string };
      const correctDocRef = db.collection("items").doc(data.id);
      batch.set(correctDocRef, d.data());
      batch.delete(d.ref);
    }

    await batch.commit();
    fixed += chunk.length;
    console.log(`   ✓  ${fixed} / ${mismatched.length} fixed`);
  }

  console.log(`\n✅  Normalized ${fixed} item document ID(s).\n`);
}

main().catch((err) => {
  console.error("\n❌  Migration failed:", err, "\n");
  process.exit(1);
});
