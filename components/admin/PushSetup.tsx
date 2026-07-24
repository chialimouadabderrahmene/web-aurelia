"use client";

import { useEffect, useState } from "react";
import { Bell, BellOff } from "lucide-react";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

export default function PushSetup() {
  const [status, setStatus] = useState<"unsupported" | "default" | "granted" | "denied">("default");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || !("Notification" in window) || !("serviceWorker" in navigator)) {
      setStatus("unsupported");
      return;
    }
    setStatus(Notification.permission as "default" | "granted" | "denied");

    if (Notification.permission === "granted") {
      registerAndSubscribe().catch(() => {});
    }
  }, []);

  async function registerAndSubscribe() {
    const reg = await navigator.serviceWorker.register("/sw.js");
    await navigator.serviceWorker.ready;
    let sub = await reg.pushManager.getSubscription();
    if (!sub) {
      const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!publicKey) return;
      sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });
    }
    await fetch("/api/admin/push/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(sub.toJSON()),
    });
  }

  async function enable() {
    setBusy(true);
    try {
      const permission = await Notification.requestPermission();
      setStatus(permission as "default" | "granted" | "denied");
      if (permission === "granted") await registerAndSubscribe();
    } finally {
      setBusy(false);
    }
  }

  if (status === "unsupported" || status === "granted") return null;

  return (
    <button
      onClick={enable}
      disabled={busy || status === "denied"}
      className="flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border border-line px-2.5 py-2 font-body text-xs text-ink/60 hover:border-ink hover:text-ink disabled:opacity-40 sm:px-3.5"
      title={status === "denied" ? "Notifications blocked — enable in browser settings" : "Get notified even when this tab is closed"}
    >
      {status === "denied" ? <BellOff size={14} /> : <Bell size={14} />}
      <span className="hidden sm:inline">
        {status === "denied" ? "Notifications blocked" : busy ? "Enabling…" : "Enable notifications"}
      </span>
    </button>
  );
}
