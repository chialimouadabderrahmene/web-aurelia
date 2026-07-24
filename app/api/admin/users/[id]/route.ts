import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/requireAdmin";
import { hashPassword } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

const schema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  role: z.enum(["OWNER", "CONFIRMATION_AGENT", "STOCK_MANAGER", "FINANCE_MANAGER"]).optional(),
  password: z.string().min(8).optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin("users");
  if ("error" in auth) return auth.error;

  const { id } = await params;
  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const { password, ...rest } = parsed.data;
  let user;
  try {
    user = await prisma.adminUser.update({
      where: { id },
      data: {
        ...rest,
        ...(password ? { passwordHash: await hashPassword(password) } : {}),
      },
      select: { id: true, name: true, email: true, role: true },
    });
  } catch {
    return NextResponse.json({ error: "Email already in use" }, { status: 409 });
  }

  await logAudit({
    actorId: auth.session.sub,
    actorName: auth.session.name,
    action: "USER_UPDATE",
    entityType: "AdminUser",
    entityId: user.id,
    summary: `Updated staff account "${user.name}"${password ? " (password reset)" : ""}${rest.role ? ` — role now ${rest.role}` : ""}`,
  });

  return NextResponse.json({ user });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin("users");
  if ("error" in auth) return auth.error;

  const { id } = await params;
  if (auth.session.sub === id) {
    return NextResponse.json({ error: "Cannot delete your own account" }, { status: 400 });
  }

  const deleted = await prisma.adminUser.delete({ where: { id } });

  await logAudit({
    actorId: auth.session.sub,
    actorName: auth.session.name,
    action: "USER_DELETE",
    entityType: "AdminUser",
    entityId: id,
    summary: `Deleted staff account "${deleted.name}" (${deleted.email})`,
  });

  return NextResponse.json({ ok: true });
}
