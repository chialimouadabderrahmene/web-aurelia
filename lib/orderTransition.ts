import { after } from "next/server";
import { prisma } from "@/lib/prisma";
import { revalidateProductPages } from "@/lib/revalidate";
import { createEcotrackParcel, deleteEcotrackParcel } from "@/lib/ecotrack";
import { logStockMovement } from "@/lib/stockMovement";
import { pushToUserIds, pushToRoles } from "@/lib/webpush";
import { emailUserIds, emailRoles } from "@/lib/email";

export const TERMINAL = new Set(["DELIVERED", "CANCELLED"]);
export const STOCK_COMMITTED = new Set(["CONFIRMED", "POSTPONED", "DELIVERED"]);

export const VALID_TRANSITIONS: Record<string, string[]> = {
  PENDING: ["TENTATIVE", "CONFIRMED", "CANCELLED"],
  TENTATIVE: ["CONFIRMED", "POSTPONED", "CANCELLED"],
  CONFIRMED: ["DELIVERED", "POSTPONED", "CANCELLED"],
  POSTPONED: ["CONFIRMED", "DELIVERED", "CANCELLED"],
  DELIVERED: [],
  CANCELLED: [],
};

type TransitionResult =
  | { ok: true; order: NonNullable<Awaited<ReturnType<typeof prisma.order.findUnique>>> }
  | { ok: false; error: string; statusCode: number };

export async function applyOrderStatusChange(
  orderId: string,
  nextStatus: string,
  opts: { note?: string | null; actorName: string; actorUserId?: string }
): Promise<TransitionResult> {
  const order = await prisma.order.findUnique({ where: { id: orderId }, include: { items: true } });
  if (!order) return { ok: false, error: "Not found", statusCode: 404 };
  if (TERMINAL.has(order.status)) {
    return { ok: false, error: "Order already finalized", statusCode: 409 };
  }
  if (!VALID_TRANSITIONS[order.status]?.includes(nextStatus)) {
    return {
      ok: false,
      error: `Cannot move order from ${order.status} to ${nextStatus}`,
      statusCode: 409,
    };
  }

  const wasCommitted = STOCK_COMMITTED.has(order.status);
  const willBeCommitted = STOCK_COMMITTED.has(nextStatus);

  const stockOps = [];
  const stockMovements: { productId: string; qtyChange: number; type: "SALE" | "RETURN" }[] = [];
  if (!wasCommitted && willBeCommitted) {
    for (const item of order.items.filter((i) => i.productId)) {
      stockOps.push(
        prisma.product.update({
          where: { id: item.productId! },
          data: { stockQty: { decrement: item.qty } },
        })
      );
      stockMovements.push({ productId: item.productId!, qtyChange: -item.qty, type: "SALE" });
    }
  } else if (wasCommitted && nextStatus === "CANCELLED") {
    for (const item of order.items.filter((i) => i.productId)) {
      stockOps.push(
        prisma.product.update({
          where: { id: item.productId! },
          data: { stockQty: { increment: item.qty } },
        })
      );
      stockMovements.push({ productId: item.productId!, qtyChange: item.qty, type: "RETURN" });
    }
  }

  const earnsCommission = (nextStatus === "CONFIRMED" || nextStatus === "DELIVERED") && !order.commissionCredited;
  const revokesCommission = nextStatus === "CANCELLED" && order.commissionCredited;

  await prisma.$transaction([
    prisma.order.update({
      where: { id: orderId },
      data: {
        status: nextStatus as never,
        statusNote: opts.note ?? order.statusNote,
        isRead: true,
        confirmedAt: nextStatus === "CONFIRMED" && !order.confirmedAt ? new Date() : order.confirmedAt,
        ...(earnsCommission
          ? { commissionCredited: true, confirmedByUserId: opts.actorUserId ?? null }
          : {}),
        ...(revokesCommission ? { commissionCredited: false, confirmedByUserId: null } : {}),
      },
    }),
    prisma.orderEvent.create({
      data: {
        orderId,
        status: nextStatus as never,
        note: opts.note ?? null,
        actorName: opts.actorName,
      },
    }),
    ...stockOps,
  ]);

  await prisma.customerEvent.create({
    data: {
      customerId: order.customerId,
      type: "ORDER_STATUS_CHANGED",
      message: `Order #${order.orderNumber} moved from ${order.status} to ${nextStatus}${opts.note ? ` — ${opts.note}` : ""}`,
    },
  });

  if (nextStatus === "DELIVERED" || nextStatus === "CANCELLED") {
    const label = nextStatus === "DELIVERED" ? "Order delivered" : "Order cancelled";
    const agentIds = order.confirmedByUserId ? [order.confirmedByUserId] : [];
    after(async () => {
      await pushToUserIds(agentIds, {
        title: label,
        body: `#${order.orderNumber} — ${order.customerName}`,
        url: `/admin/orders/${orderId}`,
      }).catch(() => {});
      await pushToRoles(["OWNER"], {
        title: label,
        body: `#${order.orderNumber} — ${order.customerName}`,
        url: `/admin/orders/${orderId}`,
      }).catch(() => {});

      const emailBody = `<p>${label} on AURELIA.</p>
        <p><strong>Order:</strong> #${order.orderNumber}<br/>
        <strong>Customer:</strong> ${order.customerName}${opts.note ? `<br/><strong>Note:</strong> ${opts.note}` : ""}</p>
        <p><a href="https://aurelia-amber.vercel.app/admin/orders/${orderId}">View order in admin panel</a></p>`;
      await emailUserIds(agentIds, `${label} — #${order.orderNumber}`, emailBody).catch(() => {});
      await emailRoles(["OWNER"], `${label} — #${order.orderNumber}`, emailBody).catch(() => {});
    });
  }

  if (stockMovements.length > 0) {
    for (const m of stockMovements) {
      await logStockMovement({
        productId: m.productId,
        type: m.type,
        qtyChange: m.qtyChange,
        reason: `Order #${order.orderNumber} → ${nextStatus}`,
        relatedOrderId: orderId,
        actorName: opts.actorName,
      });
    }
    revalidateProductPages();
  }

  // --- EcoTrack: auto-create parcel on first confirmation ---
  const isFirstConfirmation = nextStatus === "CONFIRMED" && !order.confirmedAt;
  if (isFirstConfirmation) {
    const result = await createEcotrackParcel({ ...order, statusNote: opts.note ?? order.statusNote });
    await prisma.order.update({
      where: { id: orderId },
      data: result.ok
        ? { ecotrackTrackingId: result.trackingId, ecotrackStatus: "created", ecotrackError: null }
        : { ecotrackError: result.error },
    });
    if (result.ok) {
      await prisma.orderEvent.create({
        data: {
          orderId,
          status: "CONFIRMED",
          note: `EcoTrack parcel created — tracking ${result.trackingId}`,
          actorName: "EcoTrack",
        },
      });
    }
  }

  // --- EcoTrack: cancel the parcel if it was never shipped ---
  if (nextStatus === "CANCELLED" && order.ecotrackTrackingId && order.ecotrackStatus === "created") {
    const result = await deleteEcotrackParcel(order.ecotrackTrackingId);
    await prisma.order.update({
      where: { id: orderId },
      data: result.ok ? { ecotrackStatus: "deleted" } : { ecotrackError: result.error },
    });
  }

  // --- Cash balance: credit once when delivered ---
  if (nextStatus === "DELIVERED" && !order.balanceCredited) {
    const amountDue = order.totalAmount - order.discountAmount - order.giftCardAmount + order.deliveryPrice;
    await prisma.$transaction([
      prisma.order.update({ where: { id: orderId }, data: { balanceCredited: true } }),
      prisma.settings.upsert({
        where: { id: "singleton" },
        update: { cashBalance: { increment: amountDue } },
        create: { id: "singleton", cashBalance: amountDue },
      }),
    ]);
  }

  const updated = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true, events: { orderBy: { createdAt: "asc" } } },
  });

  return { ok: true, order: updated! };
}
