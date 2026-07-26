import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  sessionId: z.string().min(1),
  path: z.string().min(1).max(500),
});

export async function POST(req: NextRequest) {
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  await prisma.pageView.create({
    data: { sessionId: parsed.data.sessionId, path: parsed.data.path },
  });

  return NextResponse.json({ ok: true });
}
