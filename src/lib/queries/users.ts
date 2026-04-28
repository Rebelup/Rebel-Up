import { SupabaseClient } from "@supabase/supabase-js";
import { Profile } from "@/lib/types";

export async function getProfileByUsername(
  supabase: SupabaseClient,
  username: string
): Promise<Profile | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("username", username)
    .single();

  if (error) return null;
  return data as Profile;
}

export async function getProfileById(
  supabase: SupabaseClient,
  id: string
): Promise<Profile | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", id)
    .single();

  if (error) return null;
  return data as Profile;
}

export async function updateProfile(
  supabase: SupabaseClient,
  id: string,
  updates: Partial<Pick<Profile, "username" | "display_name" | "bio" | "website" | "avatar_url" | "onboarding_complete">>
): Promise<Profile> {
  const { data, error } = await supabase
    .from("profiles")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data as Profile;
}

export async function checkUsernameAvailable(
  supabase: SupabaseClient,
  username: string,
  excludeId?: string
): Promise<boolean> {
  let query = supabase
    .from("profiles")
    .select("id")
    .eq("username", username);

  if (excludeId) {
    query = query.neq("id", excludeId);
  }

  const { data } = await query;
  return !data || data.length === 0;
}

export async function getFollowerCount(supabase: SupabaseClient, userId: string): Promise<number> {
  const { count } = await supabase
    .from("follows")
    .select("*", { count: "exact", head: true })
    .eq("following_id", userId);
  return count ?? 0;
}

export async function getFollowingCount(supabase: SupabaseClient, userId: string): Promise<number> {
  const { count } = await supabase
    .from("follows")
    .select("*", { count: "exact", head: true })
    .eq("follower_id", userId);
  return count ?? 0;
}

export async function getPostCount(supabase: SupabaseClient, userId: string): Promise<number> {
  const { count } = await supabase
    .from("posts")
    .select("*", { count: "exact", head: true })
    .eq("author_id", userId);
  return count ?? 0;
}
