import Link from "next/link";
import Newsletter from "./Newsletter";
import { Locale, localizedPath } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/getDictionary";

export default function Footer({ locale }: { locale: Locale }) {
  const dict = getDictionary(locale);
  const p = (path: string) => localizedPath(locale, path);

  return (
    <footer className="border-t border-line bg-sand pb-24 pt-16 md:pb-16">
      <div className="container-aurelia">
        <Newsletter />

        <div className="mt-16 grid grid-cols-2 gap-10 md:grid-cols-4">
          <div className="col-span-2 md:col-span-1">
            <span className="font-display text-2xl tracking-widest2 text-ink">
              AURELIA
            </span>
            <p className="mt-4 max-w-[220px] font-body text-sm leading-relaxed text-ink/60">
              {dict.footer.tagline}
            </p>
          </div>

          <FooterCol
            title={dict.footer.shop}
            links={[
              { href: p("/collection"), label: dict.nav.collection },
              { href: p("/collection?filter=best-sellers"), label: dict.footer.bestSellers },
              { href: p("/collection?filter=new"), label: dict.footer.newArrivals },
            ]}
          />
          <FooterCol
            title={dict.footer.support}
            links={[
              { href: p("/faq"), label: dict.nav.faq },
              { href: p("/track"), label: dict.footer.orderTracking },
              { href: p("/contact"), label: dict.nav.contact },
            ]}
          />
          <FooterCol
            title={dict.footer.company}
            links={[
              { href: p("/about"), label: dict.nav.about },
              { href: p("/reviews"), label: dict.nav.reviews },
            ]}
          />
        </div>

        <div className="mt-14 flex flex-col-reverse items-start justify-between gap-4 border-t border-ink/10 pt-6 md:flex-row md:items-center">
          <p className="font-body text-xs text-ink/40">
            © {new Date().getFullYear()} AURELIA. {dict.footer.copyright}
          </p>
          <p className="font-body text-xs text-ink/40">{dict.footer.cod}</p>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({
  title,
  links,
}: {
  title: string;
  links: { href: string; label: string }[];
}) {
  return (
    <div>
      <h4 className="eyebrow mb-4">{title}</h4>
      <ul className="space-y-3">
        {links.map((l) => (
          <li key={l.href}>
            <Link
              href={l.href}
              className="font-body text-sm text-ink/60 transition-colors hover:text-ink"
            >
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
