/**
 * scripts/seed-migrate.ts
 *
 * Seeds Firestore with STUDENT_ITEMS, uploading each local public/ image
 * to Firebase Storage first, then writing the item with the Storage URL.
 *
 * Run from the project root:
 *   npx tsx scripts/seed-migrate.ts
 *
 * Prerequisites:
 *   • secrets/serviceAccount.json must exist
 *   • Local images must be present under public/
 *
 * Safe to run only once — aborts if any items already exist in Firestore.
 */

import * as admin from "firebase-admin";
import { readFileSync } from "fs";
import { resolve, extname } from "path";
import { randomUUID } from "crypto";

// ─── Firebase Admin init ──────────────────────────────────────────────────────

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

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: "student-kit-eee08.firebasestorage.app",
});

const db = admin.firestore();
const bucket = admin.storage().bucket();

// ─── Inline item data (no @/ alias in Node scripts) ──────────────────────────

type Region = "us-cold" | "us-warm" | "uk" | "canada" | "europe-west" | "australia" | "singapore" | "middle-east";
type AccommodationType = "dorm-furnished" | "dorm-unfurnished" | "shared-apt" | "solo-apt";
type Priority = "day-1" | "week-1" | "month-1" | "optional";
type Source = "bring-from-india" | "buy-there" | "either";
type BudgetTier = "tight" | "comfortable" | "flexible";

interface Item {
  id: string;
  name: string;
  category: string;
  brand?: string;
  imageUrl: string;
  externalUrl: string;
  price?: { inr?: number; local?: number; localCurrency?: string };
  priority: Priority;
  source: Source;
  relevantRegions: Region[];
  relevantAccommodations: AccommodationType[];
  budgetTiers: BudgetTier[];
  tip?: string;
  availabilityNote?: string;
  indianCommunityNote?: string;
  specs?: Record<string, string>;
  cardSpecKeys?: string[];
  displayPosition?: number;
  projectId?: string;
}

const ALL_REGIONS: Region[] = ["us-cold", "us-warm", "uk", "canada", "europe-west", "australia", "singapore", "middle-east"];
const ALL_ACCOMMODATIONS: AccommodationType[] = ["dorm-furnished", "dorm-unfurnished", "shared-apt", "solo-apt"];
const ALL_BUDGET_TIERS: BudgetTier[] = ["tight", "comfortable", "flexible"];
const COOKING_ACCOMMODATIONS: AccommodationType[] = ["dorm-unfurnished", "shared-apt", "solo-apt"];
const COLD_REGIONS: Region[] = ["us-cold", "canada", "europe-west", "uk"];

const PUB = {
  travelAdapter: "/SHARP-Universal-Travel-Adapter-International-Wall-Charger-Worldwide-AC-Plug-Adaptor-with-3-USB-A-and-1-USB-Type-C-for-USA-EU-UK-AUS-White_5beb6dff-2519-46ad-a007-df6bdc7e1.webp",
  indianGroceries: "/indianmixes.webp",
} as const;

const STUDENT_ITEMS: Item[] = [
  {
    id: "pressure-cooker-2l",
    name: "Pressure Cooker (small, 2L)",
    category: "Kitchen & Cooking",
    brand: "Hawkins / Prestige class",
    imageUrl: PUB.indianGroceries,
    externalUrl: "https://www.amazon.in/s?k=2+liter+pressure+cooker",
    price: { inr: 1800, local: 65, localCurrency: "USD" },
    priority: "day-1",
    source: "bring-from-india",
    relevantRegions: ALL_REGIONS,
    relevantAccommodations: COOKING_ACCOMMODATIONS,
    budgetTiers: ALL_BUDGET_TIERS,
    tip: "A 2L pressure cooker is the single most recommended thing by every Indian student abroad.",
    availabilityNote: "Available abroad but often 3–4× the price.",
    specs: { Size: "2 L", Fuel: "Gas or induction (check dorm rules)" },
    cardSpecKeys: ["Size"],
  },
  {
    id: "universal-travel-adapter",
    name: "Universal Travel Adapter",
    category: "Electronics & Adapters",
    imageUrl: PUB.travelAdapter,
    externalUrl: "https://www.amazon.in/s?k=universal+travel+adapter+usb+c+type",
    price: { inr: 450, local: 18, localCurrency: "USD" },
    priority: "day-1",
    source: "bring-from-india",
    relevantRegions: ALL_REGIONS,
    relevantAccommodations: ALL_ACCOMMODATIONS,
    budgetTiers: ALL_BUDGET_TIERS,
    tip: "Get one with USB-C and USB-A.",
    specs: { Ports: "USB-A + USB-C", Type: "Universal sockets" },
    cardSpecKeys: ["Ports"],
  },
  {
    id: "heavy-winter-jacket",
    name: "Heavy Winter Jacket (rated cold)",
    category: "Clothing & Weather",
    imageUrl: "/heavywinterjacket.webp",
    externalUrl: "https://www.amazon.com/s?k=winter+jacket+men+insulated+cold+weather",
    price: { local: 120, localCurrency: "USD" },
    priority: "day-1",
    source: "buy-there",
    relevantRegions: COLD_REGIONS,
    relevantAccommodations: ALL_ACCOMMODATIONS,
    budgetTiers: ALL_BUDGET_TIERS,
    specs: { Rating: "Look for fill weight / °C rating on tag" },
    cardSpecKeys: ["Rating"],
  },
  {
    id: "indian-spice-box",
    name: "Indian Spice Box (Masala Dabba)",
    category: "Food & Groceries (non-perishable Indian staples)",
    imageUrl: PUB.indianGroceries,
    externalUrl: "https://www.amazon.in/s?k=masala+dabba+spice+box",
    price: { inr: 350, local: 25, localCurrency: "USD" },
    priority: "week-1",
    source: "bring-from-india",
    relevantRegions: ALL_REGIONS,
    relevantAccommodations: COOKING_ACCOMMODATIONS,
    budgetTiers: ALL_BUDGET_TIERS,
    specs: { Compartments: "7 small tins" },
    cardSpecKeys: ["Compartments"],
  },
  {
    id: "bedding-set",
    name: "Bedding Set (fitted sheet + duvet cover)",
    category: "Bedding & Sleep",
    imageUrl: "/beddingset.webp",
    externalUrl: "https://www.amazon.com/s?k=twin+xl+fitted+sheet+set+college",
    price: { local: 35, localCurrency: "USD" },
    priority: "day-1",
    source: "buy-there",
    relevantRegions: ALL_REGIONS,
    relevantAccommodations: ["dorm-furnished", "dorm-unfurnished"],
    budgetTiers: ALL_BUDGET_TIERS,
    specs: { Size: "Twin XL (US/CA dorms)" },
    cardSpecKeys: ["Size"],
  },
  {
    id: "mattress-topper",
    name: "Mattress Topper",
    category: "Bedding & Sleep",
    imageUrl: "/mattresstopper.webp",
    externalUrl: "https://www.amazon.com/s?k=twin+xl+mattress+topper+memory+foam",
    price: { local: 45, localCurrency: "USD" },
    priority: "week-1",
    source: "buy-there",
    relevantRegions: ALL_REGIONS,
    relevantAccommodations: ["dorm-furnished", "dorm-unfurnished"],
    budgetTiers: ["comfortable", "flexible"],
    specs: { Size: "Twin XL", Thickness: "2–3 inches" },
    cardSpecKeys: ["Thickness"],
  },
  {
    id: "compressible-pillow",
    name: "Compressible Travel Pillow",
    category: "Bedding & Sleep",
    imageUrl: "/compressiblepillow.webp",
    externalUrl: "https://www.amazon.in/s?k=compressible+travel+pillow",
    price: { inr: 800, local: 20, localCurrency: "USD" },
    priority: "day-1",
    source: "bring-from-india",
    relevantRegions: ALL_REGIONS,
    relevantAccommodations: ALL_ACCOMMODATIONS,
    budgetTiers: ALL_BUDGET_TIERS,
    specs: { Fill: "Down-alternative or hollow fibre" },
    cardSpecKeys: ["Fill"],
  },
  {
    id: "quick-dry-microfibre-towels",
    name: "Quick-dry Microfibre Towels (set of 2)",
    category: "Bathroom & Toiletries",
    imageUrl: "/quickdrymicro.webp",
    externalUrl: "https://www.amazon.in/s?k=microfibre+quick+dry+towel+set",
    price: { inr: 500, local: 15, localCurrency: "USD" },
    priority: "day-1",
    source: "bring-from-india",
    relevantRegions: ALL_REGIONS,
    relevantAccommodations: ALL_ACCOMMODATIONS,
    budgetTiers: ALL_BUDGET_TIERS,
    specs: { Size: "Bath + hand towel" },
    cardSpecKeys: ["Size"],
  },
  {
    id: "shower-flip-flops",
    name: "Shower Flip-flops",
    category: "Bathroom & Toiletries",
    imageUrl: "/showerflipflops.webp",
    externalUrl: "https://www.amazon.in/s?k=shower+flip+flops+rubber+waterproof",
    price: { inr: 200, local: 6, localCurrency: "USD" },
    priority: "day-1",
    source: "either",
    relevantRegions: ALL_REGIONS,
    relevantAccommodations: ["dorm-furnished", "dorm-unfurnished"],
    budgetTiers: ALL_BUDGET_TIERS,
    specs: { Material: "Rubber / EVA" },
    cardSpecKeys: ["Material"],
  },
  {
    id: "refillable-toiletry-bottles",
    name: "Refillable Toiletry Bottles (TSA-set)",
    category: "Bathroom & Toiletries",
    imageUrl: "/refillabletoileterybottles.webp",
    externalUrl: "https://www.amazon.in/s?k=refillable+travel+toiletry+bottles+set",
    price: { inr: 250, local: 8, localCurrency: "USD" },
    priority: "day-1",
    source: "bring-from-india",
    relevantRegions: ALL_REGIONS,
    relevantAccommodations: ALL_ACCOMMODATIONS,
    budgetTiers: ALL_BUDGET_TIERS,
    specs: { Volume: "≤100 ml each (airline-legal)" },
    cardSpecKeys: ["Volume"],
  },
  {
    id: "laundry-bag",
    name: "Laundry Bag (drawstring mesh)",
    category: "Cleaning & Laundry",
    imageUrl: "/laundrybag.webp",
    externalUrl: "https://www.amazon.in/s?k=mesh+laundry+bag+drawstring",
    price: { inr: 150, local: 5, localCurrency: "USD" },
    priority: "day-1",
    source: "bring-from-india",
    relevantRegions: ALL_REGIONS,
    relevantAccommodations: ALL_ACCOMMODATIONS,
    budgetTiers: ALL_BUDGET_TIERS,
    specs: { Material: "Mesh" },
    cardSpecKeys: ["Material"],
  },
  {
    id: "extension-cord",
    name: "Multi-outlet Extension Cord",
    category: "Electronics & Adapters",
    imageUrl: "/extension.webp",
    externalUrl: "https://www.amazon.com/s?k=surge+protector+extension+cord+6+outlet",
    price: { local: 18, localCurrency: "USD" },
    priority: "day-1",
    source: "buy-there",
    relevantRegions: ALL_REGIONS,
    relevantAccommodations: ALL_ACCOMMODATIONS,
    budgetTiers: ALL_BUDGET_TIERS,
    specs: { Outlets: "6+", Cable: "6 ft" },
    cardSpecKeys: ["Outlets"],
  },
  {
    id: "usb-c-hub",
    name: "USB-C Hub (multiport)",
    category: "Electronics & Adapters",
    imageUrl: "/usbchub.webp",
    externalUrl: "https://www.amazon.in/s?k=usb+c+hub+multiport+hdmi+ethernet",
    price: { inr: 1800, local: 35, localCurrency: "USD" },
    priority: "week-1",
    source: "bring-from-india",
    relevantRegions: ALL_REGIONS,
    relevantAccommodations: ALL_ACCOMMODATIONS,
    budgetTiers: ["comfortable", "flexible"],
    specs: { Ports: "HDMI + USB-A + SD + Ethernet" },
    cardSpecKeys: ["Ports"],
  },
  {
    id: "desk-lamp",
    name: "LED Desk Lamp",
    category: "Study & Workspace",
    imageUrl: "/desklamp.webp",
    externalUrl: "https://www.amazon.com/s?k=led+desk+lamp+dimmable+usb+charging",
    price: { local: 25, localCurrency: "USD" },
    priority: "week-1",
    source: "buy-there",
    relevantRegions: ALL_REGIONS,
    relevantAccommodations: ALL_ACCOMMODATIONS,
    budgetTiers: ALL_BUDGET_TIERS,
    specs: { Light: "LED dimmable", USB: "Charging port on base" },
    cardSpecKeys: ["USB"],
  },
  {
    id: "laptop-stand",
    name: "Portable Laptop Stand",
    category: "Study & Workspace",
    imageUrl: "/laptopstand.webp",
    externalUrl: "https://www.amazon.in/s?k=portable+laptop+stand+foldable+aluminium",
    price: { inr: 900, local: 20, localCurrency: "USD" },
    priority: "week-1",
    source: "either",
    relevantRegions: ALL_REGIONS,
    relevantAccommodations: ALL_ACCOMMODATIONS,
    budgetTiers: ["comfortable", "flexible"],
    specs: { Material: "Aluminium", Foldable: "Yes" },
    cardSpecKeys: ["Material"],
  },
  {
    id: "noise-cancelling-earbuds",
    name: "Noise-Cancelling Earbuds / Headphones",
    category: "Study & Workspace",
    imageUrl: "/noisecancellingearbuds.webp",
    externalUrl: "https://www.amazon.in/s?k=noise+cancelling+earbuds+anc",
    price: { inr: 3500, local: 60, localCurrency: "USD" },
    priority: "week-1",
    source: "bring-from-india",
    relevantRegions: ALL_REGIONS,
    relevantAccommodations: ALL_ACCOMMODATIONS,
    budgetTiers: ["comfortable", "flexible"],
    specs: { Type: "ANC", Battery: "≥20 h playback" },
    cardSpecKeys: ["Battery"],
  },
  {
    id: "scientific-calculator",
    name: "Scientific Calculator",
    category: "Study & Workspace",
    imageUrl: "/scentificcalc.webp",
    externalUrl: "https://www.amazon.in/s?k=casio+fx+991+scientific+calculator",
    price: { inr: 1200, local: 18, localCurrency: "USD" },
    priority: "day-1",
    source: "bring-from-india",
    relevantRegions: ALL_REGIONS,
    relevantAccommodations: ALL_ACCOMMODATIONS,
    budgetTiers: ALL_BUDGET_TIERS,
    tip: "Casio FX-991 series is accepted in most university exams. Verify your program's allowed models.",
    specs: { Model: "Casio FX-991 or equivalent" },
    cardSpecKeys: ["Model"],
  },
  {
    id: "notebook-and-pens",
    name: "Notebook + Pens set",
    category: "Study & Workspace",
    imageUrl: "/notebook+pens.webp",
    externalUrl: "https://www.amazon.in/s?k=a4+notebook+ruled+pack",
    price: { inr: 300, local: 8, localCurrency: "USD" },
    priority: "day-1",
    source: "bring-from-india",
    relevantRegions: ALL_REGIONS,
    relevantAccommodations: ALL_ACCOMMODATIONS,
    budgetTiers: ALL_BUDGET_TIERS,
    specs: { Pages: "200-page ruled" },
    cardSpecKeys: ["Pages"],
  },
  {
    id: "document-folder",
    name: "Document Folder / Organiser",
    category: "Documents & Admin",
    imageUrl: "/documentfolder.webp",
    externalUrl: "https://www.amazon.in/s?k=document+folder+a4+accordion+organiser",
    price: { inr: 400, local: 10, localCurrency: "USD" },
    priority: "day-1",
    source: "bring-from-india",
    relevantRegions: ALL_REGIONS,
    relevantAccommodations: ALL_ACCOMMODATIONS,
    budgetTiers: ALL_BUDGET_TIERS,
    specs: { Pockets: "13+ labelled tabs" },
    cardSpecKeys: ["Pockets"],
  },
  {
    id: "forex-card",
    name: "Forex / Multi-currency Card",
    category: "Documents & Admin",
    imageUrl: "/Forex-Card-768x511.webp",
    externalUrl: "https://www.niyo.com/global",
    price: { inr: 0 },
    priority: "day-1",
    source: "bring-from-india",
    relevantRegions: ALL_REGIONS,
    relevantAccommodations: ALL_ACCOMMODATIONS,
    budgetTiers: ALL_BUDGET_TIERS,
    tip: "Niyo Global or Wise — zero forex markup on most currencies.",
    specs: { Fees: "Zero markup (Niyo/Wise)" },
    cardSpecKeys: ["Fees"],
  },
  {
    id: "local-sim-card",
    name: "Local SIM Card",
    category: "Documents & Admin",
    imageUrl: "/simcard.webp",
    externalUrl: "https://www.google.com/search?q=best+prepaid+sim+card+for+international+students",
    price: { local: 15, localCurrency: "USD" },
    priority: "day-1",
    source: "buy-there",
    relevantRegions: ALL_REGIONS,
    relevantAccommodations: ALL_ACCOMMODATIONS,
    budgetTiers: ALL_BUDGET_TIERS,
    specs: { Data: "Unlimited or 30–50 GB plan" },
    cardSpecKeys: ["Data"],
  },
  {
    id: "ors-sachets",
    name: "ORS Sachets (Electrolyte)",
    category: "Health & Wellness",
    imageUrl: "/ors.webp",
    externalUrl: "https://www.amazon.in/s?k=ors+sachets+electrolyte",
    price: { inr: 100, local: 8, localCurrency: "USD" },
    priority: "week-1",
    source: "bring-from-india",
    relevantRegions: ALL_REGIONS,
    relevantAccommodations: ALL_ACCOMMODATIONS,
    budgetTiers: ALL_BUDGET_TIERS,
    specs: { Pack: "10–20 sachets" },
    cardSpecKeys: ["Pack"],
  },
  {
    id: "prescription-medicines",
    name: "Prescription Medicines (3-month supply)",
    category: "Health & Wellness",
    imageUrl: "/prescriptionmedicines.webp",
    externalUrl: "https://www.google.com/search?q=how+to+carry+prescription+medicine+international+flight",
    price: { inr: 0 },
    priority: "day-1",
    source: "bring-from-india",
    relevantRegions: ALL_REGIONS,
    relevantAccommodations: ALL_ACCOMMODATIONS,
    budgetTiers: ALL_BUDGET_TIERS,
    tip: "Bring doctor's letter + original pharmacy labels. Controlled substances need special declaration.",
    specs: { Supply: "90-day supply + doctor letter" },
    cardSpecKeys: ["Supply"],
  },
  {
    id: "spare-glasses",
    name: "Spare Spectacles / Contact Lenses",
    category: "Health & Wellness",
    imageUrl: "/spareglasses.webp",
    externalUrl: "https://www.amazon.in/s?k=contact+lens+solution+travel",
    price: { inr: 800, local: 60, localCurrency: "USD" },
    priority: "day-1",
    source: "bring-from-india",
    relevantRegions: ALL_REGIONS,
    relevantAccommodations: ALL_ACCOMMODATIONS,
    budgetTiers: ALL_BUDGET_TIERS,
    specs: { Quantity: "1 backup pair + 3-month lens supply" },
    cardSpecKeys: ["Quantity"],
  },
  {
    id: "thermal-base-layers",
    name: "Thermal Base Layers (top + bottom)",
    category: "Clothing & Weather",
    imageUrl: "/thermalbaselayers.webp",
    externalUrl: "https://www.amazon.in/s?k=thermal+base+layer+set+winter",
    price: { inr: 600, local: 25, localCurrency: "USD" },
    priority: "day-1",
    source: "bring-from-india",
    relevantRegions: COLD_REGIONS,
    relevantAccommodations: ALL_ACCOMMODATIONS,
    budgetTiers: ALL_BUDGET_TIERS,
    specs: { Material: "Polyester / merino blend" },
    cardSpecKeys: ["Material"],
  },
  {
    id: "packable-rain-shell",
    name: "Packable Rain Shell / Windbreaker",
    category: "Clothing & Weather",
    imageUrl: "/packablerainshell.webp",
    externalUrl: "https://www.amazon.com/s?k=packable+rain+jacket+ultralight",
    price: { local: 40, localCurrency: "USD" },
    priority: "week-1",
    source: "buy-there",
    relevantRegions: ALL_REGIONS,
    relevantAccommodations: ALL_ACCOMMODATIONS,
    budgetTiers: ALL_BUDGET_TIERS,
    specs: { Weight: "Under 300g", Pack: "Packs into own pocket" },
    cardSpecKeys: ["Weight"],
  },
  {
    id: "walking-shoes",
    name: "Comfortable Walking / All-weather Shoes",
    category: "Clothing & Weather",
    imageUrl: "/walkingshoes.webp",
    externalUrl: "https://www.amazon.com/s?k=waterproof+walking+shoes+men+campus",
    price: { local: 80, localCurrency: "USD" },
    priority: "day-1",
    source: "buy-there",
    relevantRegions: ALL_REGIONS,
    relevantAccommodations: ALL_ACCOMMODATIONS,
    budgetTiers: ALL_BUDGET_TIERS,
    specs: { Type: "Waterproof / water-resistant" },
    cardSpecKeys: ["Type"],
  },
  {
    id: "foldable-yoga-mat",
    name: "Foldable Yoga / Exercise Mat",
    category: "Health & Wellness",
    imageUrl: "/foldableyogamat.webp",
    externalUrl: "https://www.amazon.in/s?k=foldable+yoga+mat+travel",
    price: { inr: 700, local: 20, localCurrency: "USD" },
    priority: "optional",
    source: "bring-from-india",
    relevantRegions: ALL_REGIONS,
    relevantAccommodations: ALL_ACCOMMODATIONS,
    budgetTiers: ["comfortable", "flexible"],
    specs: { Thickness: "6mm foldable" },
    cardSpecKeys: ["Thickness"],
  },
  {
    id: "photos-from-home",
    name: "Printed Photos from Home",
    category: "Personal & Comfort",
    imageUrl: "/photosfromhome.webp",
    externalUrl: "https://www.canva.com/photo-books/",
    price: { inr: 200 },
    priority: "optional",
    source: "bring-from-india",
    relevantRegions: ALL_REGIONS,
    relevantAccommodations: ALL_ACCOMMODATIONS,
    budgetTiers: ALL_BUDGET_TIERS,
    tip: "Stick a few on your desk. Costs nothing and helps enormously in the first month.",
    specs: { Format: "4×6 prints or mini photo book" },
    cardSpecKeys: ["Format"],
  },
  {
    id: "indian-groceries-staples",
    name: "Indian Groceries / Staples Pack",
    category: "Food & Groceries (non-perishable Indian staples)",
    imageUrl: PUB.indianGroceries,
    externalUrl: "https://www.amazon.in/s?k=ready+to+eat+indian+food+travel",
    price: { inr: 1500 },
    priority: "day-1",
    source: "bring-from-india",
    relevantRegions: ALL_REGIONS,
    relevantAccommodations: ALL_ACCOMMODATIONS,
    budgetTiers: ALL_BUDGET_TIERS,
    tip: "Pack MTR/Gits ready-to-eat pouches, instant sambar powder, dal mixes, your favourite pickles. First week is rough without home food.",
    specs: { Weight: "Under 5kg total (airline allowance)" },
    cardSpecKeys: ["Weight"],
  },
];

// ─── Storage helpers ──────────────────────────────────────────────────────────

const MIME: Record<string, string> = {
  ".webp": "image/webp",
  ".jpg":  "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png":  "image/png",
};

async function uploadToStorage(localPath: string, itemId: string): Promise<string> {
  const ext = extname(localPath).toLowerCase();
  const contentType = MIME[ext] ?? "application/octet-stream";
  const destPath = `items/${itemId}${ext}`;
  const token = randomUUID();

  const fileBuffer = readFileSync(localPath);
  const file = bucket.file(destPath);

  await file.save(fileBuffer, {
    metadata: {
      contentType,
      metadata: { firebaseStorageDownloadTokens: token },
    },
  });

  const encodedPath = encodeURIComponent(destPath);
  return `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodedPath}?alt=media&token=${token}`;
}

// ─── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log("\n🔍  Checking Firestore for existing items…");

  const existing = await db.collection("items").limit(1).get();
  if (!existing.empty) {
    console.log("   ℹ  Items already exist in Firestore — aborting to avoid duplicates.");
    console.log("✅  Done (nothing changed).\n");
    return;
  }

  console.log("   Firestore is empty — proceeding with migration.\n");

  // Deduplicate image uploads (some items share the same image file)
  const uploadedUrls = new Map<string, string>(); // localImageUrl → storageUrl

  let succeeded = 0;
  let failed = 0;

  for (const item of STUDENT_ITEMS) {
    process.stdout.write(`   [${succeeded + failed + 1}/${STUDENT_ITEMS.length}] ${item.id} … `);

    try {
      let storageUrl: string;

      if (uploadedUrls.has(item.imageUrl)) {
        storageUrl = uploadedUrls.get(item.imageUrl)!;
        process.stdout.write("(image reused) ");
      } else {
        const localImagePath = resolve(process.cwd(), "public", item.imageUrl.replace(/^\//, ""));
        storageUrl = await uploadToStorage(localImagePath, item.id);
        uploadedUrls.set(item.imageUrl, storageUrl);
        process.stdout.write("(uploaded) ");
      }

      // Write item to Firestore with Storage URL
      const firestoreItem: Record<string, unknown> = {
        ...item,
        imageUrl: storageUrl,
        projectId: "student-kit",
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      };

      await db.collection("items").doc(item.id).set(firestoreItem);
      process.stdout.write("saved ✓\n");
      succeeded++;
    } catch (err) {
      process.stdout.write(`FAILED ✗\n`);
      console.error(`      Error:`, err);
      failed++;
    }
  }

  console.log(`\n✅  Migration complete: ${succeeded} items seeded, ${failed} failed.\n`);
}

main().catch((err) => {
  console.error("\n❌  Migration failed:", err, "\n");
  process.exit(1);
});
