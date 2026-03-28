"use client";

import {
  useMemo,
  useState,
  useRef,
  useEffect,
  FormEvent,
  ChangeEvent,
} from "react";
import { X, Plus, Trash2, Upload } from "lucide-react";
import { removeBackground, preload } from "@imgly/background-removal";
import { ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage";
import { AdminShell } from "@/components/admin/AdminShell";
import { useData } from "@/context/DataContext";
import { Item } from "@/types";
import { storage } from "@/lib/firebase";
import {
  PENDING_IMAGE_URL,
  isImagePending,
} from "@/lib/imagePending";

// ─── Constants ────────────────────────────────────────────────────────────────

const CATEGORY_OPTIONS = [
  "Furniture",
  "Lighting",
  "Decor",
  "Textiles",
  "Appliances",
] as const;

const SPEC_LABEL_OPTIONS = [
  "Dimensions",
  "Material",
  "Finish",
  "Colour",
  "Capacity",
  "Power",
  "Weight",
  "Set includes",
  "Custom",
] as const;

const CATEGORY_ORDER: Record<string, number> = {
  furniture: 0,
  lighting: 1,
  decor: 2,
  textiles: 3,
  appliances: 4,
};

// ─── Types ────────────────────────────────────────────────────────────────────

type AdminSpecRow = {
  id: string;
  label: string;
  isCustom: boolean;
  value: string;
  showOnCard: boolean;
};

type AdminItem = {
  id: string;
  name: string;
  brand: string;
  category: "Furniture" | "Lighting" | "Decor" | "Textiles" | "Appliances";
  externalUrl: string;
  imageData: string;
  displayPosition: number | null;
  specs: AdminSpecRow[];
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function uid() {
  return Math.random().toString(36).slice(2, 8);
}

function createItemId(name: string) {
  const base = name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  return base ? `${base}-${uid()}` : `item-${uid()}`;
}

function primaryDimension(item: Item): number {
  const dim = item.specs?.Dimensions;
  if (!dim) return 0;
  const nums = dim.match(/[\d.]+/g);
  if (!nums) return 0;
  return Math.max(...nums.map(Number));
}

function sortItems(items: Item[]): Item[] {
  return [...items].sort((a, b) => {
    const posA = a.displayPosition ?? null;
    const posB = b.displayPosition ?? null;

    // Pinned items always come first, sorted by position ascending
    if (posA !== null && posB !== null) return posA - posB;
    if (posA !== null) return -1;
    if (posB !== null) return 1;

    // Unpinned: sort by category then dimension descending
    const catA = CATEGORY_ORDER[a.category.toLowerCase()] ?? 99;
    const catB = CATEGORY_ORDER[b.category.toLowerCase()] ?? 99;
    if (catA !== catB) return catA - catB;
    return primaryDimension(b) - primaryDimension(a);
  });
}

function flattenItems(data: ReturnType<typeof useData>["data"]): Item[] {
  return data.flats.flatMap((flat) => flat.rooms.flatMap((room) => room.items));
}

function toAdminItem(item: Item): AdminItem {
  const cardKeys = new Set(item.cardSpecKeys || []);
  const specs: AdminSpecRow[] = Object.entries(item.specs || {}).map(([label, value]) => ({
    id: uid(),
    label,
    isCustom: !(SPEC_LABEL_OPTIONS as readonly string[]).includes(label) && label !== "Custom",
    value,
    showOnCard: cardKeys.has(label),
  }));
  return {
    id: item.id,
    name: item.name,
    brand: item.brand,
    category: item.category,
    externalUrl: item.externalUrl,
    imageData: item.imageUrl,
    displayPosition: item.displayPosition ?? null,
    specs,
  };
}

function fromAdminItem(a: AdminItem): Item {
  const specs: Record<string, string> = {};
  const cardSpecKeys: string[] = [];
  for (const row of a.specs) {
    const key = row.isCustom ? row.label : row.label;
    if (key && row.value) {
      specs[key] = row.value;
      if (row.showOnCard) cardSpecKeys.push(key);
    }
  }
  return {
    id: a.id,
    name: a.name.trim(),
    brand: a.brand.trim(),
    category: a.category,

    imageUrl: a.imageData,
    externalUrl: a.externalUrl.trim(),
    specs,
    cardSpecKeys,
    displayPosition: a.displayPosition ?? undefined,
  };
}

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function loadImageFromBlob(blob: Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = (err) => {
      URL.revokeObjectURL(url);
      reject(err);
    };
    img.src = url;
  });
}

async function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

async function downscaleForProcessing(file: File, maxEdge = 1000): Promise<Blob> {
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const el = new Image();
    el.onload = () => {
      URL.revokeObjectURL(url);
      resolve(el);
    };
    el.onerror = (err) => {
      URL.revokeObjectURL(url);
      reject(err);
    };
    el.src = url;
  });

  const scale = Math.min(1, maxEdge / Math.max(img.width, img.height));
  const w = Math.max(1, Math.round(img.width * scale));
  const h = Math.max(1, Math.round(img.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not initialize resize canvas");
  ctx.drawImage(img, 0, 0, w, h);

  const resized = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", 0.9)
  );
  if (!resized) throw new Error("Resize failed");
  return resized;
}

async function compositeOnWhiteToJpegBlob(cutout: Blob): Promise<Blob> {
  const img = await loadImageFromBlob(cutout);
  const canvas = document.createElement("canvas");
  canvas.width = img.width;
  canvas.height = img.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not initialize image canvas");

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(img, 0, 0);

  const jpegBlob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", 0.92)
  );
  if (!jpegBlob) throw new Error("Failed to export JPEG");
  return jpegBlob;
}

async function uploadBlobToFirebase(blob: Blob, originalName: string): Promise<string> {
  const stamp = Date.now();
  const safeName = originalName.replace(/[^a-zA-Z0-9.\-_]/g, "_");
  const path = `items/${stamp}-${safeName.replace(/\.(png|jpg|jpeg|webp)$/i, "")}.jpg`;
  const fileRef = storageRef(storage, path);
  await uploadBytes(fileRef, blob, { contentType: "image/jpeg" });
  return getDownloadURL(fileRef);
}

/** Upload the original file bytes when the main pipeline fails completely */
async function uploadOriginalImageFallback(file: File, itemId: string): Promise<string> {
  const stamp = Date.now();
  const safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_") || "image";
  const path = `items/${itemId}/original-${stamp}-${safeName}`;
  const fileRef = storageRef(storage, path);
  await uploadBytes(fileRef, file, { contentType: file.type || "application/octet-stream" });
  return getDownloadURL(fileRef);
}

/**
 * After the admin saves, runs removeBackground → Storage upload, then updateItem(imageUrl).
 * Never leaves imageUrl empty: falls back to uploading the original file if needed.
 */
function runDeferredImagePipeline(
  itemId: string,
  file: File,
  updateItem: (id: string, patch: Partial<Item>) => void,
) {
  void (async () => {
    try {
      const { downloadUrl } = await processAndUploadImage(file);
      updateItem(itemId, { imageUrl: downloadUrl });
    } catch (e) {
      console.error("[admin-upload] deferred pipeline failed:", e);
      try {
        const url = await uploadOriginalImageFallback(file, itemId);
        updateItem(itemId, { imageUrl: url });
      } catch (e2) {
        console.error("[admin-upload] fallback upload failed, retrying:", e2);
        try {
          const url = await uploadOriginalImageFallback(file, `${itemId}-retry`);
          updateItem(itemId, { imageUrl: url });
        } catch (e3) {
          console.error("[admin-upload] all image uploads failed:", e3);
        }
      }
    }
  })();
}

/**
 * Upload pipeline used by the admin image input:
 * - Remove background
 * - Composite on white
 * - Upload processed JPEG to Firebase Storage
 * - Fallback to original file upload if removal fails
 */
async function processAndUploadImage(file: File): Promise<{ downloadUrl: string; previewDataUrl: string }> {
  const startedAt = performance.now();
  console.groupCollapsed("[admin-upload] start", {
    name: file.name,
    type: file.type,
    sizeKB: Math.round(file.size / 1024),
  });
  try {
    console.info("[admin-upload] preprocessing image...");
    const preprocessed = await downscaleForProcessing(file, 1000);
    console.info("[admin-upload] preprocessed", {
      sizeKB: Math.round(preprocessed.size / 1024),
    });

    console.info("[admin-upload] removeBackground()...");
    const publicPath =
      typeof window !== "undefined"
        ? `${window.location.origin}/api/bg-assets/`
        : "/api/bg-assets/";

    const cutoutBlob = await removeBackground(preprocessed, {
      publicPath,
      debug: true,
      progress: (key: string, current: number, total: number) => {
        if (total > 0 && current % Math.max(1, Math.floor(total / 4)) === 0) {
          console.info(`[admin-upload] ${key}: ${current}/${total}`);
        }
      },
      model: "isnet_quint8",
      device: "cpu",
      output: {
        format: "image/png",
        quality: 1,
      },
    });
    console.info("[admin-upload] background removed", {
      sizeKB: Math.round(cutoutBlob.size / 1024),
      type: cutoutBlob.type,
    });

    console.info("[admin-upload] compositing on white...");
    const processedBlob = await compositeOnWhiteToJpegBlob(cutoutBlob);
    console.info("[admin-upload] composited jpeg", {
      sizeKB: Math.round(processedBlob.size / 1024),
      type: processedBlob.type,
    });

    console.info("[admin-upload] uploading to Firebase Storage...");
    const downloadUrl = await uploadBlobToFirebase(processedBlob, file.name);
    console.info("[admin-upload] upload complete", { downloadUrl });
    const previewDataUrl = await blobToDataUrl(processedBlob);
    console.info("[admin-upload] preview generated");
    console.info("[admin-upload] success in ms", Math.round(performance.now() - startedAt));
    console.groupEnd();
    return { downloadUrl, previewDataUrl };
  } catch (err) {
    // Never block admins: fallback to original upload
    console.error("[admin-upload] background removal pipeline failed, fallback to original:", err);
    console.info("[admin-upload] fallback upload to Firebase Storage (original file)");
    const fallbackRef = storageRef(
      storage,
      `items/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_")}`
    );
    await uploadBytes(fallbackRef, file, { contentType: file.type || "application/octet-stream" });
    const downloadUrl = await getDownloadURL(fallbackRef);
    const previewDataUrl = await readAsDataUrl(file);
    console.warn("[admin-upload] fallback used", {
      downloadUrl,
      elapsedMs: Math.round(performance.now() - startedAt),
    });
    console.groupEnd();
    return { downloadUrl, previewDataUrl };
  }
}

function emptyAdminItem(): Omit<AdminItem, "id"> {
  return {
    name: "",
    brand: "",
    category: "Furniture",
    externalUrl: "",
    imageData: "",
    displayPosition: null,
    specs: [{ id: uid(), label: "Dimensions", isCustom: false, value: "", showOnCard: false }],
  };
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function ImageUpload({
  value,
  onChange,
  onPendingFile,
  restoredUrl,
}: {
  value: string;
  onChange: (data: string) => void;
  onPendingFile: (file: File | null) => void;
  /** When clearing a replacement in edit mode, restore this URL */
  restoredUrl?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const previewObjectUrlRef = useRef<string | null>(null);

  const [localPreview, setLocalPreview] = useState("");

  const revokePreview = () => {
    if (previewObjectUrlRef.current) {
      URL.revokeObjectURL(previewObjectUrlRef.current);
      previewObjectUrlRef.current = null;
    }
  };

  // Parent-controlled URL changed (e.g. opened edit for another item). Drop any
  // stale blob preview so it cannot override the correct existing image.
  useEffect(() => {
    if (value === PENDING_IMAGE_URL) return;
    revokePreview();
    setLocalPreview("");
    if (inputRef.current) inputRef.current.value = "";
  }, [value]);

  const handleFile = (file: File) => {
    revokePreview();
    const objectUrl = URL.createObjectURL(file);
    previewObjectUrlRef.current = objectUrl;
    setLocalPreview(objectUrl);
    onPendingFile(file);
    onChange(PENDING_IMAGE_URL);
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("image/")) handleFile(file);
  };

  const displaySrc =
    localPreview ||
    (value && value !== PENDING_IMAGE_URL && value.startsWith("http") ? value : "");

  const showPreview = Boolean(displaySrc);

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleChange}
      />
      {showPreview ? (
        <div className="relative h-40 w-full overflow-hidden rounded-md border border-neutral-200">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={displaySrc} alt="Preview" className="h-full w-full object-contain p-2" />
          <button
            type="button"
            onClick={() => {
              revokePreview();
              setLocalPreview("");
              onPendingFile(null);
              onChange(restoredUrl ?? "");
            }}
            className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-neutral-200 hover:bg-neutral-50"
          >
            <X className="h-3 w-3 text-neutral-500" />
          </button>
        </div>
      ) : value === PENDING_IMAGE_URL ? (
        <div className="flex h-36 w-full items-center justify-center rounded-md border border-neutral-200 bg-neutral-50 px-3 text-center text-xs text-neutral-400">
          Image still processing…
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          className="flex h-36 w-full flex-col items-center justify-center gap-2 rounded-md border border-dashed border-neutral-300 bg-neutral-50 text-neutral-400 transition-colors hover:border-neutral-400 hover:bg-neutral-100"
        >
          <Upload className="h-5 w-5" />
          <span className="text-xs">Click to upload or drag and drop</span>
        </button>
      )}
      <p className="mt-1 text-[11px] text-neutral-400">
        Background is removed and the image is uploaded after you save — you can close this form immediately.
      </p>
    </div>
  );
}

const DIMENSION_UNITS = ["cm", "in", "mm", "m", "ft"] as const;

/** Parse "220 × 90 × 90 cm" → { d: ["220","90","90"], unit: "cm" } */
function parseDimValue(val: string): { parts: string[]; unit: string } {
  const unitMatch = val.match(/([a-zA-Z]+)\s*$/);
  const unit = unitMatch ? unitMatch[1] : "cm";
  const nums = val.match(/[\d.⌀]+/g) ?? [];
  return { parts: nums.slice(0, 3), unit };
}

/** Build dimension string from parts + unit, skipping blank parts */
function buildDimValue(parts: string[], unit: string): string {
  const filled = parts.filter((p) => p.trim() !== "");
  if (filled.length === 0) return "";
  return filled.join(" × ") + " " + unit;
}

function DimensionInput({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const parsed = useMemo(() => parseDimValue(value), [value]);
  const [parts, setParts] = useState<[string, string, string]>(() => {
    const p = parsed.parts;
    return [p[0] ?? "", p[1] ?? "", p[2] ?? ""];
  });
  const [unit, setUnit] = useState<string>(parsed.unit);
  const [customUnit, setCustomUnit] = useState<string>(
    DIMENSION_UNITS.includes(parsed.unit as (typeof DIMENSION_UNITS)[number]) ? "" : parsed.unit
  );
  const isCustomUnit = !DIMENSION_UNITS.includes(unit as (typeof DIMENSION_UNITS)[number]);

  const emit = (nextParts: [string, string, string], nextUnit: string) => {
    onChange(buildDimValue(nextParts, nextUnit));
  };

  const updatePart = (idx: 0 | 1 | 2, v: string) => {
    const next: [string, string, string] = [...parts] as [string, string, string];
    next[idx] = v;
    setParts(next);
    emit(next, unit);
  };

  const updateUnit = (v: string) => {
    if (v === "__custom__") {
      setUnit("__custom__");
      return;
    }
    setUnit(v);
    setCustomUnit("");
    emit(parts, v);
  };

  const updateCustomUnit = (v: string) => {
    setCustomUnit(v);
    setUnit(v);
    emit(parts, v || "cm");
  };

  const inputCls = "w-full rounded-md border border-neutral-200 bg-neutral-50 px-2 py-1.5 text-xs text-neutral-900 outline-none focus:border-neutral-400 focus:bg-white text-center";

  return (
    <div className="flex min-w-0 flex-1 flex-col gap-1.5">
      <div className="flex items-center gap-1">
        <input type="text" value={parts[0]} onChange={(e) => updatePart(0, e.target.value)} placeholder="—" className={inputCls} />
        <span className="flex-shrink-0 text-[11px] text-neutral-400">×</span>
        <input type="text" value={parts[1]} onChange={(e) => updatePart(1, e.target.value)} placeholder="—" className={inputCls} />
        <span className="flex-shrink-0 text-[11px] text-neutral-400">×</span>
        <input type="text" value={parts[2]} onChange={(e) => updatePart(2, e.target.value)} placeholder="—" className={inputCls} />
        {isCustomUnit ? (
          <input
            type="text"
            value={customUnit}
            onChange={(e) => updateCustomUnit(e.target.value)}
            placeholder="unit"
            className="w-14 flex-shrink-0 rounded-md border border-neutral-200 bg-neutral-50 px-2 py-1.5 text-xs text-neutral-900 outline-none focus:border-neutral-400 focus:bg-white"
          />
        ) : (
          <select
            value={unit}
            onChange={(e) => updateUnit(e.target.value)}
            className="w-16 flex-shrink-0 rounded-md border border-neutral-200 bg-neutral-50 px-1.5 py-1.5 text-xs text-neutral-900 outline-none focus:border-neutral-400 focus:bg-white"
          >
            {DIMENSION_UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
            <option value="__custom__">Other…</option>
          </select>
        )}
      </div>
      <p className="text-[10px] text-neutral-400">Leave blank fields for 1D or 2D dimensions</p>
    </div>
  );
}

function SpecRow({
  row,
  onUpdate,
  onRemove,
  onCardToggle,
  cardLimitReached,
}: {
  row: AdminSpecRow;
  onUpdate: (patch: Partial<AdminSpecRow>) => void;
  onRemove: () => void;
  onCardToggle: () => void;
  cardLimitReached: boolean;
}) {
  const handleLabelChange = (val: string) => {
    if (val === "Custom") {
      onUpdate({ label: "", isCustom: true });
    } else {
      onUpdate({ label: val, isCustom: false });
    }
  };

  const isDimensions = !row.isCustom && row.label === "Dimensions";

  const labelEl = row.isCustom ? (
    <input
      type="text"
      value={row.label}
      onChange={(e) => onUpdate({ label: e.target.value })}
      placeholder="Custom label"
      className="w-full rounded-md border border-neutral-200 bg-neutral-50 px-2.5 py-1.5 text-xs text-neutral-900 outline-none focus:border-neutral-400 focus:bg-white"
    />
  ) : (
    <select
      value={row.label}
      onChange={(e) => handleLabelChange(e.target.value)}
      className="w-full rounded-md border border-neutral-200 bg-neutral-50 px-2.5 py-1.5 text-xs text-neutral-900 outline-none focus:border-neutral-400 focus:bg-white"
    >
      <option value="">Label</option>
      {SPEC_LABEL_OPTIONS.filter((o) => o !== "Custom").map((o) => (
        <option key={o} value={o}>{o}</option>
      ))}
      <option value="Custom">Custom…</option>
    </select>
  );

  const valueEl = isDimensions ? (
    <DimensionInput value={row.value} onChange={(v) => onUpdate({ value: v })} />
  ) : (
    <input
      type="text"
      value={row.value}
      onChange={(e) => onUpdate({ value: e.target.value })}
      placeholder="Value"
      className="w-full rounded-md border border-neutral-200 bg-neutral-50 px-2.5 py-1.5 text-xs text-neutral-900 outline-none focus:border-neutral-400 focus:bg-white"
    />
  );

  const cardToggleEl = (
    <label className="flex min-h-[44px] flex-shrink-0 cursor-pointer items-center gap-1.5 md:min-h-0 md:pt-1.5">
      <input
        type="checkbox"
        checked={row.showOnCard}
        onChange={onCardToggle}
        disabled={!row.showOnCard && cardLimitReached}
        className="h-3.5 w-3.5 cursor-pointer accent-neutral-900 disabled:cursor-not-allowed disabled:opacity-40"
      />
      <span className="text-[11px] text-neutral-500">Card</span>
    </label>
  );

  const deleteEl = (
    <button
      type="button"
      onClick={onRemove}
      className="flex h-11 w-11 flex-shrink-0 items-center justify-center text-neutral-300 transition-colors hover:text-red-400 md:h-auto md:w-auto md:pt-1.5"
    >
      <Trash2 className="h-3.5 w-3.5" />
    </button>
  );

  return (
    <>
      {/* Mobile: two-row layout */}
      <div className="rounded-md bg-neutral-50/80 p-2 md:hidden">
        <div className="flex items-center gap-2">
          <div className="min-w-0 flex-1">{labelEl}</div>
          {deleteEl}
        </div>
        <div className="mt-1.5 flex items-center gap-2">
          <div className="min-w-0 flex-1">{valueEl}</div>
          {cardToggleEl}
        </div>
      </div>

      {/* Desktop: single-row layout */}
      <div className="hidden md:flex md:items-start md:gap-2">
        <div className="w-36 flex-shrink-0">{labelEl}</div>
        <div className="min-w-0 flex-1">{valueEl}</div>
        {cardToggleEl}
        {deleteEl}
      </div>
    </>
  );
}

// ─── Drawer ───────────────────────────────────────────────────────────────────

function ItemDrawer({
  open,
  mode,
  initial,
  takenPositions,
  onClose,
  onSave,
}: {
  open: boolean;
  mode: "add" | "edit";
  initial: Omit<AdminItem, "id"> & { id?: string };
  /** Positions already occupied by OTHER items (excluding the item being edited) */
  takenPositions: number[];
  onClose: () => void;
  onSave: (item: AdminItem, pendingImageFile: File | null) => void;
}) {
  const [form, setForm] = useState<Omit<AdminItem, "id"> & { id?: string }>(initial);
  const [cardLimitMsg, setCardLimitMsg] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pendingImageFile, setPendingImageFile] = useState<File | null>(null);

  const cardCount = form.specs.filter((s) => s.showOnCard).length;

  const updateSpec = (id: string, patch: Partial<AdminSpecRow>) => {
    setForm((f) => ({
      ...f,
      specs: f.specs.map((s) => (s.id === id ? { ...s, ...patch } : s)),
    }));
  };

  const removeSpec = (id: string) => {
    setForm((f) => ({ ...f, specs: f.specs.filter((s) => s.id !== id) }));
  };

  const toggleCard = (id: string) => {
    const row = form.specs.find((s) => s.id === id);
    if (!row) return;
    if (!row.showOnCard && cardCount >= 2) {
      setCardLimitMsg(true);
      setTimeout(() => setCardLimitMsg(false), 3000);
      return;
    }
    updateSpec(id, { showOnCard: !row.showOnCard });
  };

  const addSpec = () => {
    setForm((f) => ({
      ...f,
      specs: [...f.specs, { id: uid(), label: "Dimensions", isCustom: false, value: "", showOnCard: false }],
    }));
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = "Name is required.";
    if (!form.brand.trim()) e.brand = "Brand is required.";
    if (!form.category) e.category = "Category is required.";
    if (!form.externalUrl.trim()) e.externalUrl = "External URL is required.";
    else if (!form.externalUrl.startsWith("http")) e.externalUrl = "URL must start with http.";
    const hasImage =
      pendingImageFile != null ||
      (typeof form.imageData === "string" && form.imageData.startsWith("http"));
    if (!hasImage) e.imageData = "An image is required.";

    // Check each spec row: label must be set and value must be non-empty
    form.specs.forEach((s, i) => {
      const lbl = s.isCustom ? s.label.trim() : s.label;
      if (!lbl) e[`spec_label_${i}`] = `Spec ${i + 1}: label is required.`;
      if (lbl && !s.value.trim()) e[`spec_value_${i}`] = `Spec ${i + 1} (${lbl}): value cannot be empty.`;
    });

    // Position uniqueness
    if (form.displayPosition !== null) {
      if (takenPositions.includes(form.displayPosition)) {
        e.displayPosition = `Position ${form.displayPosition} is already taken by another item.`;
      }
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    const id = form.id ?? createItemId(form.name);
    const imageData =
      pendingImageFile != null ? PENDING_IMAGE_URL : form.imageData;
    onSave({ ...form, id, imageData } as AdminItem, pendingImageFile);
  };

  const inputCls = "w-full rounded-md border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm text-neutral-900 outline-none transition-colors focus:border-neutral-400 focus:bg-white";
  const errCls = "mt-1 text-[11px] text-red-500";
  const labelCls = "block text-[11px] font-medium uppercase tracking-[0.14em] text-neutral-400 mb-1";

  return (
    <>
      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-30 bg-black/20"
          onClick={onClose}
        />
      )}

      {/* Drawer panel
          Mobile  : full-width bottom sheet, slides up   (translate-y)
          Tablet  : 420px right panel, slides in from right (md: translate-x)
          Desktop : 520px right panel                    (lg: w-[520px])
      */}
      <div
        className={`fixed z-40 flex flex-col bg-white shadow-xl transition-transform duration-300 ease-out
          inset-x-0 bottom-0 max-h-[92vh] rounded-t-2xl
          md:inset-x-auto md:right-0 md:top-0 md:bottom-auto md:h-screen md:max-h-none md:rounded-none md:w-[420px]
          lg:w-[520px]
          ${open ? "translate-y-0 md:translate-x-0" : "translate-y-full md:translate-y-0 md:translate-x-full"}`}
      >
        {/* Drag handle — mobile only */}
        <div className="flex flex-shrink-0 justify-center pt-3 pb-1 md:hidden">
          <div className="h-1 w-10 rounded-full bg-neutral-200" />
        </div>

        {/* Sticky header */}
        <div className="flex flex-shrink-0 items-center justify-between border-b border-neutral-100 px-4 py-3 md:px-6 md:py-4">
          <p className="text-sm font-medium text-neutral-900">
            {mode === "add" ? "Add item" : "Edit item"}
          </p>
          <button
            type="button"
            onClick={onClose}
            className="flex h-11 w-11 items-center justify-center rounded-md text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-700 md:h-7 md:w-7"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Scrollable body */}
        <form
          id="item-form"
          onSubmit={handleSubmit}
          className="flex-1 overflow-y-auto px-4 py-4 space-y-5 md:px-6 md:py-5"
        >
          {/* Name + Brand — stacked on mobile, side by side on desktop */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className={labelCls}>Name</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Item name"
                className={inputCls}
              />
              {errors.name && <p className={errCls}>{errors.name}</p>}
            </div>
            <div>
              <label className={labelCls}>Brand</label>
              <input
                type="text"
                value={form.brand}
                onChange={(e) => setForm((f) => ({ ...f, brand: e.target.value }))}
                placeholder="Brand"
                className={inputCls}
              />
              {errors.brand && <p className={errCls}>{errors.brand}</p>}
            </div>
          </div>

          {/* Category */}
          <div>
            <label className={labelCls}>Category</label>
            <select
              value={form.category}
              onChange={(e) => setForm((f) => ({ ...f, category: e.target.value as AdminItem["category"] }))}
              className={inputCls}
            >
              <option value="">Select category…</option>
              {CATEGORY_OPTIONS.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            {errors.category && <p className={errCls}>{errors.category}</p>}
          </div>

          {/* External URL */}
          <div>
            <label className={labelCls}>External URL</label>
            <input
              type="text"
              value={form.externalUrl}
              onChange={(e) => setForm((f) => ({ ...f, externalUrl: e.target.value }))}
              placeholder="https://..."
              className={inputCls}
            />
            {errors.externalUrl && <p className={errCls}>{errors.externalUrl}</p>}
          </div>

          {/* Image upload — required */}
          <div>
            <label className={labelCls}>Image <span className="text-red-400">*</span></label>
            <ImageUpload
              value={form.imageData}
              restoredUrl={
                mode === "edit" && initial.imageData?.startsWith("http")
                  ? initial.imageData
                  : undefined
              }
              onPendingFile={setPendingImageFile}
              onChange={(data) => setForm((f) => ({ ...f, imageData: data }))}
            />
            {errors.imageData && <p className={errCls}>{errors.imageData}</p>}
          </div>

          {/* Display position */}
          <div>
            <label className={labelCls}>Display position</label>
            <input
              type="number"
              value={form.displayPosition ?? ""}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  displayPosition: e.target.value === "" ? null : Number(e.target.value),
                }))
              }
              placeholder="Leave blank for automatic ordering"
              className={inputCls}
              min={1}
            />
            <p className="mt-1 text-[11px] font-light text-neutral-400">
              Blank = ordered by category priority. Enter a number to pin this item to a specific position in the grid.
            </p>
            {errors.displayPosition && <p className={errCls}>{errors.displayPosition}</p>}
          </div>

          {/* Specs */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <label className={labelCls + " mb-0"}>Specs</label>
              {cardLimitMsg && (
                <p className="text-[11px] text-amber-500">Only 2 specs can show on the card at once.</p>
              )}
            </div>
            <div className="space-y-2">
              {form.specs.map((row, i) => (
                <div key={row.id}>
                  <SpecRow
                    row={row}
                    onUpdate={(patch) => updateSpec(row.id, patch)}
                    onRemove={() => removeSpec(row.id)}
                    onCardToggle={() => toggleCard(row.id)}
                    cardLimitReached={cardCount >= 2 && !row.showOnCard}
                  />
                  {errors[`spec_label_${i}`] && (
                    <p className={errCls + " mt-0.5"}>{errors[`spec_label_${i}`]}</p>
                  )}
                  {errors[`spec_value_${i}`] && (
                    <p className={errCls + " mt-0.5"}>{errors[`spec_value_${i}`]}</p>
                  )}
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={addSpec}
              className="mt-3 flex items-center gap-1 text-xs text-neutral-500 hover:text-neutral-800"
            >
              <Plus className="h-3.5 w-3.5" />
              Add spec
            </button>
          </div>
        </form>

        {/* Sticky footer */}
        <div className="flex flex-shrink-0 items-center justify-between border-t border-neutral-100 px-4 py-3 md:px-6 md:py-4">
          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] px-2 text-sm text-neutral-400 hover:text-neutral-700"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="item-form"
            className="min-h-[44px] rounded-md bg-neutral-900 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-neutral-700"
          >
            Save
          </button>
        </div>
        {/* Safe area on mobile */}
        <div className="flex-shrink-0 pb-2 md:hidden" />
      </div>
    </>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function ItemsPage() {
  const { data, addItem, updateItem, deleteItem } = useData();
  const allItems = useMemo(() => sortItems(flattenItems(data)), [data]);

  const [search, setSearch] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState<"add" | "edit">("add");
  const [drawerInitial, setDrawerInitial] = useState<Omit<AdminItem, "id"> & { id?: string }>(emptyAdminItem());
  const [editingItem, setEditingItem] = useState<Item | undefined>();
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const [deleteModalEntered, setDeleteModalEntered] = useState(false);
  const [addDrawerNonce, setAddDrawerNonce] = useState(0);

  useEffect(() => {
    if (!deleteTarget) {
      setDeleteModalEntered(false);
      return;
    }
    setDeleteModalEntered(false);
    const id = requestAnimationFrame(() => {
      setDeleteModalEntered(true);
    });
    return () => cancelAnimationFrame(id);
  }, [deleteTarget]);

  useEffect(() => {
    preload({ publicPath: `${window.location.origin}/api/bg-assets/` }).catch(
      (e) => console.warn("[admin-upload] model preload failed (will retry on upload)", e),
    );
  }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    if (!q) return allItems;
    return allItems.filter(
      (i) =>
        i.name.toLowerCase().includes(q) ||
        i.brand.toLowerCase().includes(q),
    );
  }, [allItems, search]);

  const openAdd = () => {
    setDrawerMode("add");
    setDrawerInitial(emptyAdminItem());
    setEditingItem(undefined);
    setAddDrawerNonce((n) => n + 1);
    setDrawerOpen(true);
  };

  const openEdit = (item: Item) => {
    setDrawerMode("edit");
    setDrawerInitial(toAdminItem(item));
    setEditingItem(item);
    setDrawerOpen(true);
  };

  const handleSave = (adminItem: AdminItem, pendingFile: File | null) => {
    const item = fromAdminItem(adminItem);
    if (drawerMode === "edit") {
      updateItem(item.id, item);
    } else {
      addItem(item);
    }
    if (pendingFile) {
      runDeferredImagePipeline(item.id, pendingFile, updateItem);
    }
    setDrawerOpen(false);
  };

  const confirmDeleteFromModal = () => {
    if (!deleteTarget) return;
    const id = deleteTarget.id;
    deleteItem(id);
    setDeleteTarget(null);
    if (editingItem?.id === id) setDrawerOpen(false);
  };

  const specSummary = (item: Item) => {
    const total = Object.keys(item.specs || {}).length;
    const cardKeys = item.cardSpecKeys ?? [];
    // Only count keys that exist in specs AND have a value
    const onCard = cardKeys.filter((k) => item.specs?.[k]).length;
    return `${total} spec${total !== 1 ? "s" : ""}${onCard > 0 ? `, ${onCard} on card` : ""}`;
  };

  return (
    <AdminShell>
      {/* Toolbar — stacked on mobile, row on desktop */}
      <div className="mb-4">
        <div className="mb-3">
          <h1 className="text-base font-medium text-neutral-900">Items</h1>
          <p className="mt-0.5 text-xs font-light text-neutral-400">{allItems.length} items in catalogue</p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or brand…"
            className="w-full rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 outline-none focus:border-neutral-400 sm:w-64 sm:py-1.5"
          />
          <button
            type="button"
            onClick={openAdd}
            className="flex min-h-[44px] items-center justify-center gap-1.5 rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-neutral-700 sm:min-h-0 sm:py-1.5"
          >
            <Plus className="h-4 w-4" />
            Add item
          </button>
        </div>
      </div>

      {/* ── Desktop + Tablet table ─────────────────────────────────────────── */}
      <div className="hidden md:block rounded-lg border border-neutral-200 bg-white overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-neutral-100 bg-neutral-50">
              {/* tablet shows: Position Image Name Brand Actions */}
              {/* desktop adds: Category Specs */}
              <th className="px-4 py-2.5 text-left text-[10px] font-medium uppercase tracking-[0.14em] text-neutral-400">Position</th>
              <th className="px-4 py-2.5 text-left text-[10px] font-medium uppercase tracking-[0.14em] text-neutral-400">Image</th>
              <th className="px-4 py-2.5 text-left text-[10px] font-medium uppercase tracking-[0.14em] text-neutral-400">Name</th>
              <th className="px-4 py-2.5 text-left text-[10px] font-medium uppercase tracking-[0.14em] text-neutral-400">Brand</th>
              <th className="hidden px-4 py-2.5 text-left text-[10px] font-medium uppercase tracking-[0.14em] text-neutral-400 lg:table-cell">Category</th>
              <th className="hidden px-4 py-2.5 text-left text-[10px] font-medium uppercase tracking-[0.14em] text-neutral-400 lg:table-cell">Specs</th>
              <th className="px-4 py-2.5 text-left text-[10px] font-medium uppercase tracking-[0.14em] text-neutral-400">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((item) => (
              <tr
                key={item.id}
                className="border-b border-neutral-50 last:border-0 hover:bg-neutral-50/60"
              >
                {/* Position */}
                <td className="px-4 py-2.5 text-xs text-neutral-500">
                  {item.displayPosition != null ? item.displayPosition : <span className="text-neutral-300">Auto</span>}
                </td>

                {/* Image */}
                <td className="px-4 py-2.5">
                  {isImagePending(item.imageUrl) ? (
                    <div className="flex h-10 w-10 items-center justify-center rounded-md bg-neutral-100">
                      <span className="text-xs text-neutral-400" aria-label="Processing">
                        ...
                      </span>
                    </div>
                  ) : (
                    <div className="relative h-10 w-10 overflow-hidden rounded-md bg-neutral-100">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={item.imageUrl} alt={item.name} className="h-full w-full object-contain p-0.5" />
                    </div>
                  )}
                </td>

                {/* Name */}
                <td className="px-4 py-2.5 text-xs font-medium text-neutral-800">{item.name}</td>

                {/* Brand */}
                <td className="px-4 py-2.5 text-xs text-neutral-500">{item.brand}</td>

                {/* Category — desktop only */}
                <td className="hidden px-4 py-2.5 text-xs text-neutral-500 lg:table-cell">{item.category}</td>

                {/* Specs — desktop only */}
                <td className="hidden px-4 py-2.5 text-xs text-neutral-400 lg:table-cell">{specSummary(item)}</td>

                {/* Actions */}
                <td className="px-4 py-2.5 text-xs">
                  <span className="flex items-center gap-3">
                    <button type="button" onClick={() => openEdit(item)} className="font-medium text-neutral-700 hover:text-neutral-900">Edit</button>
                    <button
                      type="button"
                      onClick={() => setDeleteTarget({ id: item.id, name: item.name })}
                      className="text-neutral-400 hover:text-red-500"
                    >
                      Delete
                    </button>
                  </span>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-xs text-neutral-300">
                  No items match your search.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ── Mobile card list ───────────────────────────────────────────────── */}
      <div className="md:hidden space-y-2">
        {filtered.map((item) => (
          <div
            key={item.id}
            className="rounded-lg border border-neutral-200 bg-white p-3 shadow-[0_1px_2px_rgba(0,0,0,0.04)]"
          >
            <div className="flex items-start gap-3">
              {/* Thumbnail */}
              {isImagePending(item.imageUrl) ? (
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-md bg-neutral-100">
                  <span className="text-xs text-neutral-400" aria-label="Processing">
                    ...
                  </span>
                </div>
              ) : (
                <div className="h-10 w-10 flex-shrink-0 overflow-hidden rounded-md bg-neutral-100">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={item.imageUrl} alt={item.name} className="h-full w-full object-contain p-0.5" />
                </div>
              )}

              {/* Info */}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-neutral-900">{item.name}</p>
                <p className="text-xs text-neutral-500">{item.brand}</p>
                <span className="mt-1.5 inline-block rounded-full border border-neutral-200 px-2 py-0.5 text-[11px] text-neutral-500">
                  {item.category}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="mt-3 flex items-center gap-4 border-t border-neutral-100 pt-2.5">
              <button
                type="button"
                onClick={() => openEdit(item)}
                className="min-h-[44px] px-1 text-xs font-medium text-neutral-700 hover:text-neutral-900"
              >
                Edit
              </button>
              <div className="h-3 w-px bg-neutral-200" />
              <button
                type="button"
                onClick={() => setDeleteTarget({ id: item.id, name: item.name })}
                className="min-h-[44px] px-1 text-xs text-neutral-400 hover:text-red-500"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <p className="py-8 text-center text-xs text-neutral-300">No items match your search.</p>
        )}
      </div>

      {deleteTarget && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6"
          role="presentation"
        >
          <button
            type="button"
            className={`absolute inset-0 bg-black/50 transition-opacity duration-200 ease-out ${
              deleteModalEntered ? "opacity-100" : "opacity-0"
            }`}
            aria-label="Cancel delete"
            onClick={() => setDeleteTarget(null)}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-dialog-title"
            className={`relative z-10 max-h-[min(90vh,32rem)] w-full max-w-md overflow-y-auto rounded-xl border border-neutral-200 bg-white p-5 shadow-lg transition-all duration-200 ease-out sm:p-6 ${
              deleteModalEntered ? "scale-100 opacity-100" : "scale-95 opacity-0"
            }`}
          >
            <h2 id="delete-dialog-title" className="break-words text-base font-bold text-neutral-900 sm:text-lg">
              Delete {deleteTarget.name}?
            </h2>
            <p className="mt-2 text-sm text-neutral-500">This action cannot be undone.</p>
            <div className="mt-6 flex w-full flex-row gap-3">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="min-h-[44px] flex-1 rounded-md border border-neutral-200 bg-neutral-100 px-3 py-2.5 text-sm font-medium text-neutral-800 transition-colors hover:bg-neutral-200 sm:min-h-0 sm:px-5"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDeleteFromModal}
                className="min-h-[44px] flex-1 rounded-md bg-red-600 px-3 py-2.5 text-sm font-medium text-white transition-colors hover:bg-red-700 sm:min-h-0 sm:px-5"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Drawer — remount per item/add session so form + image state cannot leak between edits */}
      <ItemDrawer
        key={
          drawerOpen
            ? drawerMode === "edit" && editingItem
              ? `edit-${editingItem.id}`
              : `add-${addDrawerNonce}`
            : "drawer-closed"
        }
        open={drawerOpen}
        mode={drawerMode}
        initial={drawerInitial}
        takenPositions={allItems
          .filter((i) => i.displayPosition != null && i.id !== editingItem?.id)
          .map((i) => i.displayPosition as number)}
        onClose={() => setDrawerOpen(false)}
        onSave={handleSave}
      />
    </AdminShell>
  );
}
