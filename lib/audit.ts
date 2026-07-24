import { prisma } from "@/lib/prisma";

export async function logAudit(params: {
  actorId?: string | null;
  actorName: string;
  action: string;
  entityType: string;
  entityId?: string | null;
  summary: string;
}) {
  await prisma.auditLog.create({
    data: {
      actorId: params.actorId ?? null,
      actorName: params.actorName,
      action: params.action,
      entityType: params.entityType,
      entityId: params.entityId ?? null,
      summary: params.summary,
    },
  });
}
