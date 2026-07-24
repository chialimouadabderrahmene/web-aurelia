import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/requireAdmin";

export async function GET() {
  const auth = await requireAdmin("finance");
  if ("error" in auth) return auth.error;

  const settings = await prisma.settings.upsert({
    where: { id: "singleton" },
    update: {},
    create: { id: "singleton" },
    select: { confirmationCommission: true, cashBalance: true },
  });

  return NextResponse.json({ settings });
}

const schema = z.object({ confirmationCommission: z.number().int().nonnegative() });

export async function PATCH(req: NextRequest) {
  const auth = await requireAdmin("finance");
  if ("error" in auth) return auth.error;

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const settings = await prisma.settings.upsert({
    where: { id: "singleton" },
    update: parsed.data,
    create: { id: "singleton", ...parsed.data },
    select: { confirmationCommission: true, cashBalance: true },
  });

  return NextResponse.json({ settings });
}
