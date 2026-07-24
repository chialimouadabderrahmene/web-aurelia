"use client";

import { User } from "lucide-react";
import { useLocale } from "@/components/i18n/LocaleProvider";
import LocalizedLink from "@/components/i18n/LocalizedLink";
import Reveal from "@/components/Reveal";

export default function AccountPage() {
  const { dict } = useLocale();

  return (
    <div className="container-aurelia flex min-h-[60vh] flex-col items-center justify-center gap-4 py-20 text-center">
      <Reveal>
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-sand">
          <User size={24} strokeWidth={1.5} className="text-ink/50" />
        </div>
        <h1 className="mt-6 font-display text-3xl text-ink">{dict.account.title}</h1>
        <p className="mt-2 max-w-xs font-body text-sm text-ink/50">{dict.account.subtitle}</p>
        <div className="mt-8 flex justify-center gap-3">
          <LocalizedLink href="/track" className="btn-secondary">
            {dict.account.trackOrder}
          </LocalizedLink>
          <LocalizedLink href="/collection" className="btn-primary">
            {dict.account.shopCollection}
          </LocalizedLink>
        </div>
      </Reveal>
    </div>
  );
}
