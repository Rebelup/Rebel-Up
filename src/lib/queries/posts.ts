import { SupabaseClient } from "@supabase/supabase-js";
import { Post } from "@/lib/types";
import { PAGE_SIZE } from "@/lib/constants";

export async function getFeedPosts(
  supabase: SupabaseClient,
  { category, page }: { category?: string; page: number }
): Promise<Post[]> {
  const from = page * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  let query = supabase
    .from("posts")
    .select("*, profiles(id, username, display_name, avatar_url)")
    .order("created_at", { ascending: false })
    .range(from, to);

  if (category && category !== "all") {
    query = query.eq("category", category);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data as Post[]) ?? [];
}

export async function getPostById(supabase: SupabaseClient, id: string): Promise<Post | null> {
  const { data, error } = await supabase
    .from("posts")
    .select("*, profiles(id, username, display_name, avatar_url)")
    .eq("id", id)
    .single();

  if (error) return null;
  return data as Post;
}

export async function createPost(
  supabase: SupabaseClient,
  {
    title,
    content,
    category,
    image_urls,
    author_id,
  }: {
    title: string;
    content: string;
    category: string;
    image_urls: string[];
    author_id: string;
  }
): Promise<Post> {
  const { data, error } = await supabase
    .from("posts")
    .insert({ title, content, category, image_urls, author_id })
    .select("*, profiles(id, username, display_name, avatar_url)")
    .single();

  if (error) throw error;
  return data as Post;
}

export async function deletePost(supabase: SupabaseClient, id: string): Promise<void> {
  const { error } = await supabase.from("posts").delete().eq("id", id);
  if (error) throw error;
}

export async function getProfilePosts(
  supabase: SupabaseClient,
  { authorId, page }: { authorId: string; page: number }
): Promise<Post[]> {
  const from = page * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const { data, error } = await supabase
    .from("posts")
    .select("*, profiles(id, username, display_name, avatar_url)")
    .eq("author_id", authorId)
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error) throw error;
  return (data as Post[]) ?? [];
}
