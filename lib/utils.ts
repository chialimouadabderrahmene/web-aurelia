export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://neao.online";

export function formatDzd(amount: number): string {
  return `${amount.toLocaleString("fr-FR")} DA`;
}

export function whatsappLink(phone: string, message?: string): string {
  const digits = phone.replace(/\D/g, "").replace(/^0/, "");
  const intl = digits.startsWith("213") ? digits : `213${digits}`;
  const base = `https://wa.me/${intl}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}
