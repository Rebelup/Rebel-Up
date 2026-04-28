"use client";

import { useEffect, useRef } from "react";
import { usePosts } from "@/lib/hooks/usePosts";
import { PostCard } from "./PostCard";
import { PostCardSkeleton } from "./PostCardSkeleton";
import { Loader2, Inbox } from "lucide-react";

interface FeedContainerProps {
  category: string;
}

export function FeedContainer({ category }: FeedContainerProps) {
  const sentinelRef = useRef<HTMLDivElement>(null);
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, isError } =
    usePosts(category);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { rootMargin: "200px" }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const posts = data?.pages.flatMap((p) => p) ?? [];

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <PostCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="py-16 text-center text-muted-foreground">
        게시글을 불러오지 못했습니다. 잠시 후 다시 시도해주세요.
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="py-20 flex flex-col items-center gap-3 text-muted-foreground">
        <Inbox className="w-10 h-10 opacity-40" />
        <p className="text-sm">아직 게시글이 없어요. 첫 글을 작성해보세요!</p>
      </div>
    );
  }

  return (
    <div>
      <div className="space-y-4">
        {posts.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}
      </div>

      <div ref={sentinelRef} className="py-4 flex justify-center">
        {isFetchingNextPage && <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />}
      </div>
    </div>
  );
}
