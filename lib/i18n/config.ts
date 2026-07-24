export const locales = ["en", "ar"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "ar";

export function isLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value);
}

export function localizedPath(locale: Locale, path: string): string {
  return path === "/" ? `/${locale}` : `/${locale}${path}`;
}
