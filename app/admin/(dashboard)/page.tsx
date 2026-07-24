import Link from "next/link";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatDzd } from "@/lib/utils";
import { WILAYA_BY_NAME } from "@/lib/geo/wilayas-list";
import {
  AlertTriangle,
  Clock,
  TrendingUp,
  TrendingDown,
  PackageX,
  ShoppingBag,
  Crown,
  Wallet,
  ShoppingCart,
  UserPlus,
  Repeat,
  Minus,
} from "lucide-react";
import AlgeriaMap from "@/components/admin/AlgeriaMap";
import TrendChart from "@/components/admin/TrendChart";
import StatusBadge from "@/components/admin/StatusBadge";

const RANGES: Record<string, number | null> = {
  today: 1,
  week: 7,
  month: 30,
  year: 365,
};

const ALL_STATUSES = ["PENDING", "TENTATIVE", "CONFIRMED", "POSTPONED", "DELIVERED", "CANCELLED"];

function startForRange(range: string): Date {
  const now = new Date();
  if (range === "today") return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (range === "week") {
    const d = new Date(now);
    d.setDate(d.getDate() - 7);
    return d;
  }
  if (range === "year") return new Date(now.getFullYear(), 0, 1);
  return new Date(now.getFullYear(), now.getMonth(), 1);
}

function pctDelta(current: number, prev: number): number | null {
  if (prev === 0) return current > 0 ? null : 0;
  return Math.round(((current - prev) / prev) * 100);
}

function dayKey(d: Date) {
  return d.toISOString().slice(0, 10);
}

function dayLabel(d: Date) {
  return d.toLocaleDateString("en", { day: "numeric", month: "short" });
}

export default async function AdminDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>;
}) {
  const session = await getSession();
  if (!session) return null;

  const { range: rawRange } = await searchParams;
  const range = rawRange && RANGES[rawRange] ? rawRange : "month";
  const startDate = startForRange(range);
  const canSeeFinance = session.role === "OWNER" || session.role === "FINANCE_MANAGER";

  const now = new Date();
  const rangeDurationMs = now.getTime() - startDate.getTime();
  const prevStart = new Date(startDate.getTime() - rangeDurationMs);
  const trendStart = new Date(now);
  trendStart.setDate(trendStart.getDate() - 13);
  trendStart.setHours(0, 0, 0, 0);

  const [
    pendingCount,
    lowStock,
    outOfStock,
    rangedOrders,
    prevRangedOrders,
    trendOrders,
    statusCounts,
    abandoned,
    recentOrders,
    customers,
  ] = await Promise.all([
    prisma.order.count({ where: { status: "PENDING" } }),
    prisma.product.findMany({
      where: { stockQty: { gt: 0, lte: 3 } },
      select: { id: true, nameEn: true, stockQty: true },
      take: 8,
    }),
    prisma.product.count({ where: { stockQty: { lte: 0 } } }),
    prisma.order.findMany({
      where: { confirmedAt: { gte: startDate }, status: { not: "CANCELLED" } },
      include: { items: true },
    }),
    prisma.order.findMany({
      where: { confirmedAt: { gte: prevStart, lt: startDate }, status: { not: "CANCELLED" } },
      select: { totalAmount: true, discountAmount: true, giftCardAmount: true, totalCost: true },
    }),
    prisma.order.findMany({
      where: { confirmedAt: { gte: trendStart }, status: { not: "CANCELLED" } },
      select: { totalAmount: true, discountAmount: true, giftCardAmount: true, totalCost: true, confirmedAt: true },
    }),
    prisma.order.groupBy({
      by: ["status"],
      where: { createdAt: { gte: startDate } },
      _count: { _all: true },
    }),
    prisma.abandonedCart.aggregate({
      where: { recoveredOrderId: null },
      _count: { _all: true },
      _sum: { totalAmount: true },
    }),
    prisma.order.findMany({
      orderBy: { createdAt: "desc" },
      take: 6,
      select: {
        id: true,
        orderNumber: true,
        customerName: true,
        status: true,
        totalAmount: true,
        discountAmount: true,
        giftCardAmount: true,
        deliveryPrice: true,
        createdAt: true,
      },
    }),
    canSeeFinance
      ? prisma.customer.findMany({
          where: { orders: { some: { status: { not: "CANCELLED" }, confirmedAt: { not: null } } } },
          include: {
            orders: {
              where: { status: { not: "CANCELLED" }, confirmedAt: { not: null } },
              select: { totalAmount: true, discountAmount: true, giftCardAmount: true },
            },
          },
          take: 2000,
        })
      : Promise.resolve([]),
  ]);

  const revenue = rangedOrders.reduce((n, o) => n + (o.totalAmount - o.discountAmount - o.giftCardAmount), 0);
  const cost = rangedOrders.reduce((n, o) => n + o.totalCost, 0);
  const netProfit = revenue - cost;
  const orderCount = rangedOrders.length;
  const avgOrderValue = orderCount ? Math.round(revenue / orderCount) : 0;

  const prevRevenue = prevRangedOrders.reduce((n, o) => n + (o.totalAmount - o.discountAmount - o.giftCardAmount), 0);
  const prevCost = prevRangedOrders.reduce((n, o) => n + o.totalCost, 0);
  const prevNetProfit = prevRevenue - prevCost;
  const prevOrderCount = prevRangedOrders.length;

  // --- 14-day trend buckets ---
  const dayBuckets = new Map<string, { revenue: number; profit: number }>();
  for (let i = 0; i < 14; i++) {
    const d = new Date(trendStart);
    d.setDate(d.getDate() + i);
    dayBuckets.set(dayKey(d), { revenue: 0, profit: 0 });
  }
  for (const o of trendOrders) {
    if (!o.confirmedAt) continue;
    const key = dayKey(new Date(o.confirmedAt));
    const bucket = dayBuckets.get(key);
    if (!bucket) continue;
    const rev = o.totalAmount - o.discountAmount - o.giftCardAmount;
    bucket.revenue += rev;
    bucket.profit += rev - o.totalCost;
  }
  const revenueTrend = [...dayBuckets.entries()].map(([key, v]) => ({
    label: dayLabel(new Date(key)),
    value: v.revenue,
  }));
  const profitTrend = [...dayBuckets.entries()].map(([key, v]) => ({
    label: dayLabel(new Date(key)),
    value: v.profit,
  }));

  // --- New vs returning customers in range ---
  const uniqueCustomerIds = [...new Set(rangedOrders.map((o) => o.customerId))];
  const customerCreatedMap = uniqueCustomerIds.length
    ? await prisma.customer.findMany({
        where: { id: { in: uniqueCustomerIds } },
        select: { id: true, createdAt: true },
      })
    : [];
  const newCustomerCount = customerCreatedMap.filter((c) => c.createdAt >= startDate).length;
  const returningCustomerCount = customerCreatedMap.length - newCustomerCount;

  const wilayaAgg: Record<string, number> = {};
  const productAgg: Record<string, { nameEn: string; qty: number; revenue: number; cost: number }> = {};

  for (const order of rangedOrders) {
    const code = WILAYA_BY_NAME[order.wilaya]?.code;
    if (code) wilayaAgg[code] = (wilayaAgg[code] ?? 0) + 1;
    for (const item of order.items) {
      const key = item.productId ?? item.nameEn;
      if (!productAgg[key]) productAgg[key] = { nameEn: item.nameEn, qty: 0, revenue: 0, cost: 0 };
      productAgg[key].qty += item.qty;
      productAgg[key].revenue += item.price * item.qty;
      productAgg[key].cost += item.costPrice * item.qty;
    }
  }

  const bestSellers = Object.values(productAgg).sort((a, b) => b.qty - a.qty).slice(0, 5);
  const topProducts = Object.values(productAgg).sort((a, b) => b.revenue - a.revenue).slice(0, 5);
  const productProfit = Object.values(productAgg)
    .map((p) => ({ ...p, profit: p.revenue - p.cost }))
    .sort((a, b) => b.profit - a.profit)
    .slice(0, 5);

  const topClients = customers
    .map((c) => ({
      id: c.id,
      name: c.name,
      isVip: c.isVip,
      spent: c.orders.reduce((n, o) => n + (o.totalAmount - o.discountAmount - o.giftCardAmount), 0),
      orderCount: c.orders.length,
    }))
    .filter((c) => c.orderCount > 0)
    .sort((a, b) => b.spent - a.spent)
    .slice(0, 5);

  const statusMap = new Map<string, number>(statusCounts.map((s) => [s.status as string, s._count._all]));
  const totalStatusOrders = statusCounts.reduce((n, s) => n + s._count._all, 0);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-display text-3xl text-ink">
          Welcome back, {session.name.split(" ")[0]}
        </h1>
        <div className="flex gap-2 overflow-x-auto">
          {Object.keys(RANGES).map((r) => (
            <Link
              key={r}
              href={`/admin?range=${r}`}
              className={`rounded-full border px-4 py-1.5 font-body text-xs uppercase tracking-wide ${
                range === r ? "border-ink bg-ink text-white" : "border-line text-ink/60"
              }`}
            >
              {r}
            </Link>
          ))}
        </div>
      </div>

      {/* Row 1 — operational KPIs, all roles */}
      <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={Clock}
          label="Pending Orders"
          value={String(pendingCount)}
          href="/admin/orders?status=PENDING"
          tone={pendingCount > 0 ? "amber" : "default"}
        />
        <StatCard
          icon={ShoppingBag}
          label={`Orders (${range})`}
          value={String(orderCount)}
          delta={pctDelta(orderCount, prevOrderCount)}
        />
        <StatCard
          icon={PackageX}
          label="Out of Stock"
          value={String(outOfStock)}
          href="/admin/stock"
          tone={outOfStock > 0 ? "red" : "default"}
        />
        <StatCard
          icon={ShoppingCart}
          label="Abandoned Carts"
          value={String(abandoned._count._all)}
          href="/admin/marketing/abandoned-carts"
          tone={abandoned._count._all > 0 ? "amber" : "default"}
        />
      </div>

      {/* Row 2 — finance KPIs with deltas */}
      {canSeeFinance && (
        <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            icon={TrendingUp}
            label={`Revenue (${range})`}
            value={formatDzd(revenue)}
            delta={pctDelta(revenue, prevRevenue)}
          />
          <StatCard
            icon={Wallet}
            label={`Spent (${range})`}
            value={formatDzd(cost)}
            tone="red"
            delta={pctDelta(cost, prevCost)}
            invertDelta
          />
          <StatCard
            icon={TrendingUp}
            label={`Net Profit (${range})`}
            value={formatDzd(netProfit)}
            tone="gold"
            delta={pctDelta(netProfit, prevNetProfit)}
          />
          <StatCard icon={ShoppingBag} label="Avg Order Value" value={formatDzd(avgOrderValue)} />
        </div>
      )}

      {/* Trend charts */}
      {canSeeFinance && (
        <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-2">
          <div className="min-w-0 rounded-xl3 bg-white p-6 shadow-soft">
            <h2 className="font-display text-lg text-ink">Revenue — last 14 days</h2>
            <div className="mt-4">
              <TrendChart points={revenueTrend} color="#B8935F" />
            </div>
          </div>
          <div className="min-w-0 rounded-xl3 bg-white p-6 shadow-soft">
            <h2 className="font-display text-lg text-ink">Net Profit — last 14 days</h2>
            <div className="mt-4">
              <TrendChart points={profitTrend} color="#111111" />
            </div>
          </div>
        </div>
      )}

      {/* Map + rankings */}
      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="min-w-0 rounded-xl3 bg-white p-6 shadow-soft lg:col-span-2">
          <h2 className="font-display text-lg text-ink">Orders by Wilaya</h2>
          <p className="mt-1 font-body text-xs text-ink/40">Colored by order volume, {range}</p>
          <div className="mt-4">
            <AlgeriaMap values={wilayaAgg} unit="orders" />
          </div>
        </div>

        <div className="space-y-8">
          <RankList
            icon={Crown}
            title="Best Sellers"
            subtitle="By units sold"
            rows={bestSellers.map((p) => ({ label: p.nameEn, value: `${p.qty} sold` }))}
          />
          <RankList
            icon={TrendingUp}
            title="Top Products"
            subtitle="By revenue"
            rows={topProducts.map((p) => ({ label: p.nameEn, value: formatDzd(p.revenue) }))}
          />
          {canSeeFinance && (
            <RankList
              icon={Wallet}
              title="Net Profit by Product"
              subtitle={`Revenue minus cost, ${range}`}
              rows={productProfit.map((p) => ({ label: p.nameEn, value: formatDzd(p.profit) }))}
            />
          )}
        </div>
      </div>

      {/* Order status breakdown + customer mix */}
      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="min-w-0 rounded-xl3 bg-white p-6 shadow-soft lg:col-span-2">
          <h2 className="font-display text-lg text-ink">Order Status Breakdown</h2>
          <p className="mt-1 font-body text-xs text-ink/40">Orders placed {range}, by current status</p>
          <div className="mt-5 space-y-3">
            {ALL_STATUSES.map((s) => {
              const count = statusMap.get(s) ?? 0;
              const pct = totalStatusOrders ? Math.round((count / totalStatusOrders) * 100) : 0;
              return (
                <Link
                  key={s}
                  href={`/admin/orders?status=${s}`}
                  className="flex items-center gap-3 group"
                >
                  <div className="w-28 shrink-0">
                    <StatusBadge status={s} />
                  </div>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-sand">
                    <div
                      className="h-full rounded-full bg-ink/70 transition-all group-hover:bg-gold"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="w-16 shrink-0 text-right font-body text-sm text-ink/60">
                    {count} ({pct}%)
                  </span>
                </Link>
              );
            })}
            {totalStatusOrders === 0 && (
              <p className="font-body text-sm text-ink/40">No orders placed in this range yet.</p>
            )}
          </div>
        </div>

        {canSeeFinance && (
          <div className="min-w-0 rounded-xl3 bg-white p-6 shadow-soft">
            <h2 className="font-display text-lg text-ink">Customer Mix</h2>
            <p className="mt-1 font-body text-xs text-ink/40">Buyers {range}</p>
            <div className="mt-5 space-y-4">
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                  <UserPlus size={16} />
                </span>
                <div>
                  <p className="font-display text-xl text-ink">{newCustomerCount}</p>
                  <p className="font-body text-xs text-ink/40">New customers</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gold/10 text-gold">
                  <Repeat size={16} />
                </span>
                <div>
                  <p className="font-display text-xl text-ink">{returningCustomerCount}</p>
                  <p className="font-body text-xs text-ink/40">Returning customers</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Recent orders + top clients */}
      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="min-w-0 rounded-xl3 bg-white p-6 shadow-soft lg:col-span-2">
          <h2 className="font-display text-lg text-ink">Recent Orders</h2>
          <ul className="mt-4 divide-y divide-line">
            {recentOrders.map((o) => (
              <li key={o.id} className="flex items-center justify-between py-3">
                <Link href={`/admin/orders/${o.id}`} className="flex items-center gap-3">
                  <div>
                    <p className="font-body text-sm text-ink">#{o.orderNumber}</p>
                    <p className="font-body text-xs text-ink/40">{o.customerName}</p>
                  </div>
                </Link>
                <div className="flex items-center gap-3">
                  <span className="font-body text-sm text-ink">
                    {formatDzd(o.totalAmount - o.discountAmount - o.giftCardAmount + o.deliveryPrice)}
                  </span>
                  <StatusBadge status={o.status} />
                </div>
              </li>
            ))}
            {recentOrders.length === 0 && (
              <p className="py-4 font-body text-sm text-ink/40">No orders yet.</p>
            )}
          </ul>
        </div>

        {canSeeFinance && topClients.length > 0 && (
          <div className="min-w-0 rounded-xl3 bg-white p-6 shadow-soft">
            <h2 className="font-display text-lg text-ink">Top Clients</h2>
            <ul className="mt-4 divide-y divide-line">
              {topClients.map((c) => (
                <li key={c.id} className="flex items-center justify-between py-3">
                  <Link
                    href={`/admin/customers/${c.id}`}
                    className="flex items-center gap-2 font-body text-sm text-ink hover:text-gold"
                  >
                    {c.name}
                    {c.isVip && (
                      <span className="rounded-full bg-gold/10 px-2 py-0.5 text-[10px] uppercase text-gold">
                        VIP
                      </span>
                    )}
                  </Link>
                  <div className="text-right">
                    <p className="font-body text-sm text-ink">{formatDzd(c.spent)}</p>
                    <p className="font-body text-xs text-ink/40">{c.orderCount} orders</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {lowStock.length > 0 && (
        <div className="mt-8 rounded-xl3 bg-white p-6 shadow-soft">
          <div className="flex items-center gap-2">
            <AlertTriangle size={16} className="text-amber-500" />
            <h2 className="font-display text-lg text-ink">Low stock — restock soon</h2>
          </div>
          <ul className="mt-4 divide-y divide-line">
            {lowStock.map((p) => (
              <li key={p.id} className="flex items-center justify-between py-3 font-body text-sm">
                <span className="text-ink">{p.nameEn}</span>
                <span className="text-amber-600">{p.stockQty} left</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-8">
        <Link href="/admin/orders" className="btn-secondary">
          View all orders
        </Link>
      </div>
    </div>
  );
}

function RankList({
  icon: Icon,
  title,
  subtitle,
  rows,
}: {
  icon: typeof Crown;
  title: string;
  subtitle: string;
  rows: { label: string; value: string }[];
}) {
  return (
    <div className="min-w-0 rounded-xl3 bg-white p-6 shadow-soft">
      <div className="flex items-center gap-2">
        <Icon size={16} className="text-gold" />
        <h2 className="font-display text-lg text-ink">{title}</h2>
      </div>
      <p className="mt-0.5 font-body text-xs text-ink/40">{subtitle}</p>
      {rows.length === 0 ? (
        <p className="mt-4 font-body text-sm text-ink/40">No data yet.</p>
      ) : (
        <ul className="mt-4 divide-y divide-line">
          {rows.map((r, i) => (
            <li key={i} className="flex items-center justify-between py-2.5 font-body text-sm">
              <span className="text-ink">
                <span className="mr-2 text-ink/30">{i + 1}.</span>
                {r.label}
              </span>
              <span className="text-ink/60">{r.value}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  href,
  tone = "default",
  delta,
  invertDelta = false,
}: {
  icon: typeof Clock;
  label: string;
  value: string;
  href?: string;
  tone?: "default" | "amber" | "red" | "gold";
  delta?: number | null;
  invertDelta?: boolean;
}) {
  const toneClass =
    tone === "amber"
      ? "text-amber-600"
      : tone === "red"
        ? "text-red-600"
        : tone === "gold"
          ? "text-gold"
          : "text-ink";

  const deltaIsGood = delta != null && (invertDelta ? delta <= 0 : delta >= 0);

  const content = (
    <div className="min-w-0 rounded-xl3 bg-white p-6 shadow-soft transition-shadow hover:shadow-card">
      <div className="flex items-center justify-between">
        <Icon size={18} strokeWidth={1.5} className={toneClass} />
        {delta != null && (
          <span
            className={`flex items-center gap-0.5 font-body text-xs ${
              delta === 0 ? "text-ink/40" : deltaIsGood ? "text-emerald-600" : "text-red-500"
            }`}
          >
            {delta === 0 ? <Minus size={12} /> : delta > 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            {Math.abs(delta)}%
          </span>
        )}
      </div>
      <p className={`mt-4 font-display text-2xl ${toneClass}`}>{value}</p>
      <p className="mt-1 font-body text-xs uppercase tracking-wide text-ink/40">{label}</p>
    </div>
  );

  return href ? <Link href={href}>{content}</Link> : content;
}
