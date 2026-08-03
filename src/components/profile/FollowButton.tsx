"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { getFollowStatus, followUser, unfollowUser } from "@/lib/queries/follows";
import { toast } from "sonner";
import { UserPlus, UserMinus } from "lucide-react";
import posthog from "posthog-js";

interface FollowButtonProps {
  followerId: string;
  followingId: string;
  onFollowChange?: (isFollowing: boolean) => void;
}

export function FollowButton({ followerId, followingId, onFollowChange }: FollowButtonProps) {
  const [supabase] = useState(() => createClient());
  const [following, setFollowing] = useState(false);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    getFollowStatus(supabase, followerId, followingId).then(setFollowing);
  }, [followerId, followingId]); // eslint-disable-line react-hooks/exhaustive-deps

  const toggle = async () => {
    if (pending) return;
    setPending(true);

    const prev = following;
    setFollowing(!prev);
    onFollowChange?.(!prev);

    try {
      if (prev) {
        await unfollowUser(supabase, followerId, followingId);
        posthog.capture("user_unfollowed", { followed_user_id: followingId });
      } else {
        await followUser(supabase, followerId, followingId);
        posthog.capture("user_followed", { followed_user_id: followingId });
      }
    } catch {
      setFollowing(prev);
      onFollowChange?.(prev);
      toast.error("다시 시도해주세요.");
    } finally {
      setPending(false);
    }
  };

  return (
    <Button
      variant={following ? "outline" : "default"}
      size="sm"
      onClick={toggle}
      disabled={pending}
      className="gap-1.5"
    >
      {following ? (
        <>
          <UserMinus className="w-4 h-4" />
          팔로잉
        </>
      ) : (
        <>
          <UserPlus className="w-4 h-4" />
          팔로우
        </>
      )}
    </Button>
  );
}
