import webpush from "web-push";
import { prisma } from "@/lib/prisma";

let configured = false;
function ensureConfigured() {
  if (configured) return;
  webpush.setVapidDetails(
    "mailto:hello@aurelia.dz",
    process.env.VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!
  );
  configured = true;
}

type PushPayload = { title: string; body: string; url?: string };

async function sendToSubscription(sub: { id: string; endpoint: string; p256dh: string; auth: string }, payload: PushPayload) {
  ensureConfigured();
  try {
    await webpush.sendNotification(
      { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
      JSON.stringify(payload)
    );
  } catch (err: unknown) {
    const statusCode = (err as { statusCode?: number })?.statusCode;
    if (statusCode === 404 || statusCode === 410) {
      await prisma.pushSubscription.delete({ where: { id: sub.id } }).catch(() => null);
    }
  }
}

export async function pushToUserIds(userIds: string[], payload: PushPayload) {
  if (userIds.length === 0) return;
  const subs = await prisma.pushSubscription.findMany({ where: { adminUserId: { in: userIds } } });
  await Promise.all(subs.map((s) => sendToSubscription(s, payload)));
}

export async function pushToRoles(roles: string[], payload: PushPayload) {
  const users = await prisma.adminUser.findMany({ where: { role: { in: roles as never } }, select: { id: true } });
  await pushToUserIds(users.map((u) => u.id), payload);
}
