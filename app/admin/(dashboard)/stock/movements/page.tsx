"use client";

import { useEffect, useState } from "react";
import { ArrowUpCircle, ArrowDownCircle } from "lucide-react";
import StockTabs from "@/components/admin/StockTabs";

type Movement = {
  id: string;
  productName: string;
  productSku: string;
  type: string;
  qtyChange: number;
  qtyAfter: number;
  reason: string | null;
  actorName: string | null;
  createdAt: string;
};

const TYPE_LABEL: Record<string, string> = {
  SALE: "Sale",
  RESTOCK: "Restock",
  ADJUSTMENT: "Adjustment",
  DAMAGE: "Damage",
  RETURN: "Return",
};

export default function StockMovementsPage() {
  const [movements, setMovements] = useState<Movement[]>([]);
  const [type, setType] = useState("ALL");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/admin/stock/movements${type === "ALL" ? "" : `?type=${type}`}`)
      .then((r) => r.json())
      .then((d) => setMovements(d.movements ?? []))
      .finally(() => setLoading(false));
  }, [type]);

  return (
    <div>
      <h1 className="font-display text-3xl text-ink">Stock</h1>
      <StockTabs />

      <div className="mt-6 flex gap-2 overflow-x-auto">
        {["ALL", "SALE", "RESTOCK", "ADJUSTMENT", "DAMAGE", "RETURN"].map((t) => (
          <button
            key={t}
            onClick={() => setType(t)}
            className={`rounded-full px-4 py-2 font-body text-xs transition-colors ${
              type === t ? "bg-ink text-white" : "bg-white text-ink/60 hover:text-ink"
            }`}
          >
            {t === "ALL" ? "All" : TYPE_LABEL[t]}
          </button>
        ))}
      </div>

      <div className="mt-6 rounded-xl3 bg-white p-6 shadow-soft">
        {loading && <p className="font-body text-sm text-ink/40">Loading…</p>}
        {!loading && movements.length === 0 && (
          <p className="font-body text-sm text-ink/40">No stock movements recorded yet.</p>
        )}
        <ul className="divide-y divide-line">
          {movements.map((m) => (
            <li key={m.id} className="flex items-center gap-3 py-3.5">
              {m.qtyChange < 0 ? (
                <ArrowDownCircle size={18} className="text-red-500/70" />
              ) : (
                <ArrowUpCircle size={18} className="text-emerald-600/70" />
              )}
              <div className="flex-1">
                <p className="font-body text-sm text-ink">
                  {m.productName} <span className="text-ink/40">({m.productSku})</span>
                </p>
                <p className="font-body text-[11px] text-ink/40">
                  {TYPE_LABEL[m.type] ?? m.type} · {m.reason ?? "—"} · {m.actorName ?? "System"} ·{" "}
                  {new Date(m.createdAt).toLocaleDateString("en-US", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
              <div className="text-right">
                <p className={`font-body text-sm ${m.qtyChange < 0 ? "text-red-600" : "text-emerald-600"}`}>
                  {m.qtyChange > 0 ? "+" : ""}
                  {m.qtyChange}
                </p>
                <p className="font-body text-[11px] text-ink/40">now {m.qtyAfter}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
