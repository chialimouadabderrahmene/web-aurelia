import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  sessionId: z.string().min(1),
  phone: z.string().optional(),
  name: z.string().optional(),
  items: z.array(z.object({ name: z.string(), qty: z.number(), price: z.number() })),
  totalAmount: z.number().int().nonnegative(),
});

export async function POST(req: NextRequest) {
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  const data = parsed.data;

  if (data.items.length === 0) {
    return NextResponse.json({ ok: true });
  }

  await prisma.abandonedCart.upsert({
    where: { sessionId: data.sessionId },
    update: {
      phone: data.phone || undefined,
      name: data.name || undefined,
      itemsJson: JSON.stringify(data.items),
      totalAmount: data.totalAmount,
    },
    create: {
      sessionId: data.sessionId,
      phone: data.phone,
      name: data.name,
      itemsJson: JSON.stringify(data.items),
      totalAmount: data.totalAmount,
    },
  });

  return NextResponse.json({ ok: true });
}
