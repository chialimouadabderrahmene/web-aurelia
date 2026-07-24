export const EXPENSE_CATEGORIES = [
  "RENT",
  "SALARIES",
  "MARKETING",
  "PACKAGING",
  "SHIPPING",
  "UTILITIES",
  "SOFTWARE",
  "MAINTENANCE",
  "TAXES",
  "OTHER",
] as const;

export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number];

export const EXPENSE_CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  RENT: "Rent",
  SALARIES: "Salaries",
  MARKETING: "Marketing",
  PACKAGING: "Packaging",
  SHIPPING: "Shipping",
  UTILITIES: "Utilities",
  SOFTWARE: "Software",
  MAINTENANCE: "Maintenance",
  TAXES: "Taxes",
  OTHER: "Other",
};

export function rangeStart(range: string): Date {
  const now = new Date();
  const d = new Date(now);
  d.setHours(0, 0, 0, 0);
  if (range === "today") return d;
  if (range === "week") {
    d.setDate(d.getDate() - 6);
    return d;
  }
  if (range === "year") {
    d.setMonth(0, 1);
    return d;
  }
  if (range === "all") return new Date(2020, 0, 1);
  // month (default)
  d.setDate(1);
  return d;
}
