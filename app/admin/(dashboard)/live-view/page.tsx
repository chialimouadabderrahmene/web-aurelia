"use client";

import { useEffect, useState } from "react";
import TrendChart from "@/components/admin/TrendChart";

type LiveView = {
  activeNow: number;
  perMinute: { label: string; value: number; visitors: number }[];
  topPaths: { path: string; count: number }[];
};

export default function LiveViewPage() {
  const [data, setData] = useState<LiveView | null>(null);

  useEffect(() => {
    let cancelled = false;
    function load() {
      fetch("/api/admin/live-view")
        .then((r) => r.json())
        .then((d) => {
          if (!cancelled) setData(d);
        })
        .catch(() => {});
    }
    load();
    const interval = setInterval(load, 10_000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  const enteredLastMinute = data?.perMinute[data.perMinute.length - 1]?.visitors ?? 0;

  return (
    <div>
      <h1 className="font-display text-3xl text-ink">Live View</h1>
      <p className="mt-1 font-body text-sm text-ink/50">
        Real-time storefront traffic. Refreshes every 10 seconds.
      </p>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-xl3 bg-white p-6 shadow-soft">
          <p className="font-body text-xs uppercase tracking-wide text-ink/40">Active right now</p>
          <div className="mt-2 flex items-center gap-2.5">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-75" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
            </span>
            <p className="font-display text-4xl text-ink">{data?.activeNow ?? "—"}</p>
          </div>
          <p className="mt-1 font-body text-xs text-ink/40">Unique visitors in the last 5 minutes</p>
        </div>

        <div className="rounded-xl3 bg-white p-6 shadow-soft">
          <p className="font-body text-xs uppercase tracking-wide text-ink/40">Visitors this minute</p>
          <p className="mt-2 font-display text-4xl text-ink">{enteredLastMinute}</p>
          <p className="mt-1 font-body text-xs text-ink/40">People who entered the site in the last 60 seconds</p>
        </div>
      </div>

      <div className="mt-4 rounded-xl3 bg-white p-6 shadow-soft">
        <p className="font-body text-xs uppercase tracking-wide text-ink/40">
          Page entries per minute (last 30 min)
        </p>
        {data ? (
          <div className="mt-4">
            <TrendChart points={data.perMinute} showLatest={false} />
          </div>
        ) : (
          <p className="mt-4 font-body text-sm text-ink/40">Loading…</p>
        )}
      </div>

      <div className="mt-4 rounded-xl3 bg-white p-6 shadow-soft">
        <p className="font-body text-xs uppercase tracking-wide text-ink/40">
          Most visited pages (last 5 min)
        </p>
        <ul className="mt-3 space-y-2">
          {data && data.topPaths.length > 0 ? (
            data.topPaths.map((p) => (
              <li key={p.path} className="flex justify-between font-body text-sm text-ink/70">
                <span className="truncate">{p.path}</span>
                <span className="text-ink/40">{p.count}</span>
              </li>
            ))
          ) : (
            <li className="font-body text-sm text-ink/40">No activity yet</li>
          )}
        </ul>
      </div>
    </div>
  );
}
