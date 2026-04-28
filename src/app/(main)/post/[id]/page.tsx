import { notFound, redirect } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getPostById } from "@/lib/queries/posts";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LikeButton } from "@/components/post/LikeButton";
import { CommentSection } from "@/components/post/CommentSection";
import { CATEGORY_COLORS, CATEGORY_LABELS } from "@/lib/constants";
import { formatRelativeTime } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { ArrowLeft, MessageCircle } from "lucide-react";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const post = await getPostById(supabase, id);
  if (!post) return {};
  return {
    title: `${post.title} | Rebel-Up`,
    description: post.content.slice(0, 150),
  };
}

export default async function PostDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: { user } }, post] = await Promise.all([
    supabase.auth.getUser(),
    getPostById(supabase, id),
  ]);

  if (!user) redirect("/login");
  if (!post) notFound();

  const author = post.profiles;

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/feed" className="text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
      </div>

      <article>
        <div className="mb-4">
          <span
            className={cn(
              "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
              CATEGORY_COLORS[post.category] ?? "bg-gray-100 text-gray-700"
            )}
          >
            {CATEGORY_LABELS[post.category] ?? post.category}
          </span>
        </div>

        <h1 className="text-2xl font-bold mb-4">{post.title}</h1>

        <div className="flex items-center gap-3 mb-6">
          <Link href={`/profile/${author?.username}`}>
            <Avatar className="w-9 h-9">
              <AvatarImage src={author?.avatar_url ?? undefined} />
              <AvatarFallback>{author?.display_name?.slice(0, 2) ?? "?"}</AvatarFallback>
            </Avatar>
          </Link>
          <div>
            <Link
              href={`/profile/${author?.username}`}
              className="text-sm font-medium hover:underline"
            >
              {author?.display_name}
            </Link>
            <p className="text-xs text-muted-foreground">{formatRelativeTime(post.created_at)}</p>
          </div>
        </div>

        {post.image_urls && post.image_urls.length > 0 && (
          <div className="mb-6 space-y-3">
            {post.image_urls.map((url, i) => (
              <div key={i} className="relative rounded-xl overflow-hidden">
                <Image
                  src={url}
                  alt={`이미지 ${i + 1}`}
                  width={800}
                  height={600}
                  className="w-full h-auto object-cover"
                />
              </div>
            ))}
          </div>
        )}

        <div className="prose prose-sm max-w-none text-foreground">
          <p className="whitespace-pre-wrap leading-relaxed">{post.content}</p>
        </div>

        <div className="mt-6 pt-4 border-t flex items-center gap-3">
          <LikeButton
            postId={post.id}
            initialCount={post.like_count}
            userId={user.id}
          />
          <div className="flex items-center gap-1.5 px-4 py-2 rounded-full border border-border text-sm font-medium text-muted-foreground">
            <MessageCircle className="w-4 h-4" />
            <span>{post.comment_count}</span>
          </div>
        </div>

        <div className="border-t mt-6 pt-2">
          <CommentSection postId={post.id} currentUserId={user.id} />
        </div>
      </article>
    </div>
  );
}
