"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { SessionPayload } from "@/lib/auth";
import NotificationBell from "./NotificationBell";
import PushSetup from "./PushSetup";

export default function AdminTopbar({
  session,
  nav,
}: {
  session: SessionPayload;
  nav: { href: string; label: string; area: string | null }[];
}) {
  const router = useRouter();
  const pathname = usePathname();

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <header className="border-b border-line bg-white">
      <div className="flex items-center justify-between gap-2 px-3 py-4 sm:px-6 md:px-10">
        <p className="min-w-0 shrink font-display text-base text-ink sm:text-lg md:hidden">AURELIA</p>
        <div className="hidden md:block" />
        <div className="flex shrink-0 items-center gap-1.5 sm:gap-4">
          {(session.role === "OWNER" || session.role === "CONFIRMATION_AGENT") && (
            <>
              <PushSetup />
              <NotificationBell />
            </>
          )}
          <button
            onClick={logout}
            className="flex items-center gap-2 rounded-full border border-line px-2.5 py-2 font-body text-xs text-ink/60 hover:border-ink hover:text-ink sm:px-4"
          >
            <LogOut size={14} strokeWidth={1.5} />
            <span className="hidden sm:inline">Sign out</span>
          </button>
        </div>
      </div>
      <nav className="flex gap-1 overflow-x-auto border-t border-line px-4 py-2 md:hidden">
        {nav.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`whitespace-nowrap rounded-full px-4 py-2 font-body text-xs ${
              pathname === item.href ? "bg-ink text-white" : "text-ink/60"
            }`}
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
