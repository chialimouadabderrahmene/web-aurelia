import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/requireAdmin";

export async function GET() {
  const auth = await requireAdmin("marketing");
  if ("error" in auth) return auth.error;

  const referred = await prisma.customer.findMany({
    where: { referredByCode: { not: null } },
    select: { id: true, name: true, phone: true, referredByCode: true, createdAt: true },
    orderBy: { createdAt: "desc" },
  });

  const referrerCodes = [...new Set(referred.map((r) => r.referredByCode!))];
  const referrers = await prisma.customer.findMany({
    where: { referralCode: { in: referrerCodes } },
    select: { referralCode: true, name: true },
  });
  const byCode = new Map(referrers.map((r) => [r.referralCode, r.name]));

  const rows = referred.map((r) => ({
    id: r.id,
    name: r.name,
    phone: r.phone,
    referrerName: byCode.get(r.referredByCode!) ?? "Unknown",
    createdAt: r.createdAt,
  }));

  return NextResponse.json({ referrals: rows });
}
