import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/requireAdmin";

const WINDOW_MINUTES = 30;
const ACTIVE_MINUTES = 5;

export async function GET() {
  const auth = await requireAdmin("live");
  if ("error" in auth) return auth.error;

  const now = new Date();
  const windowStart = new Date(now.getTime() - WINDOW_MINUTES * 60_000);
  const activeStart = new Date(now.getTime() - ACTIVE_MINUTES * 60_000);

  const [views, activeSessions, topPaths] = await Promise.all([
    prisma.pageView.findMany({
      where: { createdAt: { gte: windowStart } },
      select: { sessionId: true, createdAt: true },
      orderBy: { createdAt: "asc" },
    }),
    prisma.pageView.findMany({
      where: { createdAt: { gte: activeStart } },
      select: { sessionId: true },
      distinct: ["sessionId"],
    }),
    prisma.pageView.groupBy({
      by: ["path"],
      where: { createdAt: { gte: activeStart } },
      _count: { path: true },
      orderBy: { _count: { path: "desc" } },
      take: 5,
    }),
  ]);

  const buckets = new Map<string, { count: number; sessions: Set<string> }>();
  for (let i = WINDOW_MINUTES - 1; i >= 0; i--) {
    const bucketTime = new Date(now.getTime() - i * 60_000);
    const key = bucketTime.toISOString().slice(11, 16);
    buckets.set(key, { count: 0, sessions: new Set() });
  }
  for (const v of views) {
    const key = v.createdAt.toISOString().slice(11, 16);
    const bucket = buckets.get(key);
    if (bucket) {
      bucket.count += 1;
      bucket.sessions.add(v.sessionId);
    }
  }

  const perMinute = Array.from(buckets.entries()).map(([label, b]) => ({
    label,
    value: b.count,
    visitors: b.sessions.size,
  }));

  return NextResponse.json({
    activeNow: activeSessions.length,
    perMinute,
    topPaths: topPaths.map((p) => ({ path: p.path, count: p._count.path })),
  });
}
