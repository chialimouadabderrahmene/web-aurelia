"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Bell, ShoppingBag, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { formatDzd } from "@/lib/utils";

type LatestOrder = { id: string; orderNumber: string; customerName: string; totalAmount: number };

function playPing() {
  try {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new Ctx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(660, ctx.currentTime + 0.15);
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.4);
  } catch {
    // audio not available — ignore
  }
}

export default function NotificationBell() {
  const [count, setCount] = useState(0);
  const prevCount = useRef(0);
  const [pulse, setPulse] = useState(false);
  const [toast, setToast] = useState<LatestOrder | null>(null);

  useEffect(() => {
    let stopped = false;

    async function poll() {
      try {
        const res = await fetch("/api/admin/orders/unread-count", { cache: "no-store" });
        if (!res.ok) return;
        const data = await res.json();
        if (stopped) return;
        if (data.count > prevCount.current) {
          setPulse(true);
          setTimeout(() => setPulse(false), 1800);
          if (data.latest) {
            setToast(data.latest);
            playPing();
            setTimeout(() => setToast((t) => (t?.id === data.latest.id ? null : t)), 7000);
          }
        }
        prevCount.current = data.count;
        setCount(data.count);
      } catch {
        // ignore transient network errors
      }
    }

    poll();
    const id = setInterval(poll, 15000);
    return () => {
      stopped = true;
      clearInterval(id);
    };
  }, []);

  return (
    <>
      <Link href="/admin/orders" className="relative flex h-10 w-10 items-center justify-center rounded-full hover:bg-sand">
        <motion.div
          animate={pulse ? { rotate: [0, -15, 15, -10, 10, 0] } : {}}
          transition={{ duration: 0.6 }}
        >
          <Bell size={18} strokeWidth={1.5} className="text-ink/70" />
        </motion.div>
        <AnimatePresence>
          {count > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="absolute -top-1 -right-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-gold px-1 text-[10px] font-body text-white"
            >
              {count > 9 ? "9+" : count}
            </motion.span>
          )}
        </AnimatePresence>
      </Link>

      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20, x: 20 }}
            animate={{ opacity: 1, y: 0, x: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="fixed right-3 top-3 z-[100] w-[calc(100vw-1.5rem)] max-w-80 rounded-xl3 bg-ink p-4 text-white shadow-lift sm:right-6 sm:top-6"
          >
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gold/20">
                <ShoppingBag size={16} className="text-gold" />
              </div>
              <div className="flex-1">
                <p className="font-body text-sm font-medium">New order received</p>
                <p className="mt-0.5 font-body text-xs text-white/70">
                  #{toast.orderNumber} — {toast.customerName} — {formatDzd(toast.totalAmount)}
                </p>
                <Link
                  href={`/admin/orders/${toast.id}`}
                  onClick={() => setToast(null)}
                  className="mt-2 inline-block font-body text-xs text-gold hover:underline"
                >
                  View order →
                </Link>
              </div>
              <button onClick={() => setToast(null)} className="text-white/50 hover:text-white">
                <X size={14} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
