import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/requireAdmin";

const schema = z.object({
  endpoint: z.string().url(),
  keys: z.object({ p256dh: z.string(), auth: z.string() }),
});

export async function POST(req: NextRequest) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  await prisma.pushSubscription.upsert({
    where: { endpoint: parsed.data.endpoint },
    update: { adminUserId: auth.session.sub, p256dh: parsed.data.keys.p256dh, auth: parsed.data.keys.auth },
    create: {
      adminUserId: auth.session.sub,
      endpoint: parsed.data.endpoint,
      p256dh: parsed.data.keys.p256dh,
      auth: parsed.data.keys.auth,
    },
  });

  return NextResponse.json({ ok: true });
}

const unsubSchema = z.object({ endpoint: z.string().url() });

export async function DELETE(req: NextRequest) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;

  const parsed = unsubSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  await prisma.pushSubscription.deleteMany({ where: { endpoint: parsed.data.endpoint, adminUserId: auth.session.sub } });

  return NextResponse.json({ ok: true });
}
