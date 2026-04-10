/**
 * scripts/migrate-items-to-project1.ts
 *
 * Assigns all items that have no projectId to the "student-kit" project.
 *
 * Run from the project root:
 *   npm run migrate:items-to-project1
 *
 * Prerequisites:
 *   • secrets/serviceAccount.json must exist
 *   • The "student-kit" project must already exist (run migrate:projects first)
 *
 * Safe to re-run — only updates items where projectId is missing or empty.
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
  console.log(`\n🔄  Assigning unlinked items to project "${TARGET_PROJECT_ID}"...\n`);

  // Verify the project exists
  const projectSnap = await db.collection("projects").doc(TARGET_PROJECT_ID).get();
  if (!projectSnap.exists) {
    console.error(`\n❌  Project "${TARGET_PROJECT_ID}" not found in Firestore.\n` +
      "    Run: npm run migrate:projects\n");
    process.exit(1);
  }

  const snap = await db.collection("items").get();
  const unlinked = snap.docs.filter((d) => {
    const data = d.data() as { projectId?: string };
    return !data.projectId || data.projectId.trim() === "";
  });

  if (unlinked.length === 0) {
    console.log("   ℹ  All items already have a projectId — nothing to update.\n");
    console.log(`✅  Done.\n`);
    return;
  }

  console.log(`   Found ${unlinked.length} unlinked item(s) out of ${snap.size} total.\n`);

  let updated = 0;
  for (let i = 0; i < unlinked.length; i += BATCH_SIZE) {
    const batch = db.batch();
    const chunk = unlinked.slice(i, i + BATCH_SIZE);
    for (const d of chunk) {
      batch.update(d.ref, { projectId: TARGET_PROJECT_ID });
    }
    await batch.commit();
    updated += chunk.length;
    console.log(`   ✓  ${updated} / ${unlinked.length} updated`);
  }

  console.log(`\n✅  Linked ${updated} item(s) to project "${TARGET_PROJECT_ID}".\n`);
}

main().catch((err) => {
  console.error("\n❌  Migration failed:", err, "\n");
  process.exit(1);
});
