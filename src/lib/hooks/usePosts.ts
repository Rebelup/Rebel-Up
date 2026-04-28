"use client";

import { useMemo } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { getFeedPosts } from "@/lib/queries/posts";
import { PAGE_SIZE } from "@/lib/constants";

export function usePosts(category: string) {
  const supabase = useMemo(() => createClient(), []);

  return useInfiniteQuery({
    queryKey: ["posts", category],
    queryFn: ({ pageParam = 0 }) =>
      getFeedPosts(supabase, { category, page: pageParam as number }),
    getNextPageParam: (lastPage, allPages) => {
      if (lastPage.length < PAGE_SIZE) return undefined;
      return allPages.length;
    },
    initialPageParam: 0,
    staleTime: 60_000,
  });
}
