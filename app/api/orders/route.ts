import { NextRequest, NextResponse } from "next/server";
import { after } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { WILAYA_BY_NAME } from "@/lib/geo/wilayas-list";
import { pushToRoles } from "@/lib/webpush";
import { emailRoles } from "@/lib/email";
import { sendPurchaseEvent } from "@/lib/meta";
import { SITE_URL } from "@/lib/utils";

const schema = z.object({
  customerName: z.string().min(2),
  phone: z.string().min(8),
  wilaya: z.string().min(1),
  commune: z.string().min(1),
  address: z.string().min(3),
  couponCode: z.string().optional(),
  giftCardCode: z.string().optional(),
  referralCode: z.string().optional(),
  affiliateCode: z.string().optional(),
  sessionId: z.string().optional(),
  deliveryType: z.enum(["HOME", "STOPDESK"]).default("HOME"),
  items: z
    .array(
      z.object({
        slug: z.string(),
        name: z.string(),
        color: z.string(),
        colorHex: z.string(),
        price: z.number().int().positive(),
        qty: z.number().int().positive(),
      })
    )
    .min(1),
});

function generateOrderNumber() {
  return `AUR-${Math.floor(100000 + Math.random() * 900000)}`;
}

function generateReferralCode() {
  return `REF-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid order data" }, { status: 400 });
  }
  const data = parsed.data;

  const slugs = data.items.map((i) => i.slug);
  const dbProducts = await prisma.product.findMany({ where: { slug: { in: slugs } } });
  const bySlug = new Map(dbProducts.map((p) => [p.slug, p]));

  let totalAmount = 0;
  let totalCost = 0;
  const itemsData = data.items.map((item) => {
    const dbProduct = bySlug.get(item.slug);
    const cost = dbProduct?.costPrice ?? 0;
    totalAmount += item.price * item.qty;
    totalCost += cost * item.qty;
    return {
      productId: dbProduct?.id,
      nameEn: dbProduct?.nameEn ?? item.name,
      nameAr: dbProduct?.nameAr ?? item.name,
      color: item.color,
      colorHex: item.colorHex,
      price: item.price,
      costPrice: cost,
      qty: item.qty,
    };
  });

  // --- Delivery price ---
  let deliveryPrice = 0;
  const wilayaInfo = WILAYA_BY_NAME[data.wilaya];
  if (wilayaInfo) {
    const dp = await prisma.deliveryPrice.findUnique({ where: { wilayaCode: wilayaInfo.code } });
    deliveryPrice = (data.deliveryType === "STOPDESK" ? dp?.stopdeskPrice : dp?.homePrice) ?? 0;
  }

  // --- Coupon ---
  let discountAmount = 0;
  let couponCode: string | null = null;
  if (data.couponCode) {
    const coupon = await prisma.coupon.findUnique({ where: { code: data.couponCode } });
    const now = new Date();
    const valid =
      coupon &&
      coupon.isActive &&
      (!coupon.startsAt || coupon.startsAt <= now) &&
      (!coupon.expiresAt || coupon.expiresAt >= now) &&
      (!coupon.usageLimit || coupon.usedCount < coupon.usageLimit) &&
      (!coupon.minOrderAmount || totalAmount >= coupon.minOrderAmount);
    if (!valid) {
      return NextResponse.json({ error: "Invalid or expired coupon" }, { status: 400 });
    }
    discountAmount =
      coupon!.type === "PERCENT"
        ? Math.round((totalAmount * coupon!.value) / 100)
        : coupon!.value;
    discountAmount = Math.min(discountAmount, totalAmount);
    couponCode = coupon!.code;
    await prisma.coupon.update({
      where: { id: coupon!.id },
      data: { usedCount: { increment: 1 } },
    });
  }

  // --- Gift card ---
  let giftCardAmount = 0;
  let giftCardCode: string | null = null;
  if (data.giftCardCode) {
    const giftCard = await prisma.giftCard.findUnique({ where: { code: data.giftCardCode } });
    const now = new Date();
    const valid =
      giftCard && giftCard.isActive && giftCard.balance > 0 && (!giftCard.expiresAt || giftCard.expiresAt >= now);
    if (!valid) {
      return NextResponse.json({ error: "Invalid or empty gift card" }, { status: 400 });
    }
    const remaining = Math.max(0, totalAmount - discountAmount);
    giftCardAmount = Math.min(giftCard!.balance, remaining);
    giftCardCode = giftCard!.code;
    await prisma.giftCard.update({
      where: { id: giftCard!.id },
      data: { balance: { decrement: giftCardAmount } },
    });
  }

  // --- Affiliate ---
  let affiliateCode: string | null = null;
  if (data.affiliateCode) {
    const affiliate = await prisma.affiliate.findUnique({ where: { code: data.affiliateCode } });
    if (affiliate && affiliate.isActive) {
      affiliateCode = affiliate.code;
      const commission = Math.round((totalAmount * affiliate.commissionRate) / 100);
      await prisma.affiliate.update({
        where: { id: affiliate.id },
        data: { totalEarned: { increment: commission } },
      });
    }
  }

  // --- Customer upsert + linking ---
  let customer = await prisma.customer.findUnique({ where: { phone: data.phone } });
  if (!customer) {
    let referredByCode: string | null = null;
    if (data.referralCode) {
      const referrer = await prisma.customer.findUnique({ where: { referralCode: data.referralCode } });
      if (referrer) referredByCode = referrer.referralCode;
    }
    customer = await prisma.customer.create({
      data: {
        phone: data.phone,
        name: data.customerName,
        wilaya: data.wilaya,
        commune: data.commune,
        address: data.address,
        referralCode: generateReferralCode(),
        referredByCode,
      },
    });
    await prisma.customerEvent.create({
      data: {
        customerId: customer.id,
        type: "CUSTOMER_CREATED",
        message: "First order — customer profile created.",
      },
    });
  } else {
    customer = await prisma.customer.update({
      where: { id: customer.id },
      data: { name: data.customerName, wilaya: data.wilaya, commune: data.commune, address: data.address },
    });
  }

  if (customer.isBlacklisted) {
    return NextResponse.json({ error: "This account cannot place orders." }, { status: 403 });
  }

  let orderNumber = generateOrderNumber();
  for (let i = 0; i < 5; i++) {
    const clash = await prisma.order.findUnique({ where: { orderNumber } });
    if (!clash) break;
    orderNumber = generateOrderNumber();
  }

  const order = await prisma.order.create({
    data: {
      orderNumber,
      customerId: customer.id,
      customerName: data.customerName,
      phone: data.phone,
      wilaya: data.wilaya,
      commune: data.commune,
      address: data.address,
      totalAmount,
      totalCost,
      discountAmount,
      couponCode,
      giftCardCode,
      giftCardAmount,
      deliveryPrice,
      deliveryType: data.deliveryType,
      referralCode: data.referralCode ?? null,
      affiliateCode,
      items: { create: itemsData },
      events: { create: { status: "PENDING" } },
    },
    include: { items: true },
  });

  await prisma.customerEvent.create({
    data: {
      customerId: customer.id,
      type: "ORDER_PLACED",
      message: `Order #${orderNumber} placed — ${(totalAmount - discountAmount - giftCardAmount + deliveryPrice).toLocaleString("fr-FR")} DA`,
    },
  });

  const orderTotal = totalAmount - discountAmount - giftCardAmount + deliveryPrice;
  after(async () => {
    await pushToRoles(["OWNER", "CONFIRMATION_AGENT"], {
      title: "New order received",
      body: `#${orderNumber} — ${data.customerName} — ${orderTotal.toLocaleString("fr-FR")} DA`,
      url: `/admin/orders/${order.id}`,
    }).catch(() => {});
    await emailRoles(
      ["OWNER", "CONFIRMATION_AGENT"],
      `New order #${orderNumber} — ${orderTotal.toLocaleString("fr-FR")} DA`,
      `<p>New order received on AURELIA.</p>
       <p><strong>Order:</strong> #${orderNumber}<br/>
       <strong>Customer:</strong> ${data.customerName} — ${data.phone}<br/>
       <strong>Wilaya:</strong> ${data.wilaya}, ${data.commune}<br/>
       <strong>Total:</strong> ${orderTotal.toLocaleString("fr-FR")} DA</p>
       <p><a href="${SITE_URL}/admin/orders/${order.id}">View order in admin panel</a></p>`
    ).catch(() => {});
    await sendPurchaseEvent({
      eventId: orderNumber,
      orderNumber,
      value: orderTotal,
      phone: data.phone,
      customerName: data.customerName,
      customerId: customer.id,
      wilaya: data.wilaya,
      commune: data.commune,
      items: data.items,
      req,
    });
  });

  if (data.sessionId) {
    await prisma.abandonedCart
      .update({
        where: { sessionId: data.sessionId },
        data: { recoveredOrderId: order.id },
      })
      .catch(() => {
        // no abandoned cart record for this session — nothing to recover
      });
  }

  return NextResponse.json({ order }, { status: 201 });
}
