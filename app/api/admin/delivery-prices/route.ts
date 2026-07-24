import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/requireAdmin";

export async function GET() {
  const auth = await requireAdmin("finance");
  if ("error" in auth) return auth.error;

  const prices = await prisma.deliveryPrice.findMany({ orderBy: { wilayaCode: "asc" } });
  return NextResponse.json({ prices });
}

const schema = z.object({
  updates: z.array(z.object({ wilayaCode: z.string(), price: z.number().int().nonnegative() })),
});

export async function PATCH(req: NextRequest) {
  const auth = await requireAdmin("finance");
  if ("error" in auth) return auth.error;

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  await prisma.$transaction(
    parsed.data.updates.map((u) =>
      prisma.deliveryPrice.update({ where: { wilayaCode: u.wilayaCode }, data: { price: u.price } })
    )
  );

  return NextResponse.json({ ok: true });
}
