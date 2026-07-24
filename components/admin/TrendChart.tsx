"use client";

import { formatDzd } from "@/lib/utils";

type Point = { label: string; value: number };

export default function TrendChart({
  points,
  color = "#B8935F",
  height = 160,
  showLatest = true,
}: {
  points: Point[];
  color?: string;
  height?: number;
  showLatest?: boolean;
}) {
  const width = 600;
  const padY = 16;
  const max = Math.max(1, ...points.map((p) => p.value));
  const min = Math.min(0, ...points.map((p) => p.value));
  const span = max - min || 1;

  const stepX = points.length > 1 ? width / (points.length - 1) : 0;
  const coords = points.map((p, i) => {
    const x = points.length > 1 ? i * stepX : width / 2;
    const y = height - padY - ((p.value - min) / span) * (height - padY * 2);
    return [x, y] as const;
  });

  const linePath = coords.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x},${y}`).join(" ");
  const areaPath =
    coords.length > 0
      ? `${linePath} L${coords[coords.length - 1][0]},${height} L${coords[0][0]},${height} Z`
      : "";

  const last = points[points.length - 1];

  return (
    <div>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full" preserveAspectRatio="none">
        <defs>
          <linearGradient id="trend-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.25" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        {areaPath && <path d={areaPath} fill="url(#trend-fill)" />}
        {linePath && (
          <path d={linePath} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        )}
        {coords.map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r={i === coords.length - 1 ? 4 : 0} fill={color} />
        ))}
      </svg>
      <div className="mt-2 flex justify-between font-body text-[10px] text-ink/40">
        <span>{points[0]?.label}</span>
        {last && <span>{last.label}</span>}
      </div>
      {last && showLatest && (
        <p className="mt-1 font-body text-xs text-ink/50">
          Latest: <span className="text-ink">{formatDzd(last.value)}</span>
        </p>
      )}
    </div>
  );
}
