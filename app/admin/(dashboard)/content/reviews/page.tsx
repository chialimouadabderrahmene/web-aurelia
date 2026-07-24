"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2, Star } from "lucide-react";
import ContentTabs from "@/components/admin/ContentTabs";

type ReviewItem = {
  id: string;
  authorName: string;
  rating: number;
  text: string;
  product: string | null;
  isActive: boolean;
};

export default function ReviewsAdminPage() {
  const [items, setItems] = useState<ReviewItem[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [authorName, setAuthorName] = useState("");
  const [rating, setRating] = useState(5);
  const [text, setText] = useState("");
  const [product, setProduct] = useState("");

  function load() {
    fetch("/api/admin/content/reviews")
      .then((r) => r.json())
      .then((d) => setItems(d.items ?? []));
  }

  useEffect(load, []);

  async function addItem(e: React.FormEvent) {
    e.preventDefault();
    if (!authorName.trim() || !text.trim()) return;
    setSaving(true);
    await fetch("/api/admin/content/reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ authorName, rating, text, product: product || undefined }),
    });
    setSaving(false);
    setAuthorName("");
    setRating(5);
    setText("");
    setProduct("");
    setShowForm(false);
    load();
  }

  async function toggleActive(item: ReviewItem) {
    setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, isActive: !i.isActive } : i)));
    await fetch(`/api/admin/content/reviews/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !item.isActive }),
    });
  }

  async function removeItem(id: string) {
    setItems((prev) => prev.filter((i) => i.id !== id));
    await fetch(`/api/admin/content/reviews/${id}`, { method: "DELETE" });
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl text-ink">Reviews</h1>
          <p className="mt-1 font-body text-sm text-ink/50">Customer testimonials shown on the site.</p>
        </div>
        <button onClick={() => setShowForm((s) => !s)} className="btn-primary !px-5 !py-3 text-xs">
          <Plus size={15} className="mr-1.5" /> Add Review
        </button>
      </div>
      <ContentTabs />

      {showForm && (
        <form onSubmit={addItem} className="mt-6 grid grid-cols-1 gap-4 rounded-xl3 bg-white p-6 shadow-soft sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block font-body text-xs uppercase tracking-wide text-ink/60">Customer Name</label>
            <input value={authorName} onChange={(e) => setAuthorName(e.target.value)} required className="input" />
          </div>
          <div>
            <label className="mb-1.5 block font-body text-xs uppercase tracking-wide text-ink/60">Rating</label>
            <select value={rating} onChange={(e) => setRating(Number(e.target.value))} className="input">
              {[5, 4, 3, 2, 1].map((r) => (
                <option key={r} value={r}>
                  {r} stars
                </option>
              ))}
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1.5 block font-body text-xs uppercase tracking-wide text-ink/60">Review Text</label>
            <textarea value={text} onChange={(e) => setText(e.target.value)} required rows={3} className="input resize-y" />
          </div>
          <div>
            <label className="mb-1.5 block font-body text-xs uppercase tracking-wide text-ink/60">Product (optional)</label>
            <input value={product} onChange={(e) => setProduct(e.target.value)} className="input" />
          </div>
          <div className="sm:col-span-2">
            <button type="submit" disabled={saving} className="btn-primary !px-6 !py-3 text-xs disabled:opacity-50">
              {saving ? "Saving…" : "Save Review"}
            </button>
          </div>
        </form>
      )}

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <div key={item.id} className={`rounded-xl3 bg-white p-6 shadow-soft ${!item.isActive ? "opacity-50" : ""}`}>
            <div className="flex justify-between">
              <div className="flex gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} size={13} fill={i < item.rating ? "#B8935F" : "none"} color="#B8935F" strokeWidth={1.5} />
                ))}
              </div>
              <button onClick={() => removeItem(item.id)} className="text-ink/30 hover:text-red-600">
                <Trash2 size={15} />
              </button>
            </div>
            <p className="mt-3 font-body text-sm text-ink/70">"{item.text}"</p>
            <div className="mt-4 flex items-center justify-between">
              <div>
                <p className="font-body text-sm font-medium text-ink">{item.authorName}</p>
                {item.product && <p className="font-body text-xs text-ink/40">{item.product}</p>}
              </div>
              <button onClick={() => toggleActive(item)} className="font-body text-xs text-ink/50 hover:text-ink">
                {item.isActive ? "Hide" : "Show"}
              </button>
            </div>
          </div>
        ))}
        {items.length === 0 && <p className="font-body text-sm text-ink/40">No reviews yet.</p>}
      </div>
    </div>
  );
}
