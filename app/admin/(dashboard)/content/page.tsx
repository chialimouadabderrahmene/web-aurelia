"use client";

import { useEffect, useState } from "react";
import { Check } from "lucide-react";
import ContentTabs from "@/components/admin/ContentTabs";

type SiteContent = {
  orderConfirmTitleEn: string;
  orderConfirmTitleAr: string;
  orderConfirmBodyEn: string;
  orderConfirmBodyAr: string;
  aboutEyebrowEn: string;
  aboutEyebrowAr: string;
  aboutTitleEn: string;
  aboutTitleAr: string;
  aboutP1En: string;
  aboutP1Ar: string;
  aboutP2En: string;
  aboutP2Ar: string;
  aboutP3En: string;
  aboutP3Ar: string;
  aboutStatCustomers: string;
  aboutStatWilayas: string;
  aboutStatRating: string;
  heroVideoUrl: string;
  buyNowTitleEn: string;
  buyNowTitleAr: string;
  buyNowSubtitleEn: string;
  buyNowSubtitleAr: string;
  trustDeliveryEn: string;
  trustDeliveryAr: string;
  trustCodEn: string;
  trustCodAr: string;
  trustReturnsEn: string;
  trustReturnsAr: string;
};

function Field({
  label,
  value,
  onChange,
  dir = "ltr",
  textarea = false,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  dir?: "ltr" | "rtl";
  textarea?: boolean;
}) {
  return (
    <div>
      <label className="mb-1.5 block font-body text-xs uppercase tracking-wide text-ink/60">{label}</label>
      {textarea ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          dir={dir}
          rows={3}
          className="input resize-y"
        />
      ) : (
        <input value={value} onChange={(e) => onChange(e.target.value)} dir={dir} className="input" />
      )}
    </div>
  );
}

export default function ContentOverviewPage() {
  const [content, setContent] = useState<SiteContent | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("/api/admin/content/site")
      .then((r) => r.json())
      .then((d) => setContent(d.content));
  }, []);

  function set<K extends keyof SiteContent>(key: K, value: string) {
    setContent((prev) => (prev ? { ...prev, [key]: value } : prev));
  }

  async function save() {
    if (!content) return;
    setSaving(true);
    await fetch("/api/admin/content/site", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(content),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  if (!content) return <p className="font-body text-sm text-ink/40">Loading…</p>;

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl text-ink">Content</h1>
          <p className="mt-1 font-body text-sm text-ink/50">About page copy and the order confirmation message.</p>
        </div>
        <button onClick={save} disabled={saving} className="btn-primary !px-5 !py-3 text-xs disabled:opacity-50">
          {saved ? <Check size={14} className="mr-1.5" /> : null}
          {saving ? "Saving…" : saved ? "Saved" : "Save Changes"}
        </button>
      </div>
      <ContentTabs />

      <div className="mt-8 rounded-xl3 bg-white p-6 shadow-soft">
        <h2 className="font-display text-lg text-ink">Homepage Hero Video</h2>
        <p className="mt-1 font-body text-sm text-ink/50">
          The full-bleed background video on the homepage hero. Must be a direct .mp4 URL.
        </p>
        <div className="mt-4">
          <Field label="Hero Video URL" value={content.heroVideoUrl} onChange={(v) => set("heroVideoUrl", v)} />
        </div>
        {content.heroVideoUrl && (
          <video src={content.heroVideoUrl} muted loop autoPlay playsInline className="mt-4 h-40 w-72 rounded-xl2 object-cover" />
        )}
      </div>

      <div className="mt-6 rounded-xl3 bg-white p-6 shadow-soft">
        <h2 className="font-display text-lg text-ink">Fast Checkout Header</h2>
        <p className="mt-1 font-body text-sm text-ink/50">
          The title and subtitle shown above the express "Buy Now" form on every product page.
        </p>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Title (English)" value={content.buyNowTitleEn} onChange={(v) => set("buyNowTitleEn", v)} />
          <Field label="Title (Arabic)" value={content.buyNowTitleAr} onChange={(v) => set("buyNowTitleAr", v)} dir="rtl" />
          <Field label="Subtitle (English)" value={content.buyNowSubtitleEn} onChange={(v) => set("buyNowSubtitleEn", v)} />
          <Field label="Subtitle (Arabic)" value={content.buyNowSubtitleAr} onChange={(v) => set("buyNowSubtitleAr", v)} dir="rtl" />
        </div>
      </div>

      <div className="mt-6 rounded-xl3 bg-white p-6 shadow-soft">
        <h2 className="font-display text-lg text-ink">Trust Badges</h2>
        <p className="mt-1 font-body text-sm text-ink/50">
          The three trust badges shown under the price on every product page (delivery, cash on delivery, returns).
        </p>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Delivery (English)" value={content.trustDeliveryEn} onChange={(v) => set("trustDeliveryEn", v)} />
          <Field label="Delivery (Arabic)" value={content.trustDeliveryAr} onChange={(v) => set("trustDeliveryAr", v)} dir="rtl" />
          <Field label="Cash on Delivery (English)" value={content.trustCodEn} onChange={(v) => set("trustCodEn", v)} />
          <Field label="Cash on Delivery (Arabic)" value={content.trustCodAr} onChange={(v) => set("trustCodAr", v)} dir="rtl" />
          <Field label="Returns (English)" value={content.trustReturnsEn} onChange={(v) => set("trustReturnsEn", v)} />
          <Field label="Returns (Arabic)" value={content.trustReturnsAr} onChange={(v) => set("trustReturnsAr", v)} dir="rtl" />
        </div>
      </div>

      <div className="mt-6 rounded-xl3 bg-white p-6 shadow-soft">
        <h2 className="font-display text-lg text-ink">Order Confirmation Message</h2>
        <p className="mt-1 font-body text-sm text-ink/50">
          Shown to customers right after they place an order (fast checkout and full checkout).
        </p>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Title (English)" value={content.orderConfirmTitleEn} onChange={(v) => set("orderConfirmTitleEn", v)} />
          <Field label="Title (Arabic)" value={content.orderConfirmTitleAr} onChange={(v) => set("orderConfirmTitleAr", v)} dir="rtl" />
          <Field label="Body (English)" value={content.orderConfirmBodyEn} onChange={(v) => set("orderConfirmBodyEn", v)} textarea />
          <Field label="Body (Arabic)" value={content.orderConfirmBodyAr} onChange={(v) => set("orderConfirmBodyAr", v)} dir="rtl" textarea />
        </div>
      </div>

      <div className="mt-6 rounded-xl3 bg-white p-6 shadow-soft">
        <h2 className="font-display text-lg text-ink">About Page</h2>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Eyebrow (English)" value={content.aboutEyebrowEn} onChange={(v) => set("aboutEyebrowEn", v)} />
          <Field label="Eyebrow (Arabic)" value={content.aboutEyebrowAr} onChange={(v) => set("aboutEyebrowAr", v)} dir="rtl" />
          <Field label="Title (English)" value={content.aboutTitleEn} onChange={(v) => set("aboutTitleEn", v)} />
          <Field label="Title (Arabic)" value={content.aboutTitleAr} onChange={(v) => set("aboutTitleAr", v)} dir="rtl" />
          <Field label="Paragraph 1 (English)" value={content.aboutP1En} onChange={(v) => set("aboutP1En", v)} textarea />
          <Field label="Paragraph 1 (Arabic)" value={content.aboutP1Ar} onChange={(v) => set("aboutP1Ar", v)} dir="rtl" textarea />
          <Field label="Paragraph 2 (English)" value={content.aboutP2En} onChange={(v) => set("aboutP2En", v)} textarea />
          <Field label="Paragraph 2 (Arabic)" value={content.aboutP2Ar} onChange={(v) => set("aboutP2Ar", v)} dir="rtl" textarea />
          <Field label="Paragraph 3 (English)" value={content.aboutP3En} onChange={(v) => set("aboutP3En", v)} textarea />
          <Field label="Paragraph 3 (Arabic)" value={content.aboutP3Ar} onChange={(v) => set("aboutP3Ar", v)} dir="rtl" textarea />
        </div>

        <h3 className="mt-6 font-display text-base text-ink">Stats</h3>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Field label="Customers stat" value={content.aboutStatCustomers} onChange={(v) => set("aboutStatCustomers", v)} />
          <Field label="Wilayas stat" value={content.aboutStatWilayas} onChange={(v) => set("aboutStatWilayas", v)} />
          <Field label="Rating stat" value={content.aboutStatRating} onChange={(v) => set("aboutStatRating", v)} />
        </div>
      </div>
    </div>
  );
}
