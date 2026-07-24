import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const orderNumber = req.nextUrl.searchParams.get("order");
  const phone = req.nextUrl.searchParams.get("phone");

  if (!orderNumber && !phone) {
    return NextResponse.json({ error: "Missing order number or phone" }, { status: 400 });
  }

  if (phone) {
    const orders = await prisma.order.findMany({
      where: { phone },
      select: {
        orderNumber: true,
        status: true,
        totalAmount: true,
        discountAmount: true,
        giftCardAmount: true,
        deliveryPrice: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    if (orders.length === 0) {
      return NextResponse.json({ error: "No orders found for this phone number" }, { status: 404 });
    }

    return NextResponse.json({
      orders: orders.map((o) => ({
        orderNumber: o.orderNumber,
        status: o.status,
        createdAt: o.createdAt,
        amountDue: o.totalAmount - o.discountAmount - o.giftCardAmount + o.deliveryPrice,
      })),
    });
  }

  const order = await prisma.order.findUnique({
    where: { orderNumber: orderNumber! },
    select: {
      orderNumber: true,
      status: true,
      createdAt: true,
      confirmedAt: true,
      events: {
        orderBy: { createdAt: "asc" },
        select: { status: true, note: true, createdAt: true },
      },
    },
  });

  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  return NextResponse.json({ order });
}
