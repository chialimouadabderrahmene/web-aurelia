import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const prices = await prisma.deliveryPrice.findMany({
    select: { wilayaCode: true, wilayaName: true, homePrice: true, stopdeskPrice: true },
    orderBy: { wilayaCode: "asc" },
  });
  return NextResponse.json({ prices });
}
