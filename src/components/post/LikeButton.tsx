"use client";

import { useState, useEffect } from "react";
import { Heart } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { getLikeStatus, addLike, removeLike } from "@/lib/queries/likes";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import posthog from "posthog-js";

interface LikeButtonProps {
  postId: string;
  initialCount: number;
  userId: string;
}

export function LikeButton({ postId, initialCount, userId }: LikeButtonProps) {
  const [supabase] = useState(() => createClient());
  const [liked, setLiked] = useState(false);
  const [count, setCount] = useState(initialCount);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    getLikeStatus(supabase, postId, userId).then(setLiked);
  }, [postId, userId]); // eslint-disable-line react-hooks/exhaustive-deps

  const toggle = async () => {
    if (pending) return;
    setPending(true);

    const prev = liked;
    setLiked(!prev);
    setCount((c) => (prev ? c - 1 : c + 1));

    try {
      if (prev) {
        await removeLike(supabase, postId, userId);
        posthog.capture("post_unliked", { post_id: postId });
      } else {
        await addLike(supabase, postId, userId);
        posthog.capture("post_liked", { post_id: postId });
      }
    } catch {
      setLiked(prev);
      setCount((c) => (prev ? c + 1 : c - 1));
      toast.error("다시 시도해주세요.");
    } finally {
      setPending(false);
    }
  };

  return (
    <button
      onClick={toggle}
      disabled={pending}
      className={cn(
        "flex items-center gap-1.5 px-4 py-2 rounded-full border text-sm font-medium transition-all",
        liked
          ? "bg-red-50 border-red-200 text-red-500 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400"
          : "border-border text-muted-foreground hover:border-red-200 hover:text-red-400"
      )}
    >
      <Heart className={cn("w-4 h-4", liked && "fill-current")} />
      <span>{count}</span>
    </button>
  );
}
