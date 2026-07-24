"use client";

import { useState } from "react";
import { useLocale } from "@/components/i18n/LocaleProvider";

export default function Newsletter() {
  const [submitted, setSubmitted] = useState(false);
  const { dict } = useLocale();

  return (
    <div className="flex flex-col items-start justify-between gap-6 rounded-xl3 bg-white p-8 shadow-soft md:flex-row md:items-center md:p-10">
      <div>
        <h3 className="font-display text-2xl text-ink">{dict.newsletter.title}</h3>
        <p className="mt-1 font-body text-sm text-ink/60">{dict.newsletter.subtitle}</p>
      </div>
      {submitted ? (
        <p className="font-body text-sm text-gold">{dict.newsletter.thanks}</p>
      ) : (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setSubmitted(true);
          }}
          className="flex w-full max-w-md gap-2"
        >
          <input
            type="email"
            required
            placeholder={dict.newsletter.placeholder}
            className="w-full rounded-xl2 border border-line bg-cream px-5 py-3.5 font-body text-sm text-ink placeholder:text-ink/40 focus:border-gold focus:outline-none"
          />
          <button type="submit" className="btn-primary whitespace-nowrap !px-6">
            {dict.newsletter.subscribe}
          </button>
        </form>
      )}
    </div>
  );
}
