"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2, GripVertical } from "lucide-react";
import ContentTabs from "@/components/admin/ContentTabs";

type FaqItem = {
  id: string;
  questionEn: string;
  questionAr: string;
  answerEn: string;
  answerAr: string;
  sortOrder: number;
  isActive: boolean;
};

export default function FaqAdminPage() {
  const [items, setItems] = useState<FaqItem[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [questionEn, setQuestionEn] = useState("");
  const [questionAr, setQuestionAr] = useState("");
  const [answerEn, setAnswerEn] = useState("");
  const [answerAr, setAnswerAr] = useState("");

  function load() {
    fetch("/api/admin/content/faq")
      .then((r) => r.json())
      .then((d) => setItems(d.items ?? []));
  }

  useEffect(load, []);

  async function addItem(e: React.FormEvent) {
    e.preventDefault();
    if (!questionEn.trim() || !answerEn.trim()) return;
    setSaving(true);
    await fetch("/api/admin/content/faq", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ questionEn, questionAr, answerEn, answerAr }),
    });
    setSaving(false);
    setQuestionEn("");
    setQuestionAr("");
    setAnswerEn("");
    setAnswerAr("");
    setShowForm(false);
    load();
  }

  async function toggleActive(item: FaqItem) {
    setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, isActive: !i.isActive } : i)));
    await fetch(`/api/admin/content/faq/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !item.isActive }),
    });
  }

  async function removeItem(id: string) {
    setItems((prev) => prev.filter((i) => i.id !== id));
    await fetch(`/api/admin/content/faq/${id}`, { method: "DELETE" });
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl text-ink">FAQ</h1>
          <p className="mt-1 font-body text-sm text-ink/50">Questions shown on the public FAQ page.</p>
        </div>
        <button onClick={() => setShowForm((s) => !s)} className="btn-primary !px-5 !py-3 text-xs">
          <Plus size={15} className="mr-1.5" /> Add Question
        </button>
      </div>
      <ContentTabs />

      {showForm && (
        <form onSubmit={addItem} className="mt-6 grid grid-cols-1 gap-4 rounded-xl3 bg-white p-6 shadow-soft sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block font-body text-xs uppercase tracking-wide text-ink/60">Question (English)</label>
            <input value={questionEn} onChange={(e) => setQuestionEn(e.target.value)} required className="input" />
          </div>
          <div>
            <label className="mb-1.5 block font-body text-xs uppercase tracking-wide text-ink/60">Question (Arabic)</label>
            <input value={questionAr} onChange={(e) => setQuestionAr(e.target.value)} dir="rtl" required className="input" />
          </div>
          <div>
            <label className="mb-1.5 block font-body text-xs uppercase tracking-wide text-ink/60">Answer (English)</label>
            <textarea value={answerEn} onChange={(e) => setAnswerEn(e.target.value)} required rows={3} className="input resize-y" />
          </div>
          <div>
            <label className="mb-1.5 block font-body text-xs uppercase tracking-wide text-ink/60">Answer (Arabic)</label>
            <textarea value={answerAr} onChange={(e) => setAnswerAr(e.target.value)} dir="rtl" required rows={3} className="input resize-y" />
          </div>
          <div className="sm:col-span-2">
            <button type="submit" disabled={saving} className="btn-primary !px-6 !py-3 text-xs disabled:opacity-50">
              {saving ? "Saving…" : "Save Question"}
            </button>
          </div>
        </form>
      )}

      <div className="mt-6 space-y-3">
        {items.map((item) => (
          <div key={item.id} className={`rounded-xl3 bg-white p-5 shadow-soft ${!item.isActive ? "opacity-50" : ""}`}>
            <div className="flex items-start justify-between gap-4">
              <div className="flex gap-3">
                <GripVertical size={16} className="mt-1 shrink-0 text-ink/20" />
                <div>
                  <p className="font-display text-base text-ink">{item.questionEn}</p>
                  <p className="mt-1 font-body text-sm text-ink/60">{item.answerEn}</p>
                  <p className="mt-2 font-body text-sm text-ink/40" dir="rtl">{item.questionAr}</p>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <button
                  onClick={() => toggleActive(item)}
                  className="font-body text-xs text-ink/50 hover:text-ink"
                >
                  {item.isActive ? "Hide" : "Show"}
                </button>
                <button onClick={() => removeItem(item.id)} className="text-ink/30 hover:text-red-600">
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          </div>
        ))}
        {items.length === 0 && <p className="font-body text-sm text-ink/40">No FAQ items yet.</p>}
      </div>
    </div>
  );
}
