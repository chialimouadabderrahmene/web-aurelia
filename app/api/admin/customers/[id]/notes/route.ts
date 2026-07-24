import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/requireAdmin";

const schema = z.object({ body: z.string().min(1) });

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin("customers");
  if ("error" in auth) return auth.error;

  const { id } = await params;
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const note = await prisma.customerNote.create({
    data: { customerId: id, body: parsed.data.body, authorId: auth.session.sub },
    include: { author: { select: { name: true } } },
  });

  await prisma.customerEvent.create({
    data: { customerId: id, type: "NOTE_ADDED", message: `${auth.session.name} added a note` },
  });

  return NextResponse.json({ note }, { status: 201 });
}
