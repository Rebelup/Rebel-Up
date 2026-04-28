import { Suspense } from "react";
import { CategoryTabs } from "@/components/layout/CategoryTabs";
import { FeedContainer } from "@/components/feed/FeedContainer";
import { PostCardSkeleton } from "@/components/feed/PostCardSkeleton";

interface FeedPageProps {
  searchParams: Promise<{ category?: string }>;
}

export default async function FeedPage({ searchParams }: FeedPageProps) {
  const { category = "all" } = await searchParams;

  return (
    <>
      <CategoryTabs />
      <div className="max-w-3xl mx-auto px-4 py-6">
        <Suspense
          fallback={
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <PostCardSkeleton key={i} />
              ))}
            </div>
          }
        >
          <FeedContainer category={category} />
        </Suspense>
      </div>
    </>
  );
}
