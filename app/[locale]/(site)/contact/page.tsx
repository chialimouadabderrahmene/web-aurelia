"use client";

import { useState } from "react";
import { Mail, Phone, MapPin, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";
import { useLocale } from "@/components/i18n/LocaleProvider";
import Reveal from "@/components/Reveal";

export default function ContactPage() {
  const [sent, setSent] = useState(false);
  const { dict } = useLocale();

  return (
    <section className="container-aurelia py-14 md:py-20">
      <Reveal>
        <p className="eyebrow">{dict.contact.eyebrow}</p>
        <h1 className="mt-3 font-display text-4xl text-ink md:text-5xl">{dict.contact.title}</h1>
      </Reveal>

      <div className="mt-12 grid grid-cols-1 gap-14 md:grid-cols-3">
        <div className="space-y-6 md:col-span-1">
          <ContactRow icon={Phone} label={dict.contact.phone} />
          <ContactRow icon={Mail} label={dict.contact.email} />
          <ContactRow icon={MapPin} label={dict.contact.address} />
        </div>

        <div className="md:col-span-2">
          {sent ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-3 rounded-xl3 bg-sand p-8"
            >
              <CheckCircle2 className="text-gold" />
              <p className="font-body text-sm text-ink/70">{dict.contact.sent}</p>
            </motion.div>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                setSent(true);
              }}
              className="space-y-5"
            >
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <input
                  required
                  placeholder={dict.contact.namePlaceholder}
                  className="rounded-xl2 border border-line bg-cream px-5 py-3.5 font-body text-sm placeholder:text-ink/40 focus:border-gold focus:outline-none"
                />
                <input
                  required
                  type="email"
                  placeholder={dict.contact.emailPlaceholder}
                  className="rounded-xl2 border border-line bg-cream px-5 py-3.5 font-body text-sm placeholder:text-ink/40 focus:border-gold focus:outline-none"
                />
              </div>
              <textarea
                required
                rows={5}
                placeholder={dict.contact.messagePlaceholder}
                className="w-full rounded-xl2 border border-line bg-cream px-5 py-3.5 font-body text-sm placeholder:text-ink/40 focus:border-gold focus:outline-none"
              />
              <button type="submit" className="btn-primary">
                {dict.contact.send}
              </button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}

function ContactRow({ icon: Icon, label }: { icon: typeof Phone; label: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-sand">
        <Icon size={16} strokeWidth={1.5} className="text-gold" />
      </div>
      <span className="font-body text-sm text-ink/70">{label}</span>
    </div>
  );
}
