import { SupabaseClient } from "@supabase/supabase-js";
import { Comment } from "@/lib/types";

export async function getComments(supabase: SupabaseClient, postId: string): Promise<Comment[]> {
  const { data, error } = await supabase
    .from("comments")
    .select("*, profiles(id, username, display_name, avatar_url)")
    .eq("post_id", postId)
    .order("created_at", { ascending: true });

  if (error) throw error;
  return (data as Comment[]) ?? [];
}

export async function addComment(
  supabase: SupabaseClient,
  { postId, authorId, content }: { postId: string; authorId: string; content: string }
): Promise<Comment> {
  const { data, error } = await supabase
    .from("comments")
    .insert({ post_id: postId, author_id: authorId, content })
    .select("*, profiles(id, username, display_name, avatar_url)")
    .single();

  if (error) throw error;
  return data as Comment;
}

export async function deleteComment(supabase: SupabaseClient, id: string): Promise<void> {
  const { error } = await supabase.from("comments").delete().eq("id", id);
  if (error) throw error;
}
