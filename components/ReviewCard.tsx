import { Star } from "lucide-react";

export type Review = {
  name: string;
  rating: number;
  text: string;
  product?: string;
};

export default function ReviewCard({ review }: { review: Review }) {
  return (
    <div className="rounded-xl3 bg-white p-7 shadow-soft">
      <div className="flex gap-1">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            size={14}
            fill={i < review.rating ? "#B8935F" : "none"}
            color="#B8935F"
            strokeWidth={1.5}
          />
        ))}
      </div>
      <p className="mt-4 font-body text-sm leading-relaxed text-ink/70">
        "{review.text}"
      </p>
      <div className="mt-5 flex items-center justify-between">
        <p className="font-body text-sm font-medium text-ink">{review.name}</p>
        {review.product && (
          <p className="font-body text-xs text-ink/40">{review.product}</p>
        )}
      </div>
    </div>
  );
}
