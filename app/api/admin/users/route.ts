import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/requireAdmin";
import { hashPassword } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

export async function GET() {
  const auth = await requireAdmin("users");
  if ("error" in auth) return auth.error;

  const users = await prisma.adminUser.findMany({
    select: { id: true, name: true, email: true, role: true, createdAt: true, lastLoginAt: true },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json({ users });
}

const schema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(["OWNER", "CONFIRMATION_AGENT", "STOCK_MANAGER", "FINANCE_MANAGER"]),
});

export async function POST(req: NextRequest) {
  const auth = await requireAdmin("users");
  if ("error" in auth) return auth.error;

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const { name, email, password, role } = parsed.data;
  const existing = await prisma.adminUser.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: "Email already in use" }, { status: 409 });
  }

  const user = await prisma.adminUser.create({
    data: { name, email, role, passwordHash: await hashPassword(password) },
    select: { id: true, name: true, email: true, role: true, createdAt: true },
  });

  await logAudit({
    actorId: auth.session.sub,
    actorName: auth.session.name,
    action: "USER_CREATE",
    entityType: "AdminUser",
    entityId: user.id,
    summary: `Created staff account "${user.name}" (${user.email}) — role ${user.role}`,
  });

  return NextResponse.json({ user }, { status: 201 });
}
