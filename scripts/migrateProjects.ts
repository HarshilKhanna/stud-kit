/**
 * scripts/migrateProjects.ts
 *
 * Creates the default "student-kit" project in Firestore if it doesn't exist.
 * Sets it as the active project.
 *
 * Run from the project root:
 *   npm run migrate:projects
 *
 * Prerequisites:
 *   • secrets/serviceAccount.json must exist
 *   • Firestore rules must allow writes
 *
 * Safe to re-run — skips if project already exists.
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

// ─── Default project ───────────────────────────────────────────────────────────

const DEFAULT_PROJECT = {
  id: "student-kit",
  name: "Student Kit",
  slug: "student-kit",
  description: "Essential items for Indian students heading abroad.",
  isActive: true,
  adminUsername: "admin",
  adminPassword: "admin1234",
};

// ─── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log("\n🔄  Running project migration...\n");

  const snap = await db.collection("projects").get();

  if (!snap.empty) {
    console.log(`   ℹ  Found ${snap.size} existing project(s):`);
    snap.docs.forEach((d) => {
      const data = d.data() as { name?: string; isActive?: boolean };
      console.log(`      • ${d.id} — "${data.name}" (active: ${data.isActive})`);
    });

    const hasDefault = snap.docs.some((d) => d.id === DEFAULT_PROJECT.id);
    if (hasDefault) {
      console.log(`\n✅  Project "${DEFAULT_PROJECT.id}" already exists — skipping.\n`);
      return;
    }
  }

  // Deactivate all existing projects first, then create the new default as active
  if (!snap.empty) {
    const batch = db.batch();
    snap.docs.forEach((d) => batch.update(d.ref, { isActive: false }));
    await batch.commit();
    console.log(`\n   ✓  Deactivated ${snap.size} existing project(s).`);
  }

  await db.collection("projects").doc(DEFAULT_PROJECT.id).set({
    ...DEFAULT_PROJECT,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  console.log(`\n✅  Created project "${DEFAULT_PROJECT.id}" (active: true).\n`);
}

main().catch((err) => {
  console.error("\n❌  Migration failed:", err, "\n");
  process.exit(1);
});
