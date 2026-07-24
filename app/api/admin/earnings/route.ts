import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/requireAdmin";
import { canAccess } from "@/lib/auth";

export async function GET() {
  const auth = await requireAdmin("earnings");
  if ("error" in auth) return auth.error;

  const settings = await prisma.settings.upsert({
    where: { id: "singleton" },
    update: {},
    create: { id: "singleton" },
  });
  const rate = settings.confirmationCommission;

  const seesAll = canAccess(auth.session.role, "finance") || auth.session.role === "OWNER";

  const orders = await prisma.order.findMany({
    where: {
      commissionCredited: true,
      confirmedByUserId: seesAll ? { not: null } : auth.session.sub,
    },
    select: {
      id: true,
      orderNumber: true,
      status: true,
      confirmedAt: true,
      confirmedByUserId: true,
      confirmedByUser: { select: { id: true, name: true } },
    },
    orderBy: { confirmedAt: "desc" },
  });

  const byAgent = new Map<string, { agentId: string; agentName: string; orders: typeof orders }>();
  for (const o of orders) {
    if (!o.confirmedByUserId || !o.confirmedByUser) continue;
    const key = o.confirmedByUserId;
    if (!byAgent.has(key)) byAgent.set(key, { agentId: key, agentName: o.confirmedByUser.name, orders: [] });
    byAgent.get(key)!.orders.push(o);
  }

  const agents = [...byAgent.values()].map((a) => ({
    agentId: a.agentId,
    agentName: a.agentName,
    orderCount: a.orders.length,
    totalEarned: a.orders.length * rate,
    orders: a.orders.map((o) => ({
      id: o.id,
      orderNumber: o.orderNumber,
      status: o.status,
      confirmedAt: o.confirmedAt,
    })),
  }));

  agents.sort((a, b) => b.totalEarned - a.totalEarned);

  return NextResponse.json({ commissionPerOrder: rate, agents });
}
