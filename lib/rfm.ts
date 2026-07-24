export type Segment = "champion" | "regular" | "new" | "at_risk" | "lost" | "no_orders";

export const SEGMENT_LABELS: Record<Segment, string> = {
  champion: "Champion",
  regular: "Regular",
  new: "New",
  at_risk: "At Risk",
  lost: "Lost",
  no_orders: "No Orders",
};

export function computeSegment(orderCount: number, lastOrderAt: Date | null, customerCreatedAt: Date): Segment {
  if (orderCount === 0) return "no_orders";

  const daysSinceLast = lastOrderAt ? Math.floor((Date.now() - lastOrderAt.getTime()) / 86400000) : Infinity;
  const daysSinceJoined = Math.floor((Date.now() - customerCreatedAt.getTime()) / 86400000);

  if (orderCount === 1 && daysSinceJoined <= 14) return "new";
  if (daysSinceLast > 120) return "lost";
  if (orderCount >= 2 && daysSinceLast > 60) return "at_risk";
  if (orderCount >= 3 && daysSinceLast <= 30) return "champion";
  return "regular";
}
