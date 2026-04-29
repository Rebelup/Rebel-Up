import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { getCategories } from "@/lib/queries/categories";
import { CategoryTabs } from "@/components/layout/CategoryTabs";
import { FeedContainer } from "@/components/feed/FeedContainer";
import { PostCardSkeleton } from "@/components/feed/PostCardSkeleton";
import { Category } from "@/lib/types";

export const dynamic = "force-dynamic";

interface FeedPageProps {
  searchParams: Promise<{ category?: string }>;
}

export default async function FeedPage({ searchParams }: FeedPageProps) {
  const { category = "all" } = await searchParams;
  const supabase = await createClient();
  const categories: Category[] = await getCategories(supabase, true);

  return (
    <>
      <CategoryTabs categories={categories} />
      <div className="max-w-3xl mx-auto px-4 py-5">
        <Suspense
          fallback={
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <PostCardSkeleton key={i} />
              ))}
            </div>
          }
        >
          <FeedContainer category={category} categories={categories} />
        </Suspense>
      </div>
    </>
  );
}
