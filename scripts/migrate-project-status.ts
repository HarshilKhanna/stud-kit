/**
 * scripts/migrate-project-status.ts
 *
 * Migrates projects that use the legacy `status: "active" | "inactive"` string
 * field to the current `isActive: boolean` field.
 *
 * Run from the project root:
 *   npm run migrate:project-status
 *
 * Prerequisites:
 *   • secrets/serviceAccount.json must exist
 *
 * Safe to re-run — skips projects that already have a boolean isActive field.
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

// ─── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log("\n🔄  Migrating project status fields...\n");

  const snap = await db.collection("projects").get();

  if (snap.empty) {
    console.log("   ℹ  No projects found — nothing to migrate.\n");
    console.log("✅  Done.\n");
    return;
  }

  const needsMigration = snap.docs.filter((d) => {
    const data = d.data() as { isActive?: unknown; status?: unknown };
    return typeof data.isActive !== "boolean";
  });

  if (needsMigration.length === 0) {
    console.log(`   ℹ  All ${snap.size} project(s) already use isActive boolean — nothing to do.\n`);
    console.log("✅  Done.\n");
    return;
  }

  console.log(`   Found ${needsMigration.length} project(s) needing status migration.\n`);

  const batch = db.batch();
  for (const d of needsMigration) {
    const data = d.data() as { isActive?: unknown; status?: unknown };
    const isActive =
      typeof data.isActive === "boolean"
        ? data.isActive
        : String(data.status ?? "").toLowerCase() === "active";

    batch.update(d.ref, {
      isActive,
      status: admin.firestore.FieldValue.delete(),
    });

    console.log(`   • ${d.id}: status="${data.status}" → isActive=${isActive}`);
  }

  await batch.commit();
  console.log(`\n✅  Migrated ${needsMigration.length} project(s).\n`);
}

main().catch((err) => {
  console.error("\n❌  Migration failed:", err, "\n");
  process.exit(1);
});
