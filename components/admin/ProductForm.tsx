"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { X, Upload, Loader2 } from "lucide-react";
import { categoryValues } from "@/lib/productSchema";

type ColorInput = { nameEn: string; nameAr: string; hex: string };
type ImageInput = { url: string };

export type ProductFormValues = {
  id?: string;
  slug: string;
  sku: string;
  nameEn: string;
  nameAr: string;
  descriptionEn: string;
  descriptionAr: string;
  materialsEn: string;
  materialsAr: string;
  dimensions: string;
  careEn: string;
  careAr: string;
  category: (typeof categoryValues)[number];
  price: number;
  compareAtPrice: number | null;
  materialCost: number;
  packagingCost: number;
  adsCost: number;
  otherCost: number;
  originCountry: string;
  stockQty: number;
  isBestSeller: boolean;
  isNew: boolean;
  isPublished: boolean;
  colors: ColorInput[];
  images: ImageInput[];
};

const emptyProduct: ProductFormValues = {
  slug: "",
  sku: "",
  nameEn: "",
  nameAr: "",
  descriptionEn: "",
  descriptionAr: "",
  materialsEn: "",
  materialsAr: "",
  dimensions: "",
  careEn: "",
  careAr: "",
  category: "SHOULDER_BAG",
  price: 0,
  compareAtPrice: null,
  materialCost: 0,
  packagingCost: 0,
  adsCost: 0,
  otherCost: 0,
  originCountry: "",
  stockQty: 0,
  isBestSeller: false,
  isNew: false,
  isPublished: true,
  colors: [{ nameEn: "", nameAr: "", hex: "#EDE3D0" }],
  images: [],
};

const originOptions = ["Spain", "Turkey", "Italy", "China", "Algeria", "France", "Morocco"];

function extractErrorMessage(error: unknown): string {
  if (typeof error === "string") return error;
  if (error && typeof error === "object") {
    const obj = error as { formErrors?: string[]; fieldErrors?: Record<string, string[]> };
    const fieldMessages = Object.entries(obj.fieldErrors ?? {})
      .filter(([, msgs]) => msgs?.length)
      .map(([field, msgs]) => `${field}: ${msgs[0]}`);
    const all = [...(obj.formErrors ?? []), ...fieldMessages];
    if (all.length > 0) return all.join(" · ");
  }
  return "Failed to save product";
}

export default function ProductForm({
  initial,
  canEditCosts = false,
}: {
  initial?: ProductFormValues;
  canEditCosts?: boolean;
}) {
  const router = useRouter();
  const [values, setValues] = useState<ProductFormValues>(initial ?? emptyProduct);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [slugTouched, setSlugTouched] = useState(!!initial);

  function update<K extends keyof ProductFormValues>(key: K, value: ProductFormValues[K]) {
    setValues((v) => ({ ...v, [key]: value }));
  }

  function slugify(text: string): string {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  async function uploadFile(file: File) {
    setUploading(true);
    const form = new FormData();
    form.append("file", file);
    form.append("slug", values.slug || "misc");
    const res = await fetch("/api/admin/upload", { method: "POST", body: form });
    setUploading(false);
    if (!res.ok) {
      setError("Image upload failed");
      return;
    }
    const data = await res.json();
    update("images", [...values.images, { url: data.url }]);
  }

  function removeImage(idx: number) {
    update("images", values.images.filter((_, i) => i !== idx));
  }

  function updateColor(idx: number, patch: Partial<ColorInput>) {
    update(
      "colors",
      values.colors.map((c, i) => (i === idx ? { ...c, ...patch } : c))
    );
  }

  function addColor() {
    update("colors", [...values.colors, { nameEn: "", nameAr: "", hex: "#EDE3D0" }]);
  }

  function removeColor(idx: number) {
    update("colors", values.colors.filter((_, i) => i !== idx));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (values.images.length === 0) {
      setError("Add at least one image");
      return;
    }
    setSaving(true);
    const url = initial?.id ? `/api/admin/products/${initial.id}` : "/api/admin/products";
    const method = initial?.id ? "PUT" : "POST";
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    setSaving(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(extractErrorMessage(data.error));
      return;
    }
    router.push("/admin/products");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-8">
      <Section title="Identity">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <Field label="Slug (URL)">
            <input
              required
              value={values.slug}
              onChange={(e) => {
                setSlugTouched(true);
                update("slug", slugify(e.target.value));
              }}
              placeholder="la-baguette"
              className="input"
            />
            <p className="mt-1 font-body text-[11px] text-ink/40">Auto-filled from the English name — lowercase, dashes only.</p>
          </Field>
          <Field label="SKU">
            <div className="flex gap-2">
              <input
                required
                value={values.sku}
                onChange={(e) => update("sku", e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, "-"))}
                placeholder="AUR-XXX-000"
                className="input"
              />
              <button
                type="button"
                onClick={() =>
                  update(
                    "sku",
                    `AUR-${Math.random().toString(36).slice(2, 5).toUpperCase()}-${Math.floor(
                      100 + Math.random() * 900
                    )}`
                  )
                }
                className="whitespace-nowrap rounded-xl2 border border-line px-3 text-xs text-ink/60 hover:border-ink hover:text-ink"
              >
                Generate
              </button>
            </div>
          </Field>
          <Field label="Category">
            <select
              value={values.category}
              onChange={(e) => update("category", e.target.value as ProductFormValues["category"])}
              className="input"
            >
              {categoryValues.map((c) => (
                <option key={c} value={c}>
                  {c.replaceAll("_", " ")}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Name (English)">
            <input
              required
              value={values.nameEn}
              onChange={(e) => {
                update("nameEn", e.target.value);
                if (!slugTouched) update("slug", slugify(e.target.value));
              }}
              className="input"
            />
          </Field>
          <Field label="Name (Arabic)">
            <input
              required
              dir="rtl"
              value={values.nameAr}
              onChange={(e) => update("nameAr", e.target.value)}
              className="input"
            />
          </Field>
        </div>
      </Section>

      <Section title="Description">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <Field label="Description (English)">
            <textarea
              required
              rows={4}
              value={values.descriptionEn}
              onChange={(e) => update("descriptionEn", e.target.value)}
              className="input"
            />
          </Field>
          <Field label="Description (Arabic)">
            <textarea
              required
              dir="rtl"
              rows={4}
              value={values.descriptionAr}
              onChange={(e) => update("descriptionAr", e.target.value)}
              className="input"
            />
          </Field>
          <Field label="Materials (English)">
            <input
              required
              value={values.materialsEn}
              onChange={(e) => update("materialsEn", e.target.value)}
              className="input"
            />
          </Field>
          <Field label="Materials (Arabic)">
            <input
              required
              dir="rtl"
              value={values.materialsAr}
              onChange={(e) => update("materialsAr", e.target.value)}
              className="input"
            />
          </Field>
          <Field label="Care (English)">
            <input
              required
              value={values.careEn}
              onChange={(e) => update("careEn", e.target.value)}
              className="input"
            />
          </Field>
          <Field label="Care (Arabic)">
            <input
              required
              dir="rtl"
              value={values.careAr}
              onChange={(e) => update("careAr", e.target.value)}
              className="input"
            />
          </Field>
          <Field label="Dimensions">
            <input
              required
              value={values.dimensions}
              onChange={(e) => update("dimensions", e.target.value)}
              placeholder="28 × 12 × 8 cm"
              className="input"
            />
          </Field>
          <Field label="Country of Origin">
            <input
              required
              list="origin-options"
              value={values.originCountry}
              onChange={(e) => update("originCountry", e.target.value)}
              placeholder="Spain"
              className="input"
            />
            <datalist id="origin-options">
              {originOptions.map((o) => (
                <option key={o} value={o} />
              ))}
            </datalist>
          </Field>
        </div>
      </Section>

      <Section title="Pricing & Stock">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
          <Field label="Price (DA)">
            <input
              required
              type="number"
              min={0}
              value={values.price}
              onChange={(e) => update("price", Number(e.target.value))}
              className="input"
            />
          </Field>
          <Field label="Compare-at (DA)">
            <input
              type="number"
              min={0}
              value={values.compareAtPrice ?? ""}
              onChange={(e) =>
                update("compareAtPrice", e.target.value ? Number(e.target.value) : null)
              }
              className="input"
            />
          </Field>
          <Field label="Stock Quantity">
            <input
              required
              type="number"
              value={values.stockQty}
              onChange={(e) => update("stockQty", Number(e.target.value))}
              className="input"
            />
          </Field>
        </div>
        <p className="mt-2 font-body text-xs text-ink/40">
          Stock can be set to 0 — customers can still place orders (pre-order / backorder).
        </p>
        <div className="mt-4 flex flex-wrap gap-6">
          <Toggle
            label="Best Seller"
            checked={values.isBestSeller}
            onChange={(v) => update("isBestSeller", v)}
          />
          <Toggle label="New Arrival" checked={values.isNew} onChange={(v) => update("isNew", v)} />
          <Toggle
            label="Published"
            checked={values.isPublished}
            onChange={(v) => update("isPublished", v)}
          />
        </div>
      </Section>

      {canEditCosts && (
        <Section title="Cost Breakdown">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-4">
            <Field label="Material (DA)">
              <input
                type="number"
                min={0}
                value={values.materialCost}
                onChange={(e) => update("materialCost", Number(e.target.value))}
                className="input"
              />
            </Field>
            <Field label="Packaging (DA)">
              <input
                type="number"
                min={0}
                value={values.packagingCost}
                onChange={(e) => update("packagingCost", Number(e.target.value))}
                className="input"
              />
            </Field>
            <Field label="Ads (DA)">
              <input
                type="number"
                min={0}
                value={values.adsCost}
                onChange={(e) => update("adsCost", Number(e.target.value))}
                className="input"
              />
            </Field>
            <Field label="Other (DA)">
              <input
                type="number"
                min={0}
                value={values.otherCost}
                onChange={(e) => update("otherCost", Number(e.target.value))}
                className="input"
              />
            </Field>
          </div>
          <div className="mt-4 flex items-center justify-between rounded-xl2 bg-sand px-4 py-3">
            <span className="font-body text-sm text-ink/70">Total cost per unit</span>
            <span className="font-display text-lg text-ink">
              {(
                values.materialCost + values.packagingCost + values.adsCost + values.otherCost
              ).toLocaleString("fr-FR")}{" "}
              DA
            </span>
          </div>
          <div className="mt-2 flex items-center justify-between px-4">
            <span className="font-body text-xs text-ink/50">Margin per unit</span>
            <span className="font-body text-xs text-emerald-600">
              {(
                values.price -
                (values.materialCost + values.packagingCost + values.adsCost + values.otherCost)
              ).toLocaleString("fr-FR")}{" "}
              DA
            </span>
          </div>
        </Section>
      )}

      <Section title="Colors">
        <div className="space-y-3">
          {values.colors.map((c, i) => (
            <div key={i} className="flex flex-wrap items-center gap-3 rounded-xl2 bg-sand p-3">
              <input
                type="color"
                value={c.hex}
                onChange={(e) => updateColor(i, { hex: e.target.value })}
                className="h-10 w-10 cursor-pointer rounded-lg border border-line bg-white"
              />
              <input
                required
                placeholder="Name (EN)"
                value={c.nameEn}
                onChange={(e) => updateColor(i, { nameEn: e.target.value })}
                className="input w-32"
              />
              <input
                required
                placeholder="Name (AR)"
                dir="rtl"
                value={c.nameAr}
                onChange={(e) => updateColor(i, { nameAr: e.target.value })}
                className="input w-32"
              />
              {values.colors.length > 1 && (
                <button type="button" onClick={() => removeColor(i)} className="text-ink/40 hover:text-red-600">
                  <X size={16} />
                </button>
              )}
            </div>
          ))}
          <button type="button" onClick={addColor} className="btn-ghost !px-0 text-gold">
            + Add color
          </button>
        </div>
      </Section>

      <Section title="Images">
        <div className="flex flex-wrap gap-4">
          {values.images.map((img, i) => (
            <div key={i} className="relative h-24 w-24 overflow-hidden rounded-xl2 bg-sand">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img.url} alt="" className="h-full w-full object-cover" />
              <button
                type="button"
                onClick={() => removeImage(i)}
                className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-white/90 text-ink"
              >
                <X size={12} />
              </button>
            </div>
          ))}
          <label className="flex h-24 w-24 cursor-pointer flex-col items-center justify-center gap-1 rounded-xl2 border border-dashed border-line text-ink/40 hover:border-gold hover:text-gold">
            {uploading ? <Loader2 size={18} className="animate-spin" /> : <Upload size={18} />}
            <span className="font-body text-[10px]">Upload</span>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) uploadFile(file);
                e.target.value = "";
              }}
            />
          </label>
        </div>
      </Section>

      {error && <p className="font-body text-sm text-red-600">{error}</p>}

      <button type="submit" disabled={saving || uploading} className="btn-primary disabled:opacity-50">
        {saving ? "Saving…" : initial?.id ? "Save Changes" : "Create Product"}
      </button>
    </form>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="min-w-0 rounded-xl3 bg-white p-6 shadow-soft">
      <h2 className="font-display text-lg text-ink">{title}</h2>
      <div className="mt-5">{children}</div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block font-body text-xs uppercase tracking-wide text-ink/60">
        {label}
      </span>
      {children}
    </label>
  );
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-2 font-body text-sm text-ink/70">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4 accent-[#B8935F]"
      />
      {label}
    </label>
  );
}
