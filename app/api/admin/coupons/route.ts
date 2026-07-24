import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/requireAdmin";

export async function GET() {
  const auth = await requireAdmin("marketing");
  if ("error" in auth) return auth.error;
  const coupons = await prisma.coupon.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json({ coupons });
}

const schema = z.object({
  code: z.string().min(2).transform((s) => s.toUpperCase()),
  type: z.enum(["PERCENT", "FIXED"]),
  value: z.number().int().positive(),
  minOrderAmount: z.number().int().nonnegative().nullable().optional(),
  usageLimit: z.number().int().positive().nullable().optional(),
  expiresAt: z.string().nullable().optional(),
});

export async function POST(req: NextRequest) {
  const auth = await requireAdmin("marketing");
  if ("error" in auth) return auth.error;

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  const data = parsed.data;

  const existing = await prisma.coupon.findUnique({ where: { code: data.code } });
  if (existing) return NextResponse.json({ error: "Coupon code already exists" }, { status: 409 });

  const coupon = await prisma.coupon.create({
    data: {
      code: data.code,
      type: data.type,
      value: data.value,
      minOrderAmount: data.minOrderAmount ?? null,
      usageLimit: data.usageLimit ?? null,
      expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
    },
  });

  return NextResponse.json({ coupon }, { status: 201 });
}
