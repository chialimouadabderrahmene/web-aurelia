import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const content = await prisma.siteContent.upsert({
    where: { id: "singleton" },
    update: {},
    create: { id: "singleton" },
  });

  return NextResponse.json({ content });
}
