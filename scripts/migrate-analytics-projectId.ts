/**
 * scripts/migrate-analytics-projectId.ts
 *
 * Backfills the `projectId` field on analytics events that were recorded
 * before per-project scoping was added.
 *
 * Run from the project root:
 *   npm run migrate:analytics-projectid
 *
 * Prerequisites:
 *   • secrets/serviceAccount.json must exist
 *   • The target project must already exist in Firestore
 *
 * Safe to re-run — only updates events where projectId is missing or empty.
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

const TARGET_PROJECT_ID = "student-kit";
const BATCH_SIZE = 400;

// ─── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log(`\n🔄  Backfilling projectId on analytics events → "${TARGET_PROJECT_ID}"...\n`);

  const snap = await db.collection("analytics").get();

  if (snap.empty) {
    console.log("   ℹ  No analytics events found — nothing to update.\n");
    console.log("✅  Done.\n");
    return;
  }

  const untagged = snap.docs.filter((d) => {
    const data = d.data() as { projectId?: string };
    return !data.projectId || data.projectId.trim() === "";
  });

  if (untagged.length === 0) {
    console.log(`   ℹ  All ${snap.size} event(s) already have a projectId — nothing to do.\n`);
    console.log("✅  Done.\n");
    return;
  }

  console.log(`   Found ${untagged.length} untagged event(s) out of ${snap.size} total.\n`);

  let updated = 0;
  for (let i = 0; i < untagged.length; i += BATCH_SIZE) {
    const batch = db.batch();
    const chunk = untagged.slice(i, i + BATCH_SIZE);
    for (const d of chunk) {
      batch.update(d.ref, { projectId: TARGET_PROJECT_ID });
    }
    await batch.commit();
    updated += chunk.length;
    console.log(`   ✓  ${updated} / ${untagged.length} updated`);
  }

  console.log(`\n✅  Backfilled projectId on ${updated} analytics event(s).\n`);
}

main().catch((err) => {
  console.error("\n❌  Migration failed:", err, "\n");
  process.exit(1);
});
