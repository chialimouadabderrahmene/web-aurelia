"use client";

import { useEffect, useRef } from "react";
import { useCart } from "@/lib/store";
import { getSessionId } from "@/lib/session";

export default function CartTracker() {
  const items = useCart((s) => s.items);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    if (items.length === 0) return;

    timer.current = setTimeout(() => {
      const sessionId = getSessionId();
      const totalAmount = items.reduce((n, i) => n + i.price * i.qty, 0);
      fetch("/api/cart/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          items: items.map((i) => ({ name: i.name, qty: i.qty, price: i.price })),
          totalAmount,
        }),
      }).catch(() => {
        // best-effort tracking, ignore failures
      });
    }, 3000);

    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [items]);

  return null;
}
