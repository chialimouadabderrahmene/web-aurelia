import { Resend } from "resend";
import { prisma } from "@/lib/prisma";

let client: Resend | null = null;
function getClient() {
  if (!client) client = new Resend(process.env.RESEND_API_KEY);
  return client;
}

const FROM = "AURELIA <orders@neao.online>";

async function sendEmail(to: string[], subject: string, html: string) {
  if (to.length === 0) return;
  try {
    const result = await getClient().emails.send({ from: FROM, to, subject, html });
    if (result.error) {
      console.error("Resend send error:", result.error);
    }
  } catch (err) {
    console.error("Resend send exception:", err);
  }
}

export async function emailRoles(roles: string[], subject: string, html: string) {
  const users = await prisma.adminUser.findMany({ where: { role: { in: roles as never } }, select: { email: true } });
  await sendEmail(users.map((u) => u.email), subject, html);
}

export async function emailUserIds(userIds: string[], subject: string, html: string) {
  if (userIds.length === 0) return;
  const users = await prisma.adminUser.findMany({ where: { id: { in: userIds } }, select: { email: true } });
  await sendEmail(users.map((u) => u.email), subject, html);
}
