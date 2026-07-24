import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/requireAdmin";
import { logAudit } from "@/lib/audit";
import { revalidateContentPages } from "@/lib/revalidate";

export async function GET() {
  const auth = await requireAdmin("content");
  if ("error" in auth) return auth.error;

  const content = await prisma.siteContent.upsert({
    where: { id: "singleton" },
    update: {},
    create: { id: "singleton" },
  });

  return NextResponse.json({ content });
}

const schema = z.object({
  orderConfirmTitleEn: z.string().min(1).optional(),
  orderConfirmTitleAr: z.string().min(1).optional(),
  orderConfirmBodyEn: z.string().min(1).optional(),
  orderConfirmBodyAr: z.string().min(1).optional(),
  aboutEyebrowEn: z.string().min(1).optional(),
  aboutEyebrowAr: z.string().min(1).optional(),
  aboutTitleEn: z.string().min(1).optional(),
  aboutTitleAr: z.string().min(1).optional(),
  aboutP1En: z.string().optional(),
  aboutP1Ar: z.string().optional(),
  aboutP2En: z.string().optional(),
  aboutP2Ar: z.string().optional(),
  aboutP3En: z.string().optional(),
  aboutP3Ar: z.string().optional(),
  aboutStatCustomers: z.string().optional(),
  aboutStatWilayas: z.string().optional(),
  aboutStatRating: z.string().optional(),
  heroVideoUrl: z.string().url().optional(),
  buyNowTitleEn: z.string().min(1).optional(),
  buyNowTitleAr: z.string().min(1).optional(),
  buyNowSubtitleEn: z.string().min(1).optional(),
  buyNowSubtitleAr: z.string().min(1).optional(),
  trustDeliveryEn: z.string().min(1).optional(),
  trustDeliveryAr: z.string().min(1).optional(),
  trustCodEn: z.string().min(1).optional(),
  trustCodAr: z.string().min(1).optional(),
  trustReturnsEn: z.string().min(1).optional(),
  trustReturnsAr: z.string().min(1).optional(),
});

export async function PATCH(req: NextRequest) {
  const auth = await requireAdmin("content");
  if ("error" in auth) return auth.error;

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const content = await prisma.siteContent.upsert({
    where: { id: "singleton" },
    update: parsed.data,
    create: { id: "singleton", ...parsed.data },
  });

  await logAudit({
    actorId: auth.session.sub,
    actorName: auth.session.name,
    action: "SITE_CONTENT_UPDATE",
    entityType: "SiteContent",
    summary: "Updated site content (about page / order confirmation message)",
  });

  revalidateContentPages();

  return NextResponse.json({ content });
}
