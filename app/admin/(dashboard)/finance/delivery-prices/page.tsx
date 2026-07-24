"use client";

import { useEffect, useState } from "react";
import { Check } from "lucide-react";
import FinanceTabs from "@/components/admin/FinanceTabs";

type Price = { wilayaCode: string; wilayaName: string; price: number };

export default function DeliveryPricesPage() {
  const [prices, setPrices] = useState<Price[]>([]);
  const [drafts, setDrafts] = useState<Record<string, number>>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("/api/admin/delivery-prices")
      .then((r) => r.json())
      .then((d) => setPrices(d.prices ?? []));
  }, []);

  async function saveAll() {
    if (Object.keys(drafts).length === 0) return;
    setSaving(true);
    const updates = Object.entries(drafts).map(([wilayaCode, price]) => ({ wilayaCode, price }));
    await fetch("/api/admin/delivery-prices", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ updates }),
    });
    setSaving(false);
    setSaved(true);
    setPrices((prev) => prev.map((p) => (p.wilayaCode in drafts ? { ...p, price: drafts[p.wilayaCode] } : p)));
    setDrafts({});
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl text-ink">Delivery Prices</h1>
          <p className="mt-1 font-body text-sm text-ink/50">
            Home delivery fee charged per wilaya, added on top of product price at checkout.
          </p>
        </div>
        <button
          onClick={saveAll}
          disabled={saving || Object.keys(drafts).length === 0}
          className="btn-primary !px-5 !py-3 text-xs disabled:opacity-40"
        >
          {saved ? <Check size={15} className="mr-1.5" /> : null}
          {saving ? "Saving…" : saved ? "Saved" : `Save Changes (${Object.keys(drafts).length})`}
        </button>
      </div>
      <FinanceTabs />

      <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {prices.map((p) => (
          <div
            key={p.wilayaCode}
            className="flex items-center justify-between gap-3 rounded-xl2 bg-white p-4 shadow-soft"
          >
            <div>
              <p className="font-body text-xs text-ink/40">{p.wilayaCode}</p>
              <p className="font-body text-sm text-ink">{p.wilayaName}</p>
            </div>
            <div className="flex items-center gap-1">
              <input
                type="number"
                min={0}
                defaultValue={p.price}
                onChange={(e) =>
                  setDrafts((d) => ({ ...d, [p.wilayaCode]: Number(e.target.value) }))
                }
                className="w-24 rounded-lg border border-line px-3 py-2 text-right font-body text-sm"
              />
              <span className="font-body text-xs text-ink/40">DA</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
