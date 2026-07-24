"use client";

import { useEffect, useState } from "react";
import { ShieldCheck } from "lucide-react";

type Log = {
  id: string;
  actorName: string;
  action: string;
  entityType: string;
  entityId: string | null;
  summary: string;
  createdAt: string;
};

const ENTITY_TYPES = ["ALL", "Product", "AdminUser", "Expense", "Supplier", "PurchaseOrder", "Settings"];

export default function AuditLogPage() {
  const [logs, setLogs] = useState<Log[]>([]);
  const [entityType, setEntityType] = useState("ALL");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/admin/audit-log${entityType === "ALL" ? "" : `?entityType=${entityType}`}`)
      .then((r) => r.json())
      .then((d) => setLogs(d.logs ?? []))
      .finally(() => setLoading(false));
  }, [entityType]);

  return (
    <div>
      <h1 className="font-display text-3xl text-ink">Audit Log</h1>
      <p className="mt-1 font-body text-sm text-ink/50">
        Who created, edited, or deleted what across the admin panel.
      </p>

      <div className="mt-6 flex flex-wrap gap-2">
        {ENTITY_TYPES.map((t) => (
          <button
            key={t}
            onClick={() => setEntityType(t)}
            className={`rounded-full px-4 py-2 font-body text-xs transition-colors ${
              entityType === t ? "bg-ink text-white" : "bg-white text-ink/60 hover:text-ink"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="mt-6 rounded-xl3 bg-white p-6 shadow-soft">
        {loading && <p className="font-body text-sm text-ink/40">Loading…</p>}
        {!loading && logs.length === 0 && (
          <p className="font-body text-sm text-ink/40">No activity recorded yet.</p>
        )}
        <ul className="divide-y divide-line">
          {logs.map((l) => (
            <li key={l.id} className="flex items-start gap-3 py-3.5">
              <ShieldCheck size={16} className="mt-0.5 text-ink/30" />
              <div className="flex-1">
                <p className="font-body text-sm text-ink">{l.summary}</p>
                <p className="font-body text-[11px] text-ink/40">
                  {l.actorName} · {l.action} ·{" "}
                  {new Date(l.createdAt).toLocaleDateString("en-US", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
