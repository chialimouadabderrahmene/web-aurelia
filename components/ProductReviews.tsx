import ReviewCard from "./ReviewCard";

type Review = { authorName: string; rating: number; text: string; product: string | null };

export default function ProductReviews({ reviews, heading }: { reviews: Review[]; heading: string }) {
  if (reviews.length === 0) return null;

  return (
    <section className="mt-14">
      <h2 className="font-display text-2xl text-ink">{heading}</h2>
      <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {reviews.map((r, i) => (
          <ReviewCard
            key={i}
            review={{ name: r.authorName, rating: r.rating, text: r.text, product: r.product ?? undefined }}
          />
        ))}
      </div>
    </section>
  );
}
