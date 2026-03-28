/**
 * scripts/migrate-images.ts
 *
 * Uploads every local image from /public to Firebase Storage,
 * then updates each Firestore document's imageUrl to the Storage download URL.
 *
 * Run from the project root:
 *   npm run migrate:images
 *
 * Safe to re-run — skips items whose imageUrl already starts with "https://".
 */

import * as admin from "firebase-admin";
import * as dotenv from "dotenv";
import { readFileSync, existsSync } from "fs";
import { resolve, extname } from "path";
import { randomUUID } from "crypto";
import { DEFAULT_DATA } from "../data/defaultData";

// Load .env.local so NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET is available
dotenv.config({ path: resolve(process.cwd(), ".env.local") });

// ─── Firebase Admin init ───────────────────────────────────────────────────────

const serviceAccountPath = resolve(process.cwd(), "secrets/serviceAccount.json");

let serviceAccount: admin.ServiceAccount;
try {
  serviceAccount = JSON.parse(readFileSync(serviceAccountPath, "utf-8"));
} catch {
  console.error("\n❌  Could not read secrets/serviceAccount.json\n");
  process.exit(1);
}

const storageBucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
if (!storageBucket) {
  console.error(
    "\n❌  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET is not set in .env.local\n"
  );
  process.exit(1);
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket,
});

const db = admin.firestore();
const bucket = admin.storage().bucket();

// ─── Content-type map ──────────────────────────────────────────────────────────

const MIME: Record<string, string> = {
  ".png":  "image/png",
  ".jpg":  "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".avif": "image/avif",
  ".gif":  "image/gif",
  ".svg":  "image/svg+xml",
};

// ─── Helpers ───────────────────────────────────────────────────────────────────

/** Upload a single file and return its permanent Firebase Storage download URL. */
async function uploadFile(
  localPath: string,
  storagePath: string,
  contentType: string
): Promise<string> {
  const buffer = readFileSync(localPath);
  // Generate a stable download token up-front so the URL is always valid
  const downloadToken = randomUUID();
  const file = bucket.file(storagePath);
  await file.save(buffer, {
    metadata: {
      contentType,
      metadata: { firebaseStorageDownloadTokens: downloadToken },
    },
  });
  const encoded = encodeURIComponent(storagePath);
  return `https://firebasestorage.googleapis.com/v0/b/${storageBucket}/o/${encoded}?alt=media&token=${downloadToken}`;
}

// ─── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  const snap = await db.collection("items").get();
  const items = snap.docs.map((d) => ({ id: d.id, ...d.data() } as { id: string; imageUrl: string; [k: string]: unknown }));

  // Build id → original local path map from defaultData (source of truth for filenames)
  const originalUrls = new Map<string, string>();
  for (const flat of DEFAULT_DATA.flats) {
    for (const room of flat.rooms) {
      for (const item of room.items) {
        originalUrls.set(item.id, item.imageUrl);
      }
    }
  }

  // Upload if: no https yet, OR broken token=undefined from previous failed run
  const toMigrate = items.filter(
    (item) =>
      !item.imageUrl?.startsWith("https://") || item.imageUrl.includes("token=undefined")
  );
  const alreadyDone = items.length - toMigrate.length;

  console.log(`\n📦  ${items.length} items total`);
  if (alreadyDone > 0) console.log(`   ✓  ${alreadyDone} already on Storage — skipping`);
  console.log(`🔄  Uploading ${toMigrate.length} images...\n`);

  let uploaded = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const item of toMigrate) {
    // Always derive local path from defaultData — never from the (possibly broken) Firestore URL
    const originalUrl = originalUrls.get(item.id) ?? item.imageUrl;
    const localImagePath = originalUrl.startsWith("/") ? originalUrl.slice(1) : originalUrl;

    const fullLocalPath = resolve(process.cwd(), "public", localImagePath);
    const ext = extname(localImagePath).toLowerCase();
    const contentType = MIME[ext] ?? "application/octet-stream";
    const storagePath = `items/${item.id}${ext}`;

    if (!existsSync(fullLocalPath)) {
      console.warn(`   ⚠️   ${item.id}: file not found (${localImagePath}) — skipping`);
      skipped++;
      continue;
    }

    try {
      const downloadUrl = await uploadFile(fullLocalPath, storagePath, contentType);
      await db.collection("items").doc(item.id).update({ imageUrl: downloadUrl });
      uploaded++;
      console.log(`   ✓  [${uploaded}/${toMigrate.length}] ${item.id}`);
    } catch (err) {
      const msg = `${item.id}: ${(err as Error).message}`;
      errors.push(msg);
      console.error(`   ❌  ${msg}`);
    }
  }

  console.log(`\n✅  Done — ${uploaded} uploaded, ${skipped} skipped, ${errors.length} errors.\n`);
  if (errors.length) {
    console.log("Errors:\n" + errors.map((e) => `  • ${e}`).join("\n"), "\n");
  }
}

main().catch((err) => {
  console.error("\n❌  Script failed:", err, "\n");
  process.exit(1);
});
