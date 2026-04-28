"use client";

import Link from "next/link";
import Image from "next/image";
import { Heart, MessageCircle } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Post } from "@/lib/types";
import { formatRelativeTime, truncate } from "@/lib/utils";
import { CATEGORY_COLORS, CATEGORY_LABELS } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface PostCardProps {
  post: Post;
}

export function PostCard({ post }: PostCardProps) {
  const author = post.profiles;
  const firstImage = post.image_urls?.[0];

  return (
    <Link href={`/post/${post.id}`} className="block group">
      <article className="bg-card border rounded-xl overflow-hidden hover:shadow-md transition-shadow">
        {firstImage && (
          <div className="relative aspect-video w-full overflow-hidden">
            <Image
              src={firstImage}
              alt={post.title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
              sizes="(max-width: 768px) 100vw, 672px"
            />
          </div>
        )}
        <div className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <span
              className={cn(
                "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
                CATEGORY_COLORS[post.category] ?? "bg-gray-100 text-gray-700"
              )}
            >
              {CATEGORY_LABELS[post.category] ?? post.category}
            </span>
          </div>

          <h2 className="font-semibold text-foreground text-base leading-snug mb-1 group-hover:text-primary transition-colors">
            {post.title}
          </h2>
          <p className="text-sm text-muted-foreground line-clamp-2">
            {truncate(post.content, 120)}
          </p>

          <div className="mt-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Avatar className="w-6 h-6">
                <AvatarImage src={author?.avatar_url ?? undefined} />
                <AvatarFallback className="text-[10px]">
                  {author?.display_name?.slice(0, 2) ?? "?"}
                </AvatarFallback>
              </Avatar>
              <span className="text-xs text-muted-foreground">
                {author?.display_name ?? "알 수 없음"}
              </span>
              <span className="text-xs text-muted-foreground">·</span>
              <span className="text-xs text-muted-foreground">
                {formatRelativeTime(post.created_at)}
              </span>
            </div>

            <div className="flex items-center gap-3 text-muted-foreground">
              <span className="flex items-center gap-1 text-xs">
                <Heart className="w-3.5 h-3.5" />
                {post.like_count}
              </span>
              <span className="flex items-center gap-1 text-xs">
                <MessageCircle className="w-3.5 h-3.5" />
                {post.comment_count}
              </span>
            </div>
          </div>
        </div>
      </article>
    </Link>
  );
}
