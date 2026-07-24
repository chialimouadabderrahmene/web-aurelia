import Link from "next/link";
import BagIllustration from "@/components/BagIllustration";

export default function NotFound() {
  return (
    <div className="container-aurelia flex min-h-[70vh] flex-col items-center justify-center gap-4 py-20 text-center">
      <div className="h-28 w-28 opacity-50">
        <BagIllustration hex="#E7E2D9" className="h-full w-full" />
      </div>
      <p className="eyebrow">Error 404</p>
      <h1 className="font-display text-4xl text-ink md:text-5xl">
        This page wandered off
      </h1>
      <p className="max-w-sm font-body text-sm text-ink/50">
        The page you're looking for doesn't exist, or may have moved.
      </p>
      <Link href="/" className="btn-primary mt-2">
        Back to Home
      </Link>
    </div>
  );
}
