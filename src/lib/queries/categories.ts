import { SupabaseClient } from "@supabase/supabase-js";
import { Category } from "@/lib/types";

export async function getCategories(
  supabase: SupabaseClient,
  activeOnly = false
): Promise<Category[]> {
  let query = supabase
    .from("categories")
    .select("*")
    .order("display_order", { ascending: true });

  if (activeOnly) query = query.eq("is_active", true);

  const { data, error } = await query;
  if (error) throw error;
  return (data as Category[]) ?? [];
}

export async function createCategory(
  supabase: SupabaseClient,
  data: Pick<Category, "slug" | "label" | "color" | "display_order">
): Promise<Category> {
  const { data: created, error } = await supabase
    .from("categories")
    .insert(data)
    .select()
    .single();
  if (error) throw error;
  return created as Category;
}

export async function updateCategory(
  supabase: SupabaseClient,
  id: string,
  updates: Partial<Pick<Category, "label" | "color" | "display_order" | "is_active" | "slug">>
): Promise<void> {
  const { error } = await supabase.from("categories").update(updates).eq("id", id);
  if (error) throw error;
}

export async function deleteCategory(supabase: SupabaseClient, id: string): Promise<void> {
  const { error } = await supabase.from("categories").delete().eq("id", id);
  if (error) throw error;
}
