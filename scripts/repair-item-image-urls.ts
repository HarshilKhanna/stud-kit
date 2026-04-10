/**
 * scripts/repair-item-image-urls.ts
 *
 * Scans all items in Firestore and repairs imageUrl fields by:
 *   1. Replacing legacy absolute `/public/…` paths with root-relative `/…` paths.
 *   2. Setting a fallback empty string for items with no imageUrl at all.
 *
 * Run from the project root:
 *   npm run repair:item-image-urls
 *
 * Prerequisites:
 *   • secrets/serviceAccount.json must exist
 *
 * Safe to re-run — only updates items whose imageUrl needs fixing.
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

function repairUrl(url: unknown): { repaired: string; changed: boolean } {
  if (typeof url !== "string" || url.trim() === "") {
    return { repaired: "", changed: typeof url !== "string" || url !== "" };
  }
  const trimmed = url.trim();

  // Fix: "/public/foo.webp" → "/foo.webp"
  if (trimmed.startsWith("/public/")) {
    return { repaired: trimmed.replace(/^\/public/, ""), changed: true };
  }

  return { repaired: trimmed, changed: false };
}

// ─── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log("\n🔄  Repairing item imageUrl fields...\n");

  const snap = await db.collection("items").get();

  if (snap.empty) {
    console.log("   ℹ  No items found — nothing to repair.\n");
    console.log("✅  Done.\n");
    return;
  }

  const toFix: Array<{ ref: admin.firestore.DocumentReference; repairedUrl: string; originalUrl: unknown }> = [];

  for (const d of snap.docs) {
    const data = d.data() as { imageUrl?: unknown };
    const { repaired, changed } = repairUrl(data.imageUrl);
    if (changed) {
      toFix.push({ ref: d.ref, repairedUrl: repaired, originalUrl: data.imageUrl });
    }
  }

  if (toFix.length === 0) {
    console.log(`   ℹ  All ${snap.size} item(s) have valid imageUrl fields — nothing to fix.\n`);
    console.log("✅  Done.\n");
    return;
  }

  console.log(`   Found ${toFix.length} item(s) with imageUrl issues:\n`);
  toFix.forEach(({ ref, originalUrl, repairedUrl }) => {
    console.log(`   • ${ref.id}: "${originalUrl}" → "${repairedUrl}"`);
  });
  console.log();

  let fixed = 0;
  for (let i = 0; i < toFix.length; i += BATCH_SIZE) {
    const batch = db.batch();
    const chunk = toFix.slice(i, i + BATCH_SIZE);
    for (const { ref, repairedUrl } of chunk) {
      batch.update(ref, { imageUrl: repairedUrl });
    }
    await batch.commit();
    fixed += chunk.length;
    console.log(`   ✓  ${fixed} / ${toFix.length} repaired`);
  }

  console.log(`\n✅  Repaired imageUrl on ${fixed} item(s).\n`);
}

main().catch((err) => {
  console.error("\n❌  Repair failed:", err, "\n");
  process.exit(1);
});
