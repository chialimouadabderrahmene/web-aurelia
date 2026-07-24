"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Search, Crown, Ban } from "lucide-react";
import { formatDzd } from "@/lib/utils";
import { SEGMENT_LABELS, Segment } from "@/lib/rfm";

type CustomerRow = {
  id: string;
  name: string;
  phone: string;
  wilaya: string | null;
  tags: string[];
  isVip: boolean;
  isBlacklisted: boolean;
  orderCount: number;
  totalSpent: number;
  segment: Segment;
};

const SEGMENT_STYLE: Record<Segment, string> = {
  champion: "bg-gold/10 text-gold",
  regular: "bg-sand text-ink/60",
  new: "bg-blue-100 text-blue-700",
  at_risk: "bg-amber-100 text-amber-700",
  lost: "bg-red-100 text-red-700",
  no_orders: "bg-sand text-ink/40",
};

const SEGMENTS: (Segment | "ALL")[] = ["ALL", "champion", "regular", "new", "at_risk", "lost", "no_orders"];

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<CustomerRow[]>([]);
  const [q, setQ] = useState("");
  const [segment, setSegment] = useState<Segment | "ALL">("ALL");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (segment !== "ALL") params.set("segment", segment);
    const qs = params.toString() ? `?${params.toString()}` : "";
    const t = setTimeout(() => {
      fetch(`/api/admin/customers${qs}`)
        .then((r) => r.json())
        .then((d) => setCustomers(d.customers ?? []))
        .finally(() => setLoading(false));
    }, 250);
    return () => clearTimeout(t);
  }, [q, segment]);

  return (
    <div>
      <h1 className="font-display text-3xl text-ink">Customers</h1>

      <div className="mt-6 relative max-w-sm">
        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-ink/40" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search by name or phone"
          className="input pl-10"
        />
      </div>

      <div className="mt-4 flex gap-2 overflow-x-auto">
        {SEGMENTS.map((s) => (
          <button
            key={s}
            onClick={() => setSegment(s)}
            className={`whitespace-nowrap rounded-full px-4 py-2 font-body text-xs ${
              segment === s ? "bg-ink text-white" : "bg-white text-ink/60 hover:text-ink"
            }`}
          >
            {s === "ALL" ? "All" : SEGMENT_LABELS[s]}
          </button>
        ))}
      </div>

      <div className="mt-6 overflow-x-auto rounded-xl3 bg-white shadow-soft">
        <table className="w-full text-left font-body text-sm">
          <thead>
            <tr className="border-b border-line text-ink/50">
              <th className="px-5 py-4 font-normal">Customer</th>
              <th className="px-5 py-4 font-normal">Phone</th>
              <th className="px-5 py-4 font-normal">Wilaya</th>
              <th className="px-5 py-4 font-normal">Segment</th>
              <th className="px-5 py-4 font-normal">Orders</th>
              <th className="px-5 py-4 font-normal">Spent</th>
            </tr>
          </thead>
          <tbody>
            {!loading && customers.length === 0 && (
              <tr>
                <td colSpan={6} className="px-5 py-10 text-center text-ink/40">
                  No customers yet.
                </td>
              </tr>
            )}
            {customers.map((c) => (
              <tr key={c.id} className="border-b border-line last:border-0 hover:bg-sand/60">
                <td className="px-5 py-4">
                  <Link href={`/admin/customers/${c.id}`} className="flex items-center gap-2 text-ink hover:text-gold">
                    {c.name}
                    {c.isVip && <Crown size={14} className="text-gold" />}
                    {c.isBlacklisted && <Ban size={14} className="text-red-500" />}
                  </Link>
                  {c.tags.length > 0 && (
                    <div className="mt-1 flex flex-wrap gap-1">
                      {c.tags.map((t) => (
                        <span key={t} className="rounded-full bg-sand px-2 py-0.5 text-[10px] text-ink/60">
                          {t}
                        </span>
                      ))}
                    </div>
                  )}
                </td>
                <td className="px-5 py-4 text-ink/70">{c.phone}</td>
                <td className="px-5 py-4 text-ink/70">{c.wilaya ?? "—"}</td>
                <td className="px-5 py-4">
                  <span className={`rounded-full px-2.5 py-1 text-xs ${SEGMENT_STYLE[c.segment]}`}>
                    {SEGMENT_LABELS[c.segment]}
                  </span>
                </td>
                <td className="px-5 py-4 text-ink/70">{c.orderCount}</td>
                <td className="px-5 py-4 text-ink">{formatDzd(c.totalSpent)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
