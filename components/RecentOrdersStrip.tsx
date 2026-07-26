import { ShoppingBag } from "lucide-react";

type RecentOrder = { firstName: string; wilaya: string; createdAt: Date };

function relativeTime(date: Date, locale: "en" | "ar"): string {
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });
  const diffMin = Math.round((date.getTime() - Date.now()) / 60_000);
  if (Math.abs(diffMin) < 60) return rtf.format(diffMin, "minute");
  const diffHr = Math.round(diffMin / 60);
  if (Math.abs(diffHr) < 24) return rtf.format(diffHr, "hour");
  return rtf.format(Math.round(diffHr / 24), "day");
}

export default function RecentOrdersStrip({
  orders,
  heading,
  orderedFrom,
  locale,
}: {
  orders: RecentOrder[];
  heading: string;
  orderedFrom: string;
  locale: "en" | "ar";
}) {
  if (orders.length === 0) return null;

  return (
    <section className="mt-9 rounded-xl2 bg-sand p-5">
      <p className="font-body text-xs uppercase tracking-wide text-ink/40">{heading}</p>
      <ul className="mt-3 space-y-2.5">
        {orders.slice(0, 4).map((o, i) => (
          <li key={i} className="flex items-center gap-2.5 font-body text-sm text-ink/70">
            <ShoppingBag size={14} strokeWidth={1.5} className="shrink-0 text-gold" />
            <span>
              <span className="font-medium text-ink">{o.firstName}</span> {orderedFrom} {o.wilaya}
              <span className="text-ink/40"> — {relativeTime(o.createdAt, locale)}</span>
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
