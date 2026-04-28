import { SupabaseClient } from "@supabase/supabase-js";

export async function getLikeStatus(
  supabase: SupabaseClient,
  postId: string,
  userId: string
): Promise<boolean> {
  const { data } = await supabase
    .from("likes")
    .select("id")
    .eq("post_id", postId)
    .eq("user_id", userId)
    .maybeSingle();

  return !!data;
}

export async function addLike(
  supabase: SupabaseClient,
  postId: string,
  userId: string
): Promise<void> {
  const { error } = await supabase
    .from("likes")
    .insert({ post_id: postId, user_id: userId });
  if (error && error.code !== "23505") throw error; // ignore duplicate
}

export async function removeLike(
  supabase: SupabaseClient,
  postId: string,
  userId: string
): Promise<void> {
  const { error } = await supabase
    .from("likes")
    .delete()
    .eq("post_id", postId)
    .eq("user_id", userId);
  if (error) throw error;
}
