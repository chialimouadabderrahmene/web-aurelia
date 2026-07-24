import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/requireAdmin";
import { logAudit } from "@/lib/audit";

export async function GET() {
  const auth = await requireAdmin("integrations");
  if ("error" in auth) return auth.error;

  const settings = await prisma.settings.upsert({
    where: { id: "singleton" },
    update: {},
    create: { id: "singleton" },
  });

  return NextResponse.json({ settings });
}

const schema = z.object({
  ecotrackBaseUrl: z
    .string()
    .nullable()
    .optional()
    .transform((v) => (v && v.trim() ? v.trim().replace(/\/$/, "") : null)),
  ecotrackApiToken: z
    .string()
    .nullable()
    .optional()
    .transform((v) => (v && v.trim() ? v.trim() : null)),
  ecotrackEnabled: z.boolean().optional(),
  regenerateSecret: z.boolean().optional(),
});

function generateSecret() {
  return Array.from({ length: 24 }, () => Math.random().toString(36)[2] ?? "0").join("");
}

export async function PATCH(req: NextRequest) {
  const auth = await requireAdmin("integrations");
  if ("error" in auth) return auth.error;

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  const { regenerateSecret, ...rest } = parsed.data;

  const settings = await prisma.settings.upsert({
    where: { id: "singleton" },
    update: {
      ...rest,
      ...(regenerateSecret ? { ecotrackWebhookSecret: generateSecret() } : {}),
    },
    create: {
      id: "singleton",
      ...rest,
      ...(regenerateSecret ? { ecotrackWebhookSecret: generateSecret() } : {}),
    },
  });

  await logAudit({
    actorId: auth.session.sub,
    actorName: auth.session.name,
    action: "SETTINGS_UPDATE",
    entityType: "Settings",
    summary: "Updated EcoTrack integration settings",
  });

  return NextResponse.json({ settings });
}
