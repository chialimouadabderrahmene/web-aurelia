import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/requireAdmin";

export async function GET(req: NextRequest) {
  const auth = await requireAdmin("audit");
  if ("error" in auth) return auth.error;

  const entityType = req.nextUrl.searchParams.get("entityType");

  const logs = await prisma.auditLog.findMany({
    where: entityType ? { entityType } : undefined,
    orderBy: { createdAt: "desc" },
    take: 300,
  });

  return NextResponse.json({ logs });
}
