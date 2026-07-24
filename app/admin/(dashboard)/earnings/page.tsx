"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { formatDzd } from "@/lib/utils";
import StatusBadge from "@/components/admin/StatusBadge";

type AgentEarnings = {
  agentId: string;
  agentName: string;
  orderCount: number;
  totalEarned: number;
  orders: { id: string; orderNumber: string; status: string; confirmedAt: string | null }[];
};

export default function EarningsPage() {
  const [commissionPerOrder, setCommissionPerOrder] = useState(0);
  const [agents, setAgents] = useState<AgentEarnings[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/earnings")
      .then((r) => r.json())
      .then((d) => {
        setCommissionPerOrder(d.commissionPerOrder ?? 0);
        setAgents(d.agents ?? []);
      });
  }, []);

  const soloAgent = agents.length === 1;

  return (
    <div>
      <h1 className="font-display text-3xl text-ink">My Earnings</h1>
      <p className="mt-1 font-body text-sm text-ink/50">
        {formatDzd(commissionPerOrder)} per confirmed or delivered order.
      </p>

      {agents.length === 0 && (
        <p className="mt-8 font-body text-sm text-ink/40">No commissions earned yet.</p>
      )}

      <div className="mt-6 space-y-4">
        {agents.map((a) => (
          <div key={a.agentId} className="rounded-xl3 bg-white p-6 shadow-soft">
            <div className="flex items-center justify-between">
              <div>
                {!soloAgent && <p className="font-display text-lg text-ink">{a.agentName}</p>}
                <p className="font-body text-sm text-ink/50">{a.orderCount} orders confirmed/delivered</p>
              </div>
              <div className="text-right">
                <p className="font-display text-2xl text-gold">{formatDzd(a.totalEarned)}</p>
                <button
                  onClick={() => setExpanded(expanded === a.agentId ? null : a.agentId)}
                  className="font-body text-xs text-ink/50 hover:text-ink"
                >
                  {expanded === a.agentId ? "Hide orders" : "View orders"}
                </button>
              </div>
            </div>

            {expanded === a.agentId && (
              <ul className="mt-4 divide-y divide-line border-t border-line pt-2">
                {a.orders.map((o) => (
                  <li key={o.id} className="flex items-center justify-between py-2.5">
                    <Link href={`/admin/orders/${o.id}`} className="font-body text-sm text-ink hover:text-gold">
                      #{o.orderNumber}
                    </Link>
                    <div className="flex items-center gap-3">
                      <StatusBadge status={o.status} />
                      <span className="font-body text-xs text-ink/40">
                        {o.confirmedAt ? new Date(o.confirmedAt).toLocaleDateString() : "—"}
                      </span>
                      <span className="font-body text-sm text-ink">{formatDzd(commissionPerOrder)}</span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
