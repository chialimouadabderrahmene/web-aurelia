"use client";

import { useEffect, useMemo, useState } from "react";
import { TrendingUp, TrendingDown } from "lucide-react";
import { formatDzd } from "@/lib/utils";
import FinanceTabs from "@/components/admin/FinanceTabs";

type ProductOption = {
  id: string;
  nameEn: string;
  sku: string;
  price: number;
  costPrice: number;
  packagingCost: number;
};

export default function ForecastPage() {
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [productId, setProductId] = useState("");
  const [qty, setQty] = useState(300);
  const [unitCost, setUnitCost] = useState(0);
  const [sellPrice, setSellPrice] = useState(0);
  const [packagingCost, setPackagingCost] = useState(0);
  const [adSpend, setAdSpend] = useState(30000);
  const [otherCosts, setOtherCosts] = useState(0);
  const [sellThrough, setSellThrough] = useState(85);
  const [commissionRate, setCommissionRate] = useState(100);
  const [deliveryCostPerOrder, setDeliveryCostPerOrder] = useState(400);

  useEffect(() => {
    fetch("/api/admin/products")
      .then((r) => r.json())
      .then((d) => setProducts(d.products ?? []));
    fetch("/api/admin/settings")
      .then((r) => r.json())
      .then((d) => setCommissionRate(d.settings?.confirmationCommission ?? 100));
  }, []);

  function pickProduct(id: string) {
    setProductId(id);
    const p = products.find((x) => x.id === id);
    if (p) {
      setUnitCost(p.costPrice);
      setSellPrice(p.price);
      setPackagingCost(p.packagingCost);
    }
  }

  const result = useMemo(() => {
    const unitsSold = Math.round(qty * (sellThrough / 100));
    const totalInvestment = qty * unitCost + qty * packagingCost + adSpend + otherCosts;
    const revenue = unitsSold * sellPrice;
    const commissionCost = unitsSold * commissionRate;
    const deliveryCost = unitsSold * deliveryCostPerOrder;
    const netProfit = revenue - totalInvestment - commissionCost - deliveryCost;
    const roi = totalInvestment > 0 ? (netProfit / totalInvestment) * 100 : 0;
    const marginPerUnit = sellPrice - unitCost - packagingCost - commissionRate - deliveryCostPerOrder;
    const breakEvenUnits = marginPerUnit > 0 ? Math.ceil(totalInvestment / marginPerUnit) : null;
    return { unitsSold, totalInvestment, revenue, commissionCost, deliveryCost, netProfit, roi, breakEvenUnits, marginPerUnit };
  }, [qty, unitCost, sellPrice, packagingCost, adSpend, otherCosts, sellThrough, commissionRate, deliveryCostPerOrder]);

  return (
    <div>
      <h1 className="font-display text-3xl text-ink">Profit Forecast</h1>
      <p className="mt-1 font-body text-sm text-ink/50">
        Model a restock decision — buy N units, spend on ads and packaging, see the projected outcome before committing money.
      </p>
      <FinanceTabs />

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="min-w-0 rounded-xl3 bg-white p-6 shadow-soft">
          <h2 className="font-display text-lg text-ink">Scenario</h2>

          <div className="mt-4">
            <label className="mb-1.5 block font-body text-xs uppercase tracking-wide text-ink/60">Product (optional — fills defaults)</label>
            <select value={productId} onChange={(e) => pickProduct(e.target.value)} className="input">
              <option value="">Custom / no product selected</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nameEn} ({p.sku})
                </option>
              ))}
            </select>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-4">
            <Field label="Quantity to purchase" value={qty} onChange={setQty} />
            <Field label="Expected sell-through %" value={sellThrough} onChange={setSellThrough} suffix="%" />
            <Field label="Unit cost (DA)" value={unitCost} onChange={setUnitCost} />
            <Field label="Sell price (DA)" value={sellPrice} onChange={setSellPrice} />
            <Field label="Packaging / unit (DA)" value={packagingCost} onChange={setPackagingCost} />
            <Field label="Delivery / order (DA)" value={deliveryCostPerOrder} onChange={setDeliveryCostPerOrder} />
            <Field label="Agent commission / order (DA)" value={commissionRate} onChange={setCommissionRate} />
            <Field label="Ad spend — total (DA)" value={adSpend} onChange={setAdSpend} />
            <Field label="Other one-time costs (DA)" value={otherCosts} onChange={setOtherCosts} />
          </div>
        </div>

        <div className="space-y-6">
          <div className={`rounded-xl3 p-6 text-white shadow-soft ${result.netProfit >= 0 ? "bg-ink" : "bg-red-900"}`}>
            <div className="flex items-center gap-2">
              {result.netProfit >= 0 ? <TrendingUp size={18} className="text-gold" /> : <TrendingDown size={18} className="text-red-300" />}
              <p className="font-body text-xs uppercase tracking-wide text-white/60">Projected Net Profit</p>
            </div>
            <p className={`mt-2 font-display text-4xl ${result.netProfit >= 0 ? "text-gold" : "text-red-300"}`}>
              {formatDzd(result.netProfit)}
            </p>
            <p className="mt-1 font-body text-sm text-white/60">ROI: {result.roi.toFixed(1)}%</p>
          </div>

          <div className="min-w-0 rounded-xl3 bg-white p-6 shadow-soft">
            <h3 className="font-display text-base text-ink">Breakdown</h3>
            <div className="mt-3 divide-y divide-line/60 font-body text-sm">
              <Row label={`Units expected to sell (of ${qty})`} value={result.unitsSold.toString()} />
              <Row label="Total investment" value={formatDzd(result.totalInvestment)} />
              <Row label="Projected revenue" value={formatDzd(result.revenue)} />
              <Row label="Agent commissions" value={`− ${formatDzd(result.commissionCost)}`} />
              <Row label="Delivery costs" value={`− ${formatDzd(result.deliveryCost)}`} />
              <Row label="Net profit" value={formatDzd(result.netProfit)} bold />
            </div>
            <p className="mt-4 font-body text-xs text-ink/40">
              {result.breakEvenUnits
                ? `Break-even at ${result.breakEvenUnits} units sold (${((result.breakEvenUnits / qty) * 100).toFixed(0)}% sell-through).`
                : "Margin per unit is zero or negative at these settings — this batch cannot break even."}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  suffix,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  suffix?: string;
}) {
  return (
    <div>
      <label className="mb-1.5 block font-body text-xs uppercase tracking-wide text-ink/60">{label}</label>
      <div className="relative">
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="input"
        />
        {suffix && <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 font-body text-xs text-ink/40">{suffix}</span>}
      </div>
    </div>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className={`flex items-center justify-between py-2.5 ${bold ? "border-t border-line pt-3 font-medium" : ""}`}>
      <span className="text-ink/60">{label}</span>
      <span className={bold ? "text-ink" : "text-ink/80"}>{value}</span>
    </div>
  );
}
