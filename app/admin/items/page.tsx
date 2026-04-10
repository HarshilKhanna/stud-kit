"use client";

import {
  useMemo,
  useState,
  useRef,
  useEffect,
  FormEvent,
  ChangeEvent,
} from "react";
import { X, Plus, Upload } from "lucide-react";
import { AdminShell } from "@/components/admin/AdminShell";
import { useData } from "@/context/DataContext";
import { Item } from "@/types";
import {
  FILTER_CATEGORIES,
  BROWSE_CATEGORY_CHIPS,
  BROWSE_CHIP_TO_ITEM_CATEGORIES,
  shortCategoryLabel,
} from "@/components/browse/FilterBar";
import {
  ALL_REGIONS,
  ALL_ACCOMMODATIONS,
  ALL_BUDGET_TIERS,
} from "@/data/studentData";
import type {
  Priority,
  Source,
  Region,
  AccommodationType,
  BudgetTier,
} from "@/types";
import { PENDING_IMAGE_URL } from "@/lib/imagePending";
import {
  getItemImageDisplaySrc,
  isItemImagePipelinePending,
} from "@/lib/itemImageUrl";
import { uploadImage } from "@/lib/firestore";

// ─── Constants ────────────────────────────────────────────────────────────────


const CATEGORY_ORDER: Record<string, number> = Object.fromEntries(
  FILTER_CATEGORIES.map((c, i) => [c.toLowerCase(), i]),
);

// ─── Types ────────────────────────────────────────────────────────────────────



type AdminItem = {
  id: string;
  name: string;
  brand: string;
  category: string;
  externalUrl: string;
  imageData: string;
  displayPosition: number | null;
  priority: Priority;
  source: Source;
  relevantRegions: Region[];
  relevantAccommodations: AccommodationType[];
  budgetTiers: BudgetTier[];
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

function baseCategorySort(items: Item[]): Item[] {
  return [...items].sort((a, b) => {
    const catA = CATEGORY_ORDER[a.category.toLowerCase()] ?? 99;
    const catB = CATEGORY_ORDER[b.category.toLowerCase()] ?? 99;
    if (catA !== catB) return catA - catB;
    return primaryDimension(b) - primaryDimension(a);
  });
}

function sortItems(items: Item[]): Item[] {
  const positioned: Item[] = [];
  const unpositioned: Item[] = [];

  for (const item of items) {
    if (
      typeof item.displayPosition === "number" &&
      Number.isFinite(item.displayPosition) &&
      item.displayPosition > 0
    ) {
      positioned.push(item);
    } else {
      unpositioned.push(item);
    }
  }

  const ordered = baseCategorySort(unpositioned);
  const sortedPositioned = [...positioned].sort((a, b) => {
    const pa = a.displayPosition as number;
    const pb = b.displayPosition as number;
    if (pa !== pb) return pa - pb;
    return a.id.localeCompare(b.id);
  });

  for (const item of sortedPositioned) {
    const insertAt = Math.min(Math.max((item.displayPosition as number) - 1, 0), ordered.length);
    ordered.splice(insertAt, 0, item);
  }

  return ordered;
}

function flattenItems(data: ReturnType<typeof useData>["data"]): Item[] {
  return data.flats.flatMap((flat) => flat.rooms.flatMap((room) => room.items));
}

function toAdminItem(item: Item): AdminItem {
  return {
    id: item.id,
    name: item.name,
    brand: item.brand ?? "",
    category: item.category,
    externalUrl: item.externalUrl,
    imageData: item.imageUrl,
    displayPosition: item.displayPosition ?? null,
    priority: item.priority,
    source: item.source,
    relevantRegions: [...item.relevantRegions],
    relevantAccommodations: [...item.relevantAccommodations],
    budgetTiers: [...item.budgetTiers],
  };
}

function fromAdminItem(a: AdminItem): Item {
  const item: Item = {
    id: a.id,
    name: a.name.trim(),
    brand: a.brand.trim() || undefined,
    category: a.category.trim(),
    imageUrl: a.imageData,
    externalUrl: a.externalUrl.trim(),
    displayPosition: a.displayPosition ?? undefined,
    priority: a.priority,
    source: a.source,
    relevantRegions: a.relevantRegions,
    relevantAccommodations: a.relevantAccommodations,
    budgetTiers: a.budgetTiers,
  };
  return item;
}

/**
 * Sends the image to the /api/remove-bg route (remove.bg API), uploads the
 * result to Firebase Storage, then patches the item. Runs in the background
 * so the UI stays responsive — the item is saved immediately with PENDING_IMAGE_URL
 * and the real URL arrives when the pipeline finishes.
 */
function runDeferredImagePipeline(
  itemId: string,
  file: File,
  updateItem: (id: string, patch: Partial<Item>) => void,
) {
  void (async () => {
    try {
      const form = new FormData();
      form.append("image", file);
      const res = await fetch("/api/remove-bg", { method: "POST", body: form });
      if (!res.ok) {
        const { error } = await res.json().catch(() => ({ error: res.statusText }));
        throw new Error(error ?? "Background removal failed");
      }
      const processedBlob = await res.blob();
      const processedFile = new File([processedBlob], `${itemId}.png`, { type: "image/png" });
      const storageUrl = await uploadImage(processedFile, itemId);
      updateItem(itemId, { imageUrl: storageUrl });
    } catch (e) {
      console.error("[admin-upload] remove.bg pipeline failed, uploading original:", e);
      try {
        const storageUrl = await uploadImage(file, itemId);
        updateItem(itemId, { imageUrl: storageUrl });
      } catch (uploadErr) {
        console.error("[admin-upload] fallback upload also failed:", uploadErr);
      }
    }
  })();
}

function emptyAdminItem(): Omit<AdminItem, "id"> {
  return {
    name: "",
    brand: "",
    category: FILTER_CATEGORIES[0] ?? "Documents & Admin",
    externalUrl: "",
    imageData: "",
    displayPosition: null,
    priority: "optional",
    source: "either",
    relevantRegions: [...ALL_REGIONS],
    relevantAccommodations: [...ALL_ACCOMMODATIONS],
    budgetTiers: [...ALL_BUDGET_TIERS],
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
    (value &&
    value !== PENDING_IMAGE_URL &&
    (value.startsWith("http") || value.startsWith("data:") || value.startsWith("/"))
      ? value
      : "");

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
        <div className="relative h-40 w-full overflow-hidden border border-neutral-200 bg-neutral-50">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={displaySrc} alt="Preview" className="h-full w-full object-contain p-2" />
          <button
            type="button"
            onClick={() => {
              revokePreview();
              setLocalPreview("");
              onPendingFile(null);
              onChange(localPreview ? (restoredUrl ?? "") : "");
              if (inputRef.current) inputRef.current.value = "";
            }}
            className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center bg-white ring-1 ring-neutral-200 hover:bg-neutral-50"
          >
            <X className="h-3 w-3 text-neutral-500" />
          </button>
        </div>
      ) : value === PENDING_IMAGE_URL ? (
        <div className="flex h-36 w-full items-center justify-center border border-neutral-200 bg-neutral-50 px-3 text-center text-[11px] font-bold uppercase tracking-widest text-neutral-500">
          Image still processing…
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          className="flex h-36 w-full flex-col items-center justify-center gap-2 border border-dashed border-neutral-300 bg-neutral-50 text-neutral-400 transition-colors hover:border-neutral-400 hover:bg-neutral-100"
        >
          <Upload className="h-5 w-5" />
          <span className="text-[11px] font-bold uppercase tracking-widest">Click to upload or drag and drop</span>
        </button>
      )}
      <p className="mt-1 text-[11px] text-neutral-400">
        Background is removed after you save; the image is stored locally in the browser — you can close this form immediately.
      </p>
    </div>
  );
}


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
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pendingImageFile, setPendingImageFile] = useState<File | null>(null);
  const formScrollRef = useRef<HTMLFormElement>(null);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = "Name is required.";
    if (!form.category.trim()) e.category = "Category is required.";
    if (!form.externalUrl.trim()) {
      e.externalUrl = "Buy link is required.";
    } else if (!/^https?:\/\//i.test(form.externalUrl.trim())) {
      e.externalUrl = "URL must start with http:// or https://.";
    }
    const hasImage =
      pendingImageFile != null ||
      (typeof form.imageData === "string" &&
        (form.imageData.startsWith("http") ||
          form.imageData.startsWith("data:") ||
          form.imageData.startsWith("/")));
    if (!hasImage) e.imageData = "An image is required.";
    if (form.relevantRegions.length === 0) {
      e.regions = "Select at least one region.";
    }
    if (form.relevantAccommodations.length === 0) {
      e.accommodations = "Select at least one accommodation type.";
    }
    if (form.budgetTiers.length === 0) {
      e.budgets = "Select at least one budget tier.";
    }

    // Position uniqueness
    if (form.displayPosition !== null) {
      if (takenPositions.includes(form.displayPosition)) {
        e.displayPosition = `Position ${form.displayPosition} is already taken by another item.`;
      }
    }

    setErrors(e);
    const isValid = Object.keys(e).length === 0;
    
    if (!isValid) {
      setTimeout(() => {
        const container = formScrollRef.current;
        if (!container) return;
        const firstErrorEl = container.querySelector<HTMLElement>(".form-error");
        if (firstErrorEl) {
          const containerTop = container.getBoundingClientRect().top;
          const errorTop = firstErrorEl.getBoundingClientRect().top;
          container.scrollBy({ top: errorTop - containerTop - 80, behavior: "smooth" });
        }
      }, 50);
    }
    
    return isValid;
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    const id = form.id ?? createItemId(form.name);
    const imageData =
      pendingImageFile != null ? PENDING_IMAGE_URL : form.imageData;
    onSave({ ...form, id, imageData } as AdminItem, pendingImageFile);
  };

  const inputCls = "w-full bg-transparent border-0 border-b border-neutral-200 focus:border-black focus:ring-0 px-0 py-2 text-sm text-neutral-900 outline-none transition-colors";
  const errCls = "mt-1 text-[11px] text-red-500 form-error";
  const labelCls = "block text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-400 mb-2";

  return (
    <>
      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-30 bg-black/20 backdrop-blur-[2px]"
          onClick={onClose}
        />
      )}

      {/* Drawer panel */}
      <div
        className={`fixed z-40 flex flex-col bg-white shadow-2xl transition-transform duration-300 ease-out
          inset-x-0 bottom-0 max-h-[92vh]
          md:inset-x-auto md:right-0 md:top-0 md:bottom-auto md:h-screen md:max-h-none md:w-[480px]
          lg:w-[520px]
          ${open ? "translate-y-0 md:translate-x-0" : "translate-y-full md:translate-y-0 md:translate-x-full"}`}
      >
        {/* Drag handle — mobile only */}
        <div className="flex flex-shrink-0 justify-center pt-3 pb-1 md:hidden">
          <div className="h-1 w-10 rounded-full bg-neutral-200" />
        </div>

        {/* Sticky header */}
        <div className="flex flex-shrink-0 items-center justify-between border-b border-neutral-100 px-6 py-6 md:px-10 md:py-8">
          <h3
            className="text-2xl font-normal tracking-tight text-black"
            style={{ fontFamily: "var(--font-serif, serif)" }}
          >
            {mode === "add" ? "Add Registry Item" : "Edit Registry Item"}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center text-neutral-400 transition-colors hover:text-black"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Scrollable body */}
        <form
          id="item-form"
          ref={formScrollRef}
          onSubmit={handleSubmit}
          className="flex-1 overflow-y-auto px-6 py-6 space-y-8 md:px-10 md:py-8"
        >
          {/* Item name — large serif input */}
          <div>
            <label className={labelCls}>Item Name</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="Enter name..."
              className="w-full bg-transparent border-0 border-b border-neutral-200 focus:border-black focus:ring-0 px-0 py-3 text-2xl text-neutral-900 outline-none transition-colors"
              style={{ fontFamily: "var(--font-serif, serif)" }}
            />
            {errors.name && <p className={errCls}>{errors.name}</p>}
          </div>

          {/* Brand + Category */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <label className={labelCls}>Brand</label>
              <input
                type="text"
                value={form.brand}
                onChange={(e) => setForm((f) => ({ ...f, brand: e.target.value }))}
                placeholder="Brand"
                className={inputCls}
              />
            </div>
            {/* Category — second col of Brand+Category grid */}
            <div>
              <label className={labelCls}>Category</label>
              <select
                value={form.category}
                onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                className={inputCls}
              >
                <option value="">Select category…</option>
                {BROWSE_CATEGORY_CHIPS.map((chip) => {
                  const canonical = BROWSE_CHIP_TO_ITEM_CATEGORIES[chip][0];
                  return (
                    <option key={chip} value={canonical}>
                      {chip}
                    </option>
                  );
                })}
              </select>
              {errors.category && <p className={errCls}>{errors.category}</p>}
            </div>
          </div>

          {/* Priority + Source */}
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
            <div>
              <label className={labelCls}>Priority Tier</label>
              <div className="mt-3 flex flex-col gap-3">
                {([
                  { value: "day-1", label: "Day 1 — Critical" },
                  { value: "week-1", label: "First Week" },
                  { value: "month-1", label: "First Month" },
                  { value: "optional", label: "Optional" },
                ] as const).map(({ value, label }) => (
                  <label key={value} className="flex cursor-pointer items-center gap-3 group">
                    <input
                      type="radio"
                      name="priority"
                      value={value}
                      checked={form.priority === value}
                      onChange={() => setForm((f) => ({ ...f, priority: value }))}
                      className="h-3 w-3 border-neutral-400 text-black focus:ring-0 focus:ring-offset-0"
                      style={{ borderRadius: 0 }}
                    />
                    <span className="text-[11px] font-bold uppercase tracking-widest text-neutral-500 group-hover:text-black transition-colors">
                      {label}
                    </span>
                  </label>
                ))}
              </div>
            </div>
            <div>
              <label className={labelCls}>Acquisition Source</label>
              <div className="mt-3 flex flex-col gap-3">
                {([
                  { value: "bring-from-india", label: "Bring from India" },
                  { value: "buy-there", label: "Buy There" },
                  { value: "either", label: "Either" },
                ] as const).map(({ value, label }) => (
                  <label key={value} className="flex cursor-pointer items-center gap-3 group">
                    <input
                      type="radio"
                      name="source"
                      value={value}
                      checked={form.source === value}
                      onChange={() => setForm((f) => ({ ...f, source: value }))}
                      className="h-3 w-3 border-neutral-400 text-black focus:ring-0 focus:ring-offset-0"
                      style={{ borderRadius: 0 }}
                    />
                    <span className="text-[11px] font-bold uppercase tracking-widest text-neutral-500 group-hover:text-black transition-colors">
                      {label}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Relevant regions */}
          <div>
            <label className={labelCls}>Relevant Regions</label>
            <div className="mt-3 grid grid-cols-2 gap-y-3">
              {ALL_REGIONS.map((r) => (
                <label key={r} className="flex cursor-pointer items-center gap-3">
                  <input
                    type="checkbox"
                    checked={form.relevantRegions.includes(r)}
                    onChange={() =>
                      setForm((f) => ({
                        ...f,
                        relevantRegions: f.relevantRegions.includes(r)
                          ? f.relevantRegions.filter((x) => x !== r)
                          : [...f.relevantRegions, r],
                      }))
                    }
                    className="h-3 w-3 accent-neutral-900"
                    style={{ borderRadius: 0 }}
                  />
                  <span className="text-[11px] font-bold uppercase tracking-widest text-neutral-500">{r}</span>
                </label>
              ))}
            </div>
            {errors.regions && <p className={errCls}>{errors.regions}</p>}
          </div>

          {/* Accommodations */}
          <div>
            <label className={labelCls}>Accommodations</label>
            <div className="mt-3 flex flex-wrap gap-x-6 gap-y-3">
              {ALL_ACCOMMODATIONS.map((r) => (
                <label key={r} className="flex cursor-pointer items-center gap-3">
                  <input
                    type="checkbox"
                    checked={form.relevantAccommodations.includes(r)}
                    onChange={() =>
                      setForm((f) => ({
                        ...f,
                        relevantAccommodations: f.relevantAccommodations.includes(r)
                          ? f.relevantAccommodations.filter((x) => x !== r)
                          : [...f.relevantAccommodations, r],
                      }))
                    }
                    className="h-3 w-3 accent-neutral-900"
                    style={{ borderRadius: 0 }}
                  />
                  <span className="text-[11px] font-bold uppercase tracking-widest text-neutral-500">{r}</span>
                </label>
              ))}
            </div>
            {errors.accommodations && <p className={errCls}>{errors.accommodations}</p>}
          </div>

          <div>
            <label className={labelCls}>Budget Tiers</label>
            <div className="mt-3 flex flex-wrap gap-x-6 gap-y-3">
              {ALL_BUDGET_TIERS.map((r) => (
                <label key={r} className="flex cursor-pointer items-center gap-3">
                  <input
                    type="checkbox"
                    checked={form.budgetTiers.includes(r)}
                    onChange={() =>
                      setForm((f) => ({
                        ...f,
                        budgetTiers: f.budgetTiers.includes(r)
                          ? f.budgetTiers.filter((x) => x !== r)
                          : [...f.budgetTiers, r],
                      }))
                    }
                    className="h-3 w-3 accent-neutral-900"
                    style={{ borderRadius: 0 }}
                  />
                  <span className="text-[11px] font-bold uppercase tracking-widest text-neutral-500">{r}</span>
                </label>
              ))}
            </div>
            {errors.budgets && <p className={errCls}>{errors.budgets}</p>}
          </div>

          {/* External URL */}
          <div>
            <label className={labelCls}>External URL <span className="text-red-400">*</span></label>
            <input
              type="text"
              value={form.externalUrl}
              onChange={(e) => setForm((f) => ({ ...f, externalUrl: e.target.value }))}
              placeholder="https://…"
              className={inputCls}
            />
            {errors.externalUrl && <p className={errCls}>{errors.externalUrl}</p>}
          </div>

          {/* Image file — at least one required (validated below) */}
          <div>
            <label className={labelCls}>Image <span className="text-red-400">*</span></label>
            <ImageUpload
              value={form.imageData}
              restoredUrl={
                mode === "edit" &&
                initial.imageData &&
                (initial.imageData.startsWith("http") ||
                  initial.imageData.startsWith("data:") ||
                  initial.imageData.startsWith("/"))
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

        </form>

        {/* Sticky footer */}
        <div className="flex flex-shrink-0 flex-col gap-3 border-t border-neutral-100 px-6 py-6 md:px-10">
          <button
            type="submit"
            form="item-form"
            className="w-full bg-black py-5 text-[11px] font-bold uppercase tracking-[0.3em] text-white transition-colors hover:bg-neutral-800"
          >
            Save Changes
          </button>
          <button
            type="button"
            onClick={onClose}
            className="w-full py-3 text-[10px] font-bold uppercase tracking-[0.3em] text-neutral-400 underline underline-offset-8 hover:text-black transition-colors"
          >
            Cancel &amp; Discard
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


  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    if (!q) return allItems;
    return allItems.filter(
      (i) =>
        i.name.toLowerCase().includes(q) ||
        (i.brand ?? "").toLowerCase().includes(q),
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


  return (
    <AdminShell>
      {/* Toolbar */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1
            className="text-5xl font-light leading-none tracking-tight text-black"
            style={{ fontFamily: "var(--font-serif, serif)" }}
          >
            Archive Index
          </h1>
          <p
            className="mt-2 text-base italic text-neutral-400"
            style={{ fontFamily: "var(--font-serif, serif)" }}
          >
            Curating the essentials for focused scholarship.
          </p>
          <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-400">
            {allItems.length} active monographs
          </p>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search…"
            className="w-48 border-0 border-b border-neutral-300 bg-transparent px-0 py-1.5 text-xs text-neutral-900 outline-none placeholder:text-neutral-300 focus:border-neutral-700"
          />
          <button
            type="button"
            onClick={openAdd}
            className="flex items-center gap-1.5 bg-black px-4 py-2 text-[11px] font-bold uppercase tracking-[0.12em] text-white transition-colors hover:bg-neutral-800"
          >
            <Plus className="h-3.5 w-3.5" />
            Add item
          </button>
        </div>
      </div>

      {/* ── Desktop + Tablet table ─────────────────────────────────────────── */}
      <div className="hidden md:block border border-neutral-200 bg-white overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-neutral-200 bg-neutral-50">
              {/* tablet shows: Position Image Name Brand Actions */}
              {/* desktop adds: Category Specs */}
              <th className="px-4 py-2.5 text-left text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-400">Position</th>
              <th className="px-4 py-2.5 text-left text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-400">Image</th>
              <th className="px-4 py-2.5 text-left text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-400">Name</th>
              <th className="px-4 py-2.5 text-left text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-400">Brand</th>
              <th className="hidden px-4 py-2.5 text-left text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-400 lg:table-cell">Category</th>
              <th className="px-4 py-2.5 text-left text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-400">Actions</th>
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
                  {item.displayPosition != null ? item.displayPosition : <span className="text-neutral-400">Auto</span>}
                </td>

                {/* Image */}
                <td className="px-4 py-2.5">
                  {isItemImagePipelinePending(item) ? (
                    <div className="flex h-10 w-10 items-center justify-center rounded-md bg-neutral-100">
                      <span className="text-xs text-neutral-400" aria-label="Processing">
                        ...
                      </span>
                    </div>
                  ) : getItemImageDisplaySrc(item) ? (
                    <div className="relative h-10 w-10 overflow-hidden rounded-md bg-neutral-100">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={getItemImageDisplaySrc(item)}
                        alt={item.name}
                        className="h-full w-full object-contain p-0.5"
                      />
                    </div>
                  ) : (
                    <div className="flex h-10 w-10 items-center justify-center rounded-md bg-neutral-100">
                      <span className="text-[10px] text-neutral-400">—</span>
                    </div>
                  )}
                </td>

                {/* Name */}
                <td
                  className="px-4 py-3 text-base font-medium text-black"
                  style={{ fontFamily: "var(--font-serif, serif)" }}
                >
                  {item.name}
                </td>

                {/* Brand */}
                <td className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-neutral-400">
                  {item.brand ?? "—"}
                </td>

                {/* Category — desktop only */}
                <td className="hidden px-4 py-3 lg:table-cell">
                  <span className="border border-neutral-200 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] text-neutral-500">
                    {shortCategoryLabel(item.category)}
                  </span>
                </td>

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
                <td colSpan={7} className="px-4 py-8 text-center text-xs text-neutral-500">
                  No items match your search.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ── Mobile card list ───────────────────────────────────────────────── */}
      <div className="md:hidden space-y-px border border-neutral-200">
        {filtered.map((item) => (
          <div
            key={item.id}
            className="border-b border-neutral-100 bg-white p-3 last:border-b-0"
          >
            <div className="flex items-start gap-3">
              {/* Thumbnail */}
              {isItemImagePipelinePending(item) ? (
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-md bg-neutral-100">
                  <span className="text-xs text-neutral-400" aria-label="Processing">
                    ...
                  </span>
                </div>
              ) : getItemImageDisplaySrc(item) ? (
                <div className="h-10 w-10 flex-shrink-0 overflow-hidden rounded-md bg-neutral-100">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={getItemImageDisplaySrc(item)}
                    alt={item.name}
                    className="h-full w-full object-contain p-0.5"
                  />
                </div>
              ) : (
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-md bg-neutral-100">
                  <span className="text-[10px] text-neutral-400">—</span>
                </div>
              )}

              {/* Info */}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-neutral-900">{item.name}</p>
                <p className="text-xs text-neutral-500">{item.brand ?? "—"}</p>
                <span className="mt-1.5 inline-block border border-neutral-200 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.1em] text-neutral-400">
                  {shortCategoryLabel(item.category)}
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
          <p className="py-8 text-center text-xs text-neutral-500">No items match your search.</p>
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
            className={`relative z-10 max-h-[min(90vh,32rem)] w-full max-w-md overflow-y-auto border border-neutral-200 bg-white p-5 shadow-none transition-all duration-200 ease-out sm:p-6 ${
              deleteModalEntered ? "scale-100 opacity-100" : "scale-95 opacity-0"
            }`}
          >
            <h2
              id="delete-dialog-title"
              className="break-words text-xl font-bold text-neutral-900"
              style={{ fontFamily: "var(--font-serif, serif)" }}
            >
              Delete {deleteTarget.name}?
            </h2>
            <p className="mt-2 text-[11px] uppercase tracking-[0.12em] text-neutral-400">This action cannot be undone.</p>
            <div className="mt-6 flex w-full flex-row gap-3">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="min-h-[44px] flex-1 border border-neutral-200 bg-white px-3 py-2.5 text-[11px] font-bold uppercase tracking-[0.12em] text-neutral-700 transition-colors hover:bg-neutral-50 sm:min-h-0 sm:px-5"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDeleteFromModal}
                className="min-h-[44px] flex-1 bg-black px-3 py-2.5 text-[11px] font-bold uppercase tracking-[0.12em] text-white transition-colors hover:bg-neutral-800 sm:min-h-0 sm:px-5"
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
