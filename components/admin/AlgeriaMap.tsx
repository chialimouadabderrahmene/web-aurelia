"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import geo from "@/lib/geo/algeria-wilayas.json";
import { formatDzd } from "@/lib/utils";

type WilayaGeo = { code: string; nameEn: string; nameAr: string; path: string; centroid: number[] };
const data = geo as unknown as { viewBox: string; wilayas: WilayaGeo[] };

function lerp(a: number, b: number, t: number) {
  return Math.round(a + (b - a) * t);
}

function colorFor(t: number) {
  // sand (#F3EEE6) -> gold (#B8935F) -> ink (#111111)
  const stops: [number, number, number][] = [
    [243, 238, 230],
    [184, 147, 95],
    [58, 44, 27],
  ];
  const scaled = Math.min(1, Math.max(0, t)) * (stops.length - 1);
  const i = Math.min(stops.length - 2, Math.floor(scaled));
  const localT = scaled - i;
  const [r1, g1, b1] = stops[i];
  const [r2, g2, b2] = stops[i + 1];
  return `rgb(${lerp(r1, r2, localT)}, ${lerp(g1, g2, localT)}, ${lerp(b1, b2, localT)})`;
}

export default function AlgeriaMap({
  values,
  unit = "orders",
}: {
  values: Record<string, number>;
  unit?: "orders" | "DA";
}) {
  const [hovered, setHovered] = useState<string | null>(null);

  const max = useMemo(() => Math.max(1, ...Object.values(values)), [values]);

  const hoveredWilaya = data.wilayas.find((w) => w.code === hovered);
  const hoveredValue = hovered ? values[hovered] ?? 0 : 0;

  return (
    <div className="relative">
      <svg viewBox={data.viewBox} className="w-full" style={{ maxHeight: 520 }}>
        {data.wilayas.map((w) => {
          const value = values[w.code] ?? 0;
          const intensity = value / max;
          const isHovered = hovered === w.code;
          return (
            <motion.path
              key={w.code}
              d={w.path}
              fill={colorFor(intensity)}
              stroke="#FFFFFF"
              strokeWidth={isHovered ? 1.5 : 0.75}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1, scale: isHovered ? 1.015 : 1 }}
              style={{ transformOrigin: `${w.centroid[0]}px ${w.centroid[1]}px`, cursor: "pointer" }}
              transition={{ duration: 0.4 }}
              onMouseEnter={() => setHovered(w.code)}
              onMouseLeave={() => setHovered((h) => (h === w.code ? null : h))}
            />
          );
        })}
      </svg>

      {hoveredWilaya && (
        <div className="pointer-events-none absolute left-3 top-3 rounded-xl2 bg-ink px-4 py-2.5 text-white shadow-lift">
          <p className="font-body text-sm font-medium">{hoveredWilaya.nameEn}</p>
          <p className="font-body text-xs text-white/70">
            {unit === "DA" ? formatDzd(hoveredValue) : `${hoveredValue} orders`}
          </p>
        </div>
      )}

      <div className="mt-4 flex items-center gap-2 font-body text-xs text-ink/50">
        <span>Low</span>
        <div className="h-2 flex-1 rounded-full" style={{ background: `linear-gradient(90deg, ${colorFor(0)}, ${colorFor(0.5)}, ${colorFor(1)})` }} />
        <span>High</span>
      </div>
    </div>
  );
}
