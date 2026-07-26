"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { getSessionId } from "@/lib/session";

export default function VisitorTracker() {
  const pathname = usePathname();

  useEffect(() => {
    fetch("/api/track/visit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId: getSessionId(), path: pathname }),
    }).catch(() => {
      // best-effort tracking, ignore failures
    });
  }, [pathname]);

  return null;
}
