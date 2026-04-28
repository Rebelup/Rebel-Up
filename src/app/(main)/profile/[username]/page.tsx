import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getProfileByUsername, getFollowerCount, getFollowingCount, getPostCount } from "@/lib/queries/users";
import { getProfilePosts } from "@/lib/queries/posts";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { PostCard } from "@/components/feed/PostCard";
import { FollowButton } from "@/components/profile/FollowButton";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Settings, Globe } from "lucide-react";

export async function generateMetadata({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  const supabase = await createClient();
  const profile = await getProfileByUsername(supabase, username);
  if (!profile) return {};
  return {
    title: `${profile.display_name} (@${profile.username}) | Rebel-Up`,
    description: profile.bio ?? `${profile.display_name}의 Rebel-Up 프로필`,
  };
}

export default async function ProfilePage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const profile = await getProfileByUsername(supabase, username);
  if (!profile) notFound();

  const [followerCount, followingCount, postCount, posts] = await Promise.all([
    getFollowerCount(supabase, profile.id),
    getFollowingCount(supabase, profile.id),
    getPostCount(supabase, profile.id),
    getProfilePosts(supabase, { authorId: profile.id, page: 0 }),
  ]);

  const isOwnProfile = user.id === profile.id;

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/feed" className="text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="font-semibold">프로필</h1>
      </div>

      <div className="bg-card border rounded-xl p-6 mb-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <Avatar className="w-16 h-16">
              <AvatarImage src={profile.avatar_url ?? undefined} />
              <AvatarFallback className="text-xl">
                {profile.display_name.slice(0, 2)}
              </AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-lg font-bold">{profile.display_name}</h2>
              <p className="text-sm text-muted-foreground">@{profile.username}</p>
            </div>
          </div>

          {isOwnProfile ? (
            <Button variant="outline" size="sm" asChild>
              <Link href="/profile/edit" className="gap-1.5">
                <Settings className="w-4 h-4" />
                편집
              </Link>
            </Button>
          ) : (
            <FollowButton followerId={user.id} followingId={profile.id} />
          )}
        </div>

        {profile.bio && (
          <p className="mt-4 text-sm whitespace-pre-wrap">{profile.bio}</p>
        )}

        {profile.website && (
          <a
            href={profile.website}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 flex items-center gap-1 text-sm text-primary hover:underline w-fit"
          >
            <Globe className="w-3.5 h-3.5" />
            {profile.website.replace(/^https?:\/\//, "")}
          </a>
        )}

        <div className="mt-4 flex gap-6">
          <div className="text-center">
            <p className="font-bold text-lg">{postCount}</p>
            <p className="text-xs text-muted-foreground">게시글</p>
          </div>
          <div className="text-center">
            <p className="font-bold text-lg">{followerCount}</p>
            <p className="text-xs text-muted-foreground">팔로워</p>
          </div>
          <div className="text-center">
            <p className="font-bold text-lg">{followingCount}</p>
            <p className="text-xs text-muted-foreground">팔로잉</p>
          </div>
        </div>
      </div>

      <div>
        <h3 className="font-semibold mb-4">게시글</h3>
        {posts.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            아직 게시글이 없어요.
          </p>
        ) : (
          <div className="space-y-4">
            {posts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
