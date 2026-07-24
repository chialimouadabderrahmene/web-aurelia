"use client";

import Link from "next/link";
import { ComponentProps } from "react";
import { useLocale } from "./LocaleProvider";

type Props = Omit<ComponentProps<typeof Link>, "href"> & { href: string };

export default function LocalizedLink({ href, ...rest }: Props) {
  const { locale } = useLocale();
  const localizedHref = href.startsWith("/") ? `/${locale}${href === "/" ? "" : href}` : href;
  return <Link href={localizedHref} {...rest} />;
}
