const styles: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-700",
  TENTATIVE: "bg-blue-100 text-blue-700",
  CONFIRMED: "bg-emerald-100 text-emerald-700",
  POSTPONED: "bg-purple-100 text-purple-700",
  DELIVERED: "bg-ink text-white",
  CANCELLED: "bg-red-100 text-red-700",
};

export default function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 font-body text-[11px] uppercase tracking-wide ${
        styles[status] ?? "bg-sand text-ink/60"
      }`}
    >
      {status}
    </span>
  );
}
